import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreditLot, CreditScope, CreditSource, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { PAYMENT_PROVIDER, PaymentProvider } from "./payment/payment-provider";
import { PaypalService } from "./payment/paypal.service";
import { isLotEligible, LotCandidate, pickLot } from "./lot-selection.util";

type Tx = Prisma.TransactionClient;

export const FREE_PRODUCT_CODE = "FREE";

// The ledger has no "unlimited" concept (credits is a required, non-nullable
// Int) - an "unlimited" product/lot is really just a very large finite
// number (Premium ships with 100,000). This threshold is purely a display
// decision: anything at or above it is shown to users as "Unlimited"
// instead of the raw count. It has no effect on debiting/eligibility -
// debitLot/pickLot are magnitude-agnostic and are untouched by this.
export const UNLIMITED_CREDITS_THRESHOLD = 50_000;

// Interactive transactions default to a 5s timeout, which a remote database
// can exceed on multi-statement work.
export const TX_OPTIONS = { maxWait: 15000, timeout: 30000 };

interface CreateLotArgs {
  userId: string;
  scopeType: CreditScope;
  examId: string | null;
  credits: number;
  validityDays: number | null;
  questionFraction: number;
  source: CreditSource;
  purchaseId?: string;
  actorId?: string;
  note?: string;
}

export interface AdminGrantInput {
  userId: string;
  credits: number;
  scopeType: CreditScope;
  examId?: string;
  validityDays?: number;
  questionFraction?: number;
  reason: string;
}

export interface ProductInput {
  code: string;
  name: string;
  scopeType: CreditScope;
  examId?: string | null;
  credits: number;
  priceCents: number;
  currency?: string;
  validityDays?: number | null;
  questionFraction?: number;
  isActive?: boolean;
}

