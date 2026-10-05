import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreditLot, MemberStatus, OrgRole, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { Role } from "@examproject/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { CreditsService, TX_OPTIONS } from "../credits/credits.service";
import { AuditService } from "../audit/audit.service";
import { generateAccessCode, generateTempPassword, hashAccessCode } from "./org-secrets.util";
import { randomSlugSuffix, slugify } from "./org-slug.util";

type Tx = Prisma.TransactionClient;

const BCRYPT_COST = 12;

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: Role;
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditsService: CreditsService,
    private readonly auditService: AuditService,
  ) {}

  // ---------------------------------------------------------------------
  // Authorization
  // ---------------------------------------------------------------------

  // Tenant-scoped authority isn't expressible with the global role-based
  // RolesGuard, so every org-scoped method resolves and checks it
  // explicitly - the same ad hoc ownership-check pattern already used
  // elsewhere in this codebase (e.g. TopicsService.assertVersionIsDraft).
  // The org an org-admin caller manages, resolved from their own membership -
  // every /organizations/me/* route uses this rather than trusting a client-
  // supplied organizationId.
  async requireCallerOrg(requester: CurrentUserPayload) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { userId: requester.userId },
      include: { organization: true },
    });
    if (!member || member.status !== MemberStatus.ACTIVE || member.orgRole !== OrgRole.ORG_ADMIN) {
      throw new ForbiddenException("You are not an organization administrator");
    }
    return member.organization;
  }

  async findActiveMembership(userId: string, organizationId: string) {
    const member = await this.prisma.organizationMember.findUnique({ where: { userId } });
    if (!member || member.organizationId !== organizationId || member.status !== MemberStatus.ACTIVE) {
      return null;
    }
    return member;
  }

  // ---------------------------------------------------------------------
  // Attempt-start integration (called from AttemptsService.start())
  // ---------------------------------------------------------------------

  // Reads through the caller's own transaction when given one (the usual
  // case, called from inside AttemptsService.start()'s transaction) so this
  // check is always perfectly consistent with the redemption/debit that
  // follows in the same transaction, and doesn't spend an extra connection
  // out of this environment's tightly constrained pool.
  async hasUnusedAccessCode(userId: string, examId: string, client: Tx | PrismaService = this.prisma): Promise<boolean> {
    const member = await client.organizationMember.findUnique({ where: { userId } });
    if (!member || member.status !== MemberStatus.ACTIVE) return false;
    const count = await client.organizationExamAccessCode.count({
      where: { memberId: member.id, examId, status: "UNUSED" },
    });
    return count > 0;
  }

  async redeemAccessCode(
    tx: Tx,
    userId: string,
    examId: string,
    plaintextCode: string,
  ): Promise<{ lot: CreditLot; codeId: string }> {
    const member = await tx.organizationMember.findUnique({ where: { userId } });
    if (!member || member.status !== MemberStatus.ACTIVE) {
      throw new NotFoundException("No organization access code found for this exam");
    }

    const codeHash = hashAccessCode(plaintextCode);
    const code = await tx.organizationExamAccessCode.findFirst({
      where: { memberId: member.id, examId, status: "UNUSED", codeHash },
      include: { creditLot: true },
    });
    // Deliberately the same "not found" shape whether the code is wrong or
    // belongs to a different member - never confirm a code's validity to
    // the wrong account.
    if (!code) {
      throw new NotFoundException("No organization access code found for this exam");
    }
    if (code.creditLot.remaining < 1) {
      throw new NotFoundException("No organization access code found for this exam");
    }

    return { lot: code.creditLot, codeId: code.id };
  }

  // Conditional update mirrors CreditsService.debitLot's own belt-and-
  // suspenders pattern: a race can't mark (and thereby "spend") the same
  // code twice even if the caller's advisory lock is ever refactored away.
  async markAccessCodeUsed(tx: Tx, codeId: string, attemptId: string): Promise<void> {
    const updated = await tx.organizationExamAccessCode.updateMany({
      where: { id: codeId, status: "UNUSED" },
      data: { status: "USED", attemptId, usedAt: new Date() },
    });
    if (updated.count !== 1) {
      throw new ConflictException("This organization access code was already used.");
    }
  }

  // ---------------------------------------------------------------------
  // Ownership checks for the org-scoped exam CMS (OrgExamsController).
  // TopicsService/QuestionsService/ExamVersionsService know nothing about
  // organizations and will happily mutate any id handed to them, so every
  // org-scoped CMS route asserts ownership here before delegating to those
  // unmodified, shared services.
  // ---------------------------------------------------------------------

  async assertOwnsExam(organizationId: string, examId: string): Promise<void> {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.organizationId !== organizationId) {
      throw new NotFoundException("Exam not found");
    }
  }

  async assertOwnsExamVersion(organizationId: string, examVersionId: string): Promise<void> {
    const version = await this.prisma.examVersion.findUnique({
      where: { id: examVersionId },
      include: { exam: true },
    });
    if (!version || version.exam.organizationId !== organizationId) {
      throw new NotFoundException("Exam version not found");
    }
  }

  async assertOwnsTopic(organizationId: string, topicId: string): Promise<void> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: { examVersion: { include: { exam: true } } },
    });
    if (!topic || topic.examVersion.exam.organizationId !== organizationId) {
      throw new NotFoundException("Topic not found");
    }
  }

  async assertOwnsQuestion(organizationId: string, questionId: string): Promise<void> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { exam: true },
    });
    if (!question || question.exam.organizationId !== organizationId) {
      throw new NotFoundException("Question not found");
    }
  }

  // ---------------------------------------------------------------------
  // Platform-admin: organization provisioning
  // ---------------------------------------------------------------------

  async createOrganization(name: string, actorId: string) {
    const org = await this.createOrganizationRecord(name);
    await this.auditService.log({
      actorId,
      action: "organization.created",
      entityType: "Organization",
      entityId: org.id,
      after: org,
    });
    return org;
  }

  async listOrganizations() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true, exams: true } } },
    });
  }

  // Shared by both the platform-admin create path and self-service
  // "register as an organization" - generates a unique slug from the name.
  async createOrganizationRecord(name: string) {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    for (let attempt = 0; attempt < 5; attempt++) {
      const taken = await this.prisma.organization.findUnique({ where: { slug } });
      if (!taken) break;
      slug = `${baseSlug}-${randomSlugSuffix()}`;
    }
    return this.prisma.organization.create({ data: { slug, name } });
  }

  // ---------------------------------------------------------------------
  // Org-admin: profile
  // ---------------------------------------------------------------------

  async getMyOrg(requester: CurrentUserPayload) {
    const org = await this.requireCallerOrg(requester);
    const [memberCount, examCount] = await Promise.all([
      this.prisma.organizationMember.count({ where: { organizationId: org.id, status: MemberStatus.ACTIVE } }),
      this.prisma.exam.count({ where: { organizationId: org.id } }),
    ]);
    return { ...org, memberCount, examCount };
  }

  async updateMyOrg(requester: CurrentUserPayload, dto: { missionStatement?: string; allowedExamSlugs?: string[] }) {
    const org = await this.requireCallerOrg(requester);
    const updated = await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        missionStatement: dto.missionStatement,
        allowedExamSlugs: dto.allowedExamSlugs,
      },
    });
    await this.auditService.log({
      actorId: requester.userId,
      action: "organization.updated",
      entityType: "Organization",
      entityId: org.id,
      before: org,
      after: updated,
    });
    return updated;
  }

  async setLogo(requester: CurrentUserPayload, logoUrl: string) {
    const org = await this.requireCallerOrg(requester);
    const updated = await this.prisma.organization.update({ where: { id: org.id }, data: { logoUrl } });
    await this.auditService.log({
      actorId: requester.userId,
      action: "organization.logo_updated",
      entityType: "Organization",
      entityId: org.id,
      after: { logoUrl },
    });
    return updated;
  }

  // ---------------------------------------------------------------------
  // Org-admin: members
  // ---------------------------------------------------------------------

  async listMembers(requester: CurrentUserPayload) {
    const org = await this.requireCallerOrg(requester);
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId: org.id },
      include: { user: { select: { email: true } }, accessCodes: { select: { id: true, examId: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });
    return members.map((m) => ({
      id: m.id,
      email: m.user.email,
      displayName: m.displayName,
      externalRef: m.externalRef,
      orgRole: m.orgRole,
      status: m.status,
      createdAt: m.createdAt,
      access: m.accessCodes.map((c) => ({ id: c.id, examId: c.examId, status: c.status })),
    }));
  }

  // Org candidates are provisioned BY the org, not self-registered. Rejects
  // with the same conflict semantics as self-registration if the email is
  // already in use - never silently attach an existing account to an org.
  async addMember(
    requester: CurrentUserPayload,
    dto: { email: string; displayName?: string; externalRef?: string },
  ): Promise<{ member: unknown; temporaryPassword: string }> {
    const org = await this.requireCallerOrg(requester);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("A platform account with this email already exists");
    }

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_COST);

    const member = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: dto.email, passwordHash, role: "STUDENT" },
      });
      const created = await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          orgRole: OrgRole.ORG_MEMBER,
          displayName: dto.displayName,
          externalRef: dto.externalRef,
        },
      });
      await this.creditsService.grantFreePlanInTx(tx, user.id);
      return created;
    }, TX_OPTIONS);

    await this.auditService.log({
      actorId: requester.userId,
      action: "organization_member.added",
      entityType: "OrganizationMember",
      entityId: member.id,
      after: { organizationId: org.id, email: dto.email },
    });

    return { member, temporaryPassword };
  }

  async revokeMember(requester: CurrentUserPayload, memberId: string) {
    const org = await this.requireCallerOrg(requester);
    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: org.id },
    });
    if (!member) {
      throw new NotFoundException("Member not found");
    }
    const updated = await this.prisma.organizationMember.update({
      where: { id: member.id },
      data: { status: MemberStatus.REVOKED },
    });
    await this.auditService.log({
      actorId: requester.userId,
      action: "organization_member.revoked",
      entityType: "OrganizationMember",
      entityId: member.id,
      before: member,
      after: updated,
    });
    return updated;
  }

  // ---------------------------------------------------------------------
  // Org-admin: exam access (issue / reassign / revoke)
  // ---------------------------------------------------------------------

  async issueAccess(requester: CurrentUserPayload, memberId: string, examSlug: string): Promise<string> {
    const org = await this.requireCallerOrg(requester);

    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: org.id, status: MemberStatus.ACTIVE },
    });
    if (!member) {
      throw new NotFoundException("Member not found");
    }

    const exam = await this.prisma.exam.findUnique({ where: { slug: examSlug } });
    if (!exam) {
      throw new NotFoundException("Exam not found");
    }
    const isOwnExam = exam.organizationId === org.id;
    const isAllowedShared = exam.organizationId === null && org.allowedExamSlugs.includes(examSlug);
    if (!isOwnExam && !isAllowedShared) {
      throw new BadRequestException("This organization is not permitted to grant access to that exam");
    }

    const plaintextCode = generateAccessCode();
    const codeHash = hashAccessCode(plaintextCode);

    await this.prisma.$transaction(async (tx) => {
      // Reassign semantics: a fresh grant replaces any unused one for the
      // same member+exam rather than stacking duplicates.
      const existing = await tx.organizationExamAccessCode.findFirst({
        where: { memberId: member.id, examId: exam.id, status: "UNUSED" },
        include: { creditLot: true },
      });
      if (existing) {
        await this.voidCode(tx, existing, requester.userId, "Replaced by a new organization grant");
      }

      const lot = await this.creditsService.grantOrgAccess(tx, {
        userId: member.userId,
        examId: exam.id,
        actorId: requester.userId,
        note: `Organization access grant (${org.name})`,
      });

      await tx.organizationExamAccessCode.create({
        data: {
          organizationId: org.id,
          memberId: member.id,
          examId: exam.id,
          codeHash,
          creditLotId: lot.id,
        },
      });
    }, TX_OPTIONS);

    await this.auditService.log({
      actorId: requester.userId,
      action: "organization_access.issued",
      entityType: "OrganizationMember",
      entityId: member.id,
      after: { examId: exam.id, examSlug },
    });

    return plaintextCode;
  }

  async revokeAccess(requester: CurrentUserPayload, codeId: string) {
    const org = await this.requireCallerOrg(requester);
    const code = await this.prisma.organizationExamAccessCode.findFirst({
      where: { id: codeId, organizationId: org.id },
      include: { creditLot: true },
    });
    if (!code) {
      throw new NotFoundException("Access code not found");
    }
    if (code.status !== "UNUSED") {
      throw new ConflictException("Only an unused access code can be revoked");
    }

    await this.prisma.$transaction(
      (tx) => this.voidCode(tx, code, requester.userId, "Revoked by org admin"),
      TX_OPTIONS,
    );

    await this.auditService.log({
      actorId: requester.userId,
      action: "organization_access.revoked",
      entityType: "OrganizationMember",
      entityId: code.memberId,
      before: { codeId: code.id, status: code.status },
      after: { codeId: code.id, status: "REVOKED" },
    });
  }

  // Never accepts a client-supplied lotId - always derives it server-side
  // from a code already scoped to the caller's own organization, so a
  // compromised org-admin token can't zero out an arbitrary lot platform-wide.
  // Uses adjustLotInTx (not the public adminAdjust) because adminAdjust opens
  // its own top-level transaction and would not be atomic with the rest of
  // this call (issuing a replacement grant, or marking a code REVOKED).
  private async voidCode(
    tx: Tx,
    code: { id: string; creditLot: CreditLot },
    actorId: string,
    reason: string,
  ): Promise<void> {
    if (code.creditLot.remaining > 0) {
      await this.creditsService.adjustLotInTx(tx, code.creditLot.id, -code.creditLot.remaining, actorId, reason);
    }
    await tx.organizationExamAccessCode.update({ where: { id: code.id }, data: { status: "REVOKED" } });
  }
}
