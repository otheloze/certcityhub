import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { OrgRole } from "@prisma/client";
import { Role } from "@examproject/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { CreditsService, TX_OPTIONS } from "../credits/credits.service";
import { randomSlugSuffix, slugify } from "../organizations/org-slug.util";
import { RegisterDto } from "./dto/register.dto";
import { RegisterOrganizationDto } from "./dto/register-organization.dto";
import { RegisterTutorDto } from "./dto/register-tutor.dto";
import { LoginDto } from "./dto/login.dto";

const BCRYPT_COST = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly creditsService: CreditsService,
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

  private buildAuthResponse(userId: string, email: string, role: Role) {
    const accessToken = this.jwtService.sign({ sub: userId, email, role });
    return {
      accessToken,
      user: { id: userId, email, role },
    };
  }
}