@Injectable()
export class CreditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
    private readonly paypal: PaypalService,
  ) {}

  // ---------------------------------------------------------------------
  // Consumption. AttemptsService calls these inside ITS transaction so that
  // "verify credit -> create attempt -> debit credit" is one atomic unit.
  // ---------------------------------------------------------------------

  // Serialises every credit operation for one user. A second device starting
  // an exam blocks here until the first transaction commits, then sees the
  // already-decremented balance - one credit can never yield two attempts.
  async lockUserCredits(tx: Tx, userId: string): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
  }

  async reserveLot(tx: Tx, userId: string, examId: string): Promise<CreditLot> {
    // ORG_GRANT lots are excluded here - they can only be spent through the
    // explicit one-time access-code path (see OrganizationsService.redeemAccessCode),
    // never silently picked by the ordinary pickLot ordering.
    const lots = await tx.creditLot.findMany({
      where: { userId, remaining: { gt: 0 }, source: { not: "ORG_GRANT" } },
    });
    const lot = pickLot(lots as LotCandidate[], examId, new Date());
    if (!lot) {
      throw new HttpException(
        "No eligible attempt credits for this exam. Buy more attempts, or use Practice mode (free).",
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    return lot as CreditLot;
  }

  async debitLot(tx: Tx, lot: CreditLot, userId: string, attemptId: string): Promise<void> {
    const updated = await tx.creditLot.updateMany({
      where: { id: lot.id, remaining: { gt: 0 } },
      data: { remaining: { decrement: 1 } },
    });
    if (updated.count !== 1) {
      throw new HttpException("Attempt credit was already used.", HttpStatus.PAYMENT_REQUIRED);
    }
    await tx.creditTransaction.create({
      data: { userId, lotId: lot.id, amount: -1, reason: "EXAM_STARTED", attemptId },
    });
  }

  // ---------------------------------------------------------------------
  // Granting
  // ---------------------------------------------------------------------

  private async createLot(tx: Tx, args: CreateLotArgs) {
    const expiresAt = args.validityDays ? new Date(Date.now() + args.validityDays * 86_400_000) : null;
    const lot = await tx.creditLot.create({
      data: {
        userId: args.userId,
        scopeType: args.scopeType,
        examId: args.scopeType === "EXAM" ? args.examId : null,
        granted: args.credits,
        remaining: args.credits,
        expiresAt,
        questionFraction: args.questionFraction,
        source: args.source,
        purchaseId: args.purchaseId,
      },
    });
    await tx.creditTransaction.create({
      data: {
        userId: args.userId,
        lotId: lot.id,
        amount: args.credits,
        reason: "GRANT",
        actorId: args.actorId,
        note: args.note,
      },
    });
    return lot;
  }

  // A single 1-attempt, EXAM-scoped lot backing one organization access
  // code (see OrganizationsService.issueAccess). Takes a `Tx` so the lot and
  // its paired OrganizationExamAccessCode row are created atomically.
  async grantOrgAccess(
    tx: Tx,
    args: { userId: string; examId: string; actorId: string; note?: string },
  ): Promise<CreditLot> {
    return this.createLot(tx, {
      userId: args.userId,
      scopeType: "EXAM",
      examId: args.examId,
      credits: 1,
      validityDays: null,
      questionFraction: 1,
      source: "ORG_GRANT",
      actorId: args.actorId,
      note: args.note,
    });
  }

  // The free plan is an ordinary product (code FREE) granted through the same
  // lot mechanism - there is no special-case "free attempts" code path.
  // Core logic, taking an already-open `tx` so callers that need this to
  // participate in a larger transaction (e.g. OrganizationsService.addMember
  // granting the free plan atomically with creating the account) can do so.
  // `grantFreePlan` below is the standalone wrapper used by AuthService.register().
  async grantFreePlanInTx(tx: Tx, userId: string) {
    const product = await tx.product.findUnique({ where: { code: FREE_PRODUCT_CODE } });
    if (!product || !product.isActive) return null;

    const existing = await tx.creditLot.findFirst({ where: { userId, source: "FREE_PLAN" } });
    if (existing) return existing;

    return this.createLot(tx, {
      userId,
      scopeType: product.scopeType,
      examId: product.examId,
      credits: product.credits,
      validityDays: product.validityDays,
      questionFraction: product.questionFraction,
      source: "FREE_PLAN",
      note: "Free plan",
    });
  }

  async grantFreePlan(userId: string) {
    return this.prisma.$transaction((tx) => this.grantFreePlanInTx(tx, userId), TX_OPTIONS);
  }

  async purchase(userId: string, productId: string) {
    const product = await this.requirePurchasableProduct(productId);

    const payment = await this.payments.charge({
      userId,
      amountCents: product.priceCents,
      currency: product.currency,
      description: product.name,
    });

    if (!payment.ok) {
      await this.recordFailedPurchase(userId, product, payment.providerRef);
      throw new HttpException(
        `Payment failed${payment.failureReason ? `: ${payment.failureReason}` : ""}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return this.grantPurchase(userId, product, payment.providerRef);
  }

  // ---------------------------------------------------------------------
  // PayPal checkout (Orders v2 API: create on the server from the product's
  // real price, then capture after the buyer approves in the PayPal popup).
  // ---------------------------------------------------------------------

  async createPaypalOrder(userId: string, productId: string, redirect?: { returnUrl: string; cancelUrl: string }) {
    const product = await this.requirePurchasableProduct(productId);
    return this.paypal.createOrder(product.priceCents, product.currency, product.name, redirect);
  }

  async capturePaypalOrder(userId: string, productId: string, orderId: string) {
    const product = await this.requirePurchasableProduct(productId);

    const capture = await this.paypal.captureOrder(orderId, product.priceCents, product.currency);
    if (!capture.ok) {
      await this.recordFailedPurchase(userId, product, capture.providerRef);
      throw new HttpException(
        `Payment failed${capture.failureReason ? `: ${capture.failureReason}` : ""}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return this.grantPurchase(userId, product, capture.providerRef);
  }

  private async requirePurchasableProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      throw new NotFoundException("Product not found");
    }
    if (product.code === FREE_PRODUCT_CODE) {
      throw new BadRequestException("The free plan is granted automatically and cannot be purchased.");
    }
    return product;
  }

  private recordFailedPurchase(userId: string, product: { id: string; priceCents: number; currency: string }, providerRef?: string) {
    return this.prisma.purchase.create({
      data: {
        userId,
        productId: product.id,
        status: "FAILED",
        amountCents: product.priceCents,
        currency: product.currency,
        providerRef,
      },
    });
  }

  private grantPurchase(
    userId: string,
    product: {
      id: string;
      name: string;
      priceCents: number;
      currency: string;
      scopeType: CreditScope;
      examId: string | null;
      credits: number;
      validityDays: number | null;
      questionFraction: number;
    },
    providerRef?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          userId,
          productId: product.id,
          status: "COMPLETED",
          amountCents: product.priceCents,
          currency: product.currency,
          providerRef,
        },
      });
      const lot = await this.createLot(tx, {
        userId,
        scopeType: product.scopeType,
        examId: product.examId,
        credits: product.credits,
        validityDays: product.validityDays,
        questionFraction: product.questionFraction,
        source: "PURCHASE",
        purchaseId: purchase.id,
        note: product.name,
      });
      return { purchase, lot };
    }, TX_OPTIONS);
  }

  // ---------------------------------------------------------------------
  // Reading
  // ---------------------------------------------------------------------

  async getWallet(userId: string, examId?: string) {
    const now = new Date();
    const lots = await this.prisma.creditLot.findMany({
      where: { userId, remaining: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { createdAt: "asc" },
    });

    const examIds = [...new Set(lots.map((l) => l.examId).filter((id): id is string => !!id))];
    const exams = examIds.length
      ? await this.prisma.exam.findMany({ where: { id: { in: examIds } }, select: { id: true, title: true } })
      : [];
    const titleById = new Map(exams.map((e) => [e.id, e.title]));

    const result: {
      lots: unknown[];
      total: number;
      unlimited: boolean;
      eligible?: { total: number; fullExam: number; limited: number };
    } = {
      lots: lots.map((lot) => ({
        id: lot.id,
        scopeType: lot.scopeType,
        examId: lot.examId,
        examTitle: lot.examId ? (titleById.get(lot.examId) ?? null) : null,
        granted: lot.granted,
        remaining: lot.remaining,
        expiresAt: lot.expiresAt,
        questionFraction: lot.questionFraction,
        source: lot.source,
        unlimited: lot.granted >= UNLIMITED_CREDITS_THRESHOLD,
      })),
      total: lots.reduce((sum, lot) => sum + lot.remaining, 0),
      unlimited: lots.some((lot) => lot.granted >= UNLIMITED_CREDITS_THRESHOLD),
    };

    if (examId) {
      const eligible = lots.filter((lot) => isLotEligible(lot as LotCandidate, examId, now));
      const sum = (list: typeof eligible) => list.reduce((s, l) => s + l.remaining, 0);
      result.eligible = {
        total: sum(eligible),
        fullExam: sum(eligible.filter((l) => l.questionFraction >= 1)),
        limited: sum(eligible.filter((l) => l.questionFraction < 1)),
      };
    }
    return result;
  }

  listTransactions(userId: string, take = 100) {
    return this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      include: { lot: { select: { scopeType: true, examId: true, source: true } } },
    });
  }

  // The FREE/Basic product is included here (unlike before this pricing
  // change) so the public pricing page can render it as an ordinary card
  // alongside the paid tiers, fully data-driven - purchase() still rejects
  // actually buying it (it's granted automatically at signup), so this is
  // safe to list.
  async listActiveProducts(examId?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(examId ? { OR: [{ examId }, { scopeType: "GLOBAL" }] } : {}),
      },
      orderBy: { priceCents: "asc" },
    });
    return products.map((p) => ({ ...p, unlimited: p.credits >= UNLIMITED_CREDITS_THRESHOLD }));
  }

  // ---------------------------------------------------------------------
  // Admin: every change is a ledger row with actor + reason, plus an audit
  // log entry. Balances are never edited silently.
  // ---------------------------------------------------------------------

  async adminGrant(actorId: string, input: AdminGrantInput) {
    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new NotFoundException("User not found");

    if (input.scopeType === "EXAM") {
      if (!input.examId) throw new BadRequestException("examId is required for EXAM-scoped credits");
      const exam = await this.prisma.exam.findUnique({ where: { id: input.examId } });
      if (!exam) throw new NotFoundException("Exam not found");
    } else if (input.examId) {
      throw new BadRequestException("GLOBAL credits must not specify an examId");
    }

    const lot = await this.prisma.$transaction(
      (tx) =>
        this.createLot(tx, {
          userId: input.userId,
          scopeType: input.scopeType,
          examId: input.examId ?? null,
          credits: input.credits,
          validityDays: input.validityDays ?? null,
          questionFraction: input.questionFraction ?? 1,
          source: "ADMIN_GRANT",
          actorId,
          note: input.reason,
        }),
      TX_OPTIONS,
    );

    await this.auditService.log({
      actorId,
      action: "credits.granted",
      entityType: "CreditLot",
      entityId: lot.id,
      after: lot,
      description: input.reason,
    });
    return lot;
  }

  async adminRefundAttempt(actorId: string, attemptId: string, reason: string) {
    const ledger = await this.prisma.$transaction(async (tx) => {
      const debit = await tx.creditTransaction.findUnique({
        where: { attemptId_reason: { attemptId, reason: "EXAM_STARTED" } },
        include: { lot: true },
      });
      if (!debit) {
        throw new NotFoundException("No credit was consumed for this attempt (practice attempts are free).");
      }

      await this.lockUserCredits(tx, debit.userId);

      const alreadyRefunded = await tx.creditTransaction.findUnique({
        where: { attemptId_reason: { attemptId, reason: "ADMIN_REFUND" } },
      });
      if (alreadyRefunded) throw new ConflictException("This attempt has already been refunded.");

      let lot = debit.lot;
      if (lot.expiresAt && lot.expiresAt <= new Date()) {
        // The original lot has expired; refund into a fresh non-expiring lot
        // rather than handing back credit that would be instantly worthless.
        lot = await tx.creditLot.create({
          data: {
            userId: debit.userId,
            scopeType: lot.scopeType,
            examId: lot.examId,
            granted: 1,
            remaining: 0,
            expiresAt: null,
            questionFraction: lot.questionFraction,
            source: "ADMIN_GRANT",
          },
        });
      }

      await tx.creditLot.update({ where: { id: lot.id }, data: { remaining: { increment: 1 } } });
      return tx.creditTransaction.create({
        data: {
          userId: debit.userId,
          lotId: lot.id,
          amount: 1,
          reason: "ADMIN_REFUND",
          attemptId,
          actorId,
          note: reason,
        },
      });
    }, TX_OPTIONS);

    await this.auditService.log({
      actorId,
      action: "credits.refunded",
      entityType: "Attempt",
      entityId: attemptId,
      after: ledger,
      description: reason,
    });
    return ledger;
  }

  // Core adjustment logic, taking an already-open `tx` so callers that need
  // this to participate in a larger transaction (e.g. OrganizationsService
  // voiding a lot atomically with issuing a new one) can do so. `adminAdjust`
  // below is the standalone public wrapper used by AdminCreditsController.
  async adjustLotInTx(tx: Tx, lotId: string, amount: number, actorId: string, reason: string) {
    const found = await tx.creditLot.findUnique({ where: { id: lotId } });
    if (!found) throw new NotFoundException("Credit lot not found");

    await this.lockUserCredits(tx, found.userId);

    const lot = await tx.creditLot.findUniqueOrThrow({ where: { id: lotId } });
    if (lot.remaining + amount < 0) {
      throw new BadRequestException(`Adjustment would take the lot below zero (remaining ${lot.remaining}).`);
    }
    await tx.creditLot.update({ where: { id: lotId }, data: { remaining: { increment: amount } } });
    return tx.creditTransaction.create({
      data: {
        userId: lot.userId,
        lotId,
        amount,
        reason: "ADMIN_ADJUSTMENT",
        actorId,
        note: reason,
      },
    });
  }

  async adminAdjust(actorId: string, lotId: string, amount: number, reason: string) {
    const ledger = await this.prisma.$transaction(
      (tx) => this.adjustLotInTx(tx, lotId, amount, actorId, reason),
      TX_OPTIONS,
    );

    await this.auditService.log({
      actorId,
      action: "credits.adjusted",
      entityType: "CreditLot",
      entityId: lotId,
      after: ledger,
      description: reason,
    });
    return ledger;
  }

  async adminListUsers(search?: string) {
    const users = await this.prisma.user.findMany({
      where: search ? { email: { contains: search, mode: "insensitive" } } : undefined,
      orderBy: { email: "asc" },
      take: 25,
      select: { id: true, email: true, role: true },
    });
    const now = new Date();
    const lots = await this.prisma.creditLot.findMany({
      where: {
        userId: { in: users.map((u) => u.id) },
        remaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    return users.map((user) => ({
      ...user,
      credits: lots.filter((l) => l.userId === user.id).reduce((sum, l) => sum + l.remaining, 0),
      lots: lots
        .filter((l) => l.userId === user.id)
        .map((l) => ({ id: l.id, scopeType: l.scopeType, examId: l.examId, remaining: l.remaining })),
    }));
  }

  async adminUserAttempts(userId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        mode: true,
        status: true,
        startedAt: true,
        examVersion: { select: { versionLabel: true, exam: { select: { title: true } } } },
      },
    });
    const txs = await this.prisma.creditTransaction.findMany({
      where: { attemptId: { in: attempts.map((a) => a.id) } },
      select: { attemptId: true, reason: true },
    });
    return attempts.map((a) => ({
      id: a.id,
      mode: a.mode,
      status: a.status,
      startedAt: a.startedAt,
      examTitle: a.examVersion.exam.title,
      versionLabel: a.examVersion.versionLabel,
      creditConsumed: txs.some((t) => t.attemptId === a.id && t.reason === "EXAM_STARTED"),
      refunded: txs.some((t) => t.attemptId === a.id && t.reason === "ADMIN_REFUND"),
    }));
  }

  // ---------------------------------------------------------------------
  // Admin: product catalogue (pricing is data, not code)
  // ---------------------------------------------------------------------

  adminListProducts() {
    return this.prisma.product.findMany({ orderBy: [{ isActive: "desc" }, { priceCents: "asc" }] });
  }

  async adminCreateProduct(actorId: string, input: ProductInput) {
    if (input.scopeType === "EXAM" && !input.examId) {
      throw new BadRequestException("examId is required for EXAM-scoped products");
    }
    if (input.scopeType === "GLOBAL" && input.examId) {
      throw new BadRequestException("GLOBAL products must not specify an examId");
    }
    const existing = await this.prisma.product.findUnique({ where: { code: input.code } });
    if (existing) throw new ConflictException("A product with this code already exists");

    const product = await this.prisma.product.create({
      data: {
        code: input.code,
        name: input.name,
        scopeType: input.scopeType,
        examId: input.scopeType === "EXAM" ? input.examId : null,
        credits: input.credits,
        priceCents: input.priceCents,
        currency: input.currency ?? "USD",
        validityDays: input.validityDays ?? null,
        questionFraction: input.questionFraction ?? 1,
        isActive: input.isActive ?? true,
      },
    });
    await this.auditService.log({
      actorId,
      action: "product.created",
      entityType: "Product",
      entityId: product.id,
      after: product,
    });
    return product;
  }

  async adminUpdateProduct(actorId: string, id: string, input: Partial<ProductInput>) {
    const before = await this.prisma.product.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Product not found");

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        credits: input.credits,
        priceCents: input.priceCents,
        currency: input.currency,
        validityDays: input.validityDays,
        questionFraction: input.questionFraction,
        isActive: input.isActive,
      },
    });
    await this.auditService.log({
      actorId,
      action: "product.updated",
      entityType: "Product",
      entityId: id,
      before,
      after: product,
    });
    return product;
  }
}
