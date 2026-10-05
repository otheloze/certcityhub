import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { seedCatalogue } from "./seed-catalogue";

const prisma = new PrismaClient();

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "ChangeMe123!";

async function upsertUser(email: string, role: "ADMIN" | "STUDENT") {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, role },
  });
}

async function main() {
  const admin = await upsertUser("craigozor79@gmail.com", "ADMIN");
  const student = await upsertUser("student@example.com", "STUDENT");

  // --- Products: pricing and plans are data. The free plan (code FREE) is a
  // product too - it's the "Basic" tier of the current 4-tier pricing
  // structure (Basic/Silver/Gold/Premium). The code stays "FREE" because
  // AuthService.register()/grantFreePlan() look it up by that literal
  // constant; only the tier's own name/price/credits/validity change.
  const products = [
    { code: "FREE", name: "Basic", scopeType: "GLOBAL" as const, examId: null, credits: 1, priceCents: 0, validityDays: 90, questionFraction: 0.25 },
    { code: "SILVER", name: "Silver", scopeType: "GLOBAL" as const, examId: null, credits: 5, priceCents: 299, validityDays: 90, questionFraction: 1 },
    { code: "GOLD", name: "Gold", scopeType: "GLOBAL" as const, examId: null, credits: 10, priceCents: 799, validityDays: 90, questionFraction: 1 },
    // "Unlimited" isn't a concept the credit ledger supports (credits is a
    // required, non-nullable Int) - this is a large practical stand-in the
    // API/UI layer recognizes via UNLIMITED_CREDITS_THRESHOLD and displays
    // as "Unlimited" rather than the raw number.
    { code: "PREMIUM", name: "Premium", scopeType: "GLOBAL" as const, examId: null, credits: 100000, priceCents: 1499, validityDays: 90, questionFraction: 1 },
  ];
  for (const product of products) {
    // `update: product` (not `{}`) so re-running seed against an already-
    // seeded database actually applies the new tier values, not just a no-op.
    await prisma.product.upsert({ where: { code: product.code }, update: product, create: product });
  }

  // Retired by the 4-tier pricing structure above - deactivated, not
  // deleted, so historical Purchase/CreditLot rows keep their FK intact.
  // updateMany (not upsert) so this safely no-ops on a fresh database that
  // never had these rows to begin with.
  const retiredProductCodes = ["DEMO-5", "DEMO-10", "ALL-25"];
  await prisma.product.updateMany({ where: { code: { in: retiredProductCodes } }, data: { isActive: false } });

  // Free-plan credits for the demo accounts (registration does this for new users).
  const freeProduct = await prisma.product.findUniqueOrThrow({ where: { code: "FREE" } });
  for (const user of [admin, student]) {
    const hasFree = await prisma.creditLot.findFirst({ where: { userId: user.id, source: "FREE_PLAN" } });
    if (hasFree) continue;
    const lot = await prisma.creditLot.create({
      data: {
        userId: user.id,
        scopeType: freeProduct.scopeType,
        examId: freeProduct.examId,
        granted: freeProduct.credits,
        remaining: freeProduct.credits,
        questionFraction: freeProduct.questionFraction,
        source: "FREE_PLAN",
      },
    });
    await prisma.creditTransaction.create({
      data: { userId: user.id, lotId: lot.id, amount: freeProduct.credits, reason: "GRANT", note: "Free plan" },
    });
  }

  const catalogue = await seedCatalogue(prisma, admin.id);

  console.log("Seed complete:", {
    catalogue,
    admin: admin.email,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
