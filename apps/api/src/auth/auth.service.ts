import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { OrgRole } from "@prisma/client";
import { Role } from "@examproject/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { CreditsService, TX_OPTIONS } from "../credits/credits.service";
import { AuditService } from "../audit/audit.service";
import { MailService } from "../mail/mail.service";
import { randomSlugSuffix, slugify } from "../organizations/org-slug.util";
import { generateResetCode, RESET_CODE_TTL_MS } from "./password-reset.util";
import { RegisterDto } from "./dto/register.dto";
import { RegisterOrganizationDto } from "./dto/register-organization.dto";
import { RegisterTutorDto } from "./dto/register-tutor.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

const BCRYPT_COST = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly creditsService: CreditsService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, role: Role.STUDENT },
    });

    await this.creditsService.grantFreePlan(user.id);

    void this.mailService.sendWelcomeEmail(user.email, "student");
    void this.mailService.sendAdminNewMemberNotification({
      email: user.email,
      accountType: "student",
      createdAt: user.createdAt,
    });

    return this.buildAuthResponse(user.id, user.email, user.role as Role);
  }

  // Self-service organization sign-up: creates the Organization, an
  // ORG_ADMIN User for the person registering, and links them via
  // OrganizationMember - then logs them straight in, same as register().
  async registerOrganization(dto: RegisterOrganizationDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const baseSlug = slugify(dto.organizationName);

    const user = await this.prisma.$transaction(async (tx) => {
      let slug = baseSlug;
      for (let attempt = 0; attempt < 5; attempt++) {
        const taken = await tx.organization.findUnique({ where: { slug } });
        if (!taken) break;
        slug = `${baseSlug}-${randomSlugSuffix()}`;
      }

      const createdUser = await tx.user.create({
        data: { email: dto.email, passwordHash, role: Role.ORG_ADMIN },
      });
      const organization = await tx.organization.create({
        data: { slug, name: dto.organizationName },
      });
      await tx.organizationMember.create({
        data: { organizationId: organization.id, userId: createdUser.id, orgRole: OrgRole.ORG_ADMIN },
      });
      return createdUser;
    }, TX_OPTIONS);

    void this.mailService.sendWelcomeEmail(user.email, "organization", { organizationName: dto.organizationName });
    void this.mailService.sendAdminNewMemberNotification({
      email: user.email,
      accountType: "organization",
      createdAt: user.createdAt,
      organizationName: dto.organizationName,
    });

    return this.buildAuthResponse(user.id, user.email, user.role as Role);
  }

  // Self-service tutor sign-up: creates the User (role TUTOR) and an empty
  // DRAFT TutorProfile the tutor fills in and submits for admin review from
  // their own dashboard - then logs them straight in, same as register().
  async registerTutor(dto: RegisterTutorDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { email: dto.email, passwordHash, role: Role.TUTOR },
      });
      await tx.tutorProfile.create({
        data: { userId: createdUser.id, displayName: dto.displayName },
      });
      return createdUser;
    }, TX_OPTIONS);

    void this.mailService.sendWelcomeEmail(user.email, "tutor", { displayName: dto.displayName });
    void this.mailService.sendAdminNewMemberNotification({
      email: user.email,
      accountType: "tutor",
      createdAt: user.createdAt,
      displayName: dto.displayName,
    });

    return this.buildAuthResponse(user.id, user.email, user.role as Role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.buildAuthResponse(user.id, user.email, user.role as Role);
  }

  // Never reveals whether the email is registered - same response either
  // way, matching login()'s existing non-leaking precedent above.
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user) {
      const code = generateResetCode();
      const codeHash = await bcrypt.hash(code, BCRYPT_COST);

      await this.prisma.$transaction(async (tx) => {
        await tx.passwordResetCode.updateMany({
          where: { userId: user.id, consumedAt: null },
          data: { consumedAt: new Date() },
        });
        await tx.passwordResetCode.create({
          data: {
            userId: user.id,
            codeHash,
            expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
          },
        });
      }, TX_OPTIONS);

      void this.mailService.sendPasswordResetCode(user.email, code);
      await this.auditService.log({
        actorId: user.id,
        action: "auth.password_reset_requested",
        entityType: "User",
        entityId: user.id,
      });
    }

    return { message: "If an account exists for that email, a reset code has been sent." };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const invalidCodeError = () => new BadRequestException("Invalid or expired code");

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw invalidCodeError();
    }

    const resetCode = await this.prisma.passwordResetCode.findFirst({
      where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!resetCode) {
      throw invalidCodeError();
    }

    const codeMatches = await bcrypt.compare(dto.code, resetCode.codeHash);
    if (!codeMatches) {
      throw invalidCodeError();
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_COST);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
      await tx.passwordResetCode.update({ where: { id: resetCode.id }, data: { consumedAt: new Date() } });
    }, TX_OPTIONS);

    await this.auditService.log({
      actorId: user.id,
      action: "auth.password_reset_completed",
      entityType: "User",
      entityId: user.id,
    });

    return { message: "Password updated. You can now log in." };
  }

  private buildAuthResponse(userId: string, email: string, role: Role) {
    const accessToken = this.jwtService.sign({ sub: userId, email, role });
    return {
      accessToken,
      user: { id: userId, email, role },
    };
  }
}
