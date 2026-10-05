import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { TutorProfileStatus } from "@prisma/client";
import { Role } from "@examproject/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { rankMatches, TutorRef, WeakTopic } from "./tutor-matching.util";
import { AddSpecializationDto, UpdateTutorProfileDto } from "./dto/tutors.dto";

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: Role;
}

const PUBLIC_SELECT = {
  id: true,
  displayName: true,
  headline: true,
  bio: true,
  photoUrl: true,
  resumeUrl: true,
  createdAt: true,
  specializations: { select: { id: true, examId: true, topicKeyword: true, exam: { select: { slug: true, title: true } } } },
} as const;

@Injectable()
export class TutorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ---------------------------------------------------------------------
  // Identity resolution - every /tutors/me/* route uses this rather than
  // trusting a client-supplied id, same pattern as
  // OrganizationsService.requireCallerOrg.
  // ---------------------------------------------------------------------

  async requireCallerProfile(requester: CurrentUserPayload) {
    const profile = await this.prisma.tutorProfile.findUnique({ where: { userId: requester.userId } });
    if (!profile) {
      throw new ForbiddenException("You do not have a tutor profile");
    }
    return profile;
  }

  // ---------------------------------------------------------------------
  // Tutor-admin (self-service): profile
  // ---------------------------------------------------------------------

  async getMyProfile(requester: CurrentUserPayload) {
    const profile = await this.requireCallerProfile(requester);
    return this.prisma.tutorProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: { specializations: { include: { exam: { select: { slug: true, title: true } } } } },
    });
  }

  async updateMyProfile(requester: CurrentUserPayload, dto: UpdateTutorProfileDto) {
    const profile = await this.requireCallerProfile(requester);
    // Editing after rejection returns the profile to DRAFT so the tutor can
    // fix it up and resubmit, rather than staying stuck in REJECTED forever.
    const resetToDraft = profile.status === TutorProfileStatus.REJECTED;
    const updated = await this.prisma.tutorProfile.update({
      where: { id: profile.id },
      data: {
        displayName: dto.displayName,
        headline: dto.headline,
        bio: dto.bio,
        ...(resetToDraft ? { status: TutorProfileStatus.DRAFT, rejectionReason: null } : {}),
      },
    });
    return updated;
  }

  async setPhoto(requester: CurrentUserPayload, photoUrl: string) {
    const profile = await this.requireCallerProfile(requester);
    return this.prisma.tutorProfile.update({ where: { id: profile.id }, data: { photoUrl } });
  }

  async setResume(requester: CurrentUserPayload, resumeUrl: string) {
    const profile = await this.requireCallerProfile(requester);
    return this.prisma.tutorProfile.update({ where: { id: profile.id }, data: { resumeUrl } });
  }

  // ---------------------------------------------------------------------
  // Tutor-admin (self-service): specializations
  // ---------------------------------------------------------------------

  async listMySpecializations(requester: CurrentUserPayload) {
    const profile = await this.requireCallerProfile(requester);
    return this.prisma.tutorSpecialization.findMany({
      where: { tutorProfileId: profile.id },
      include: { exam: { select: { slug: true, title: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async addSpecialization(requester: CurrentUserPayload, dto: AddSpecializationDto) {
    const profile = await this.requireCallerProfile(requester);
    const exam = await this.prisma.exam.findUnique({ where: { slug: dto.examSlug } });
    if (!exam) {
      throw new NotFoundException("Exam not found");
    }
    return this.prisma.tutorSpecialization.create({
      data: { tutorProfileId: profile.id, examId: exam.id, topicKeyword: dto.topicKeyword?.trim() || null },
      include: { exam: { select: { slug: true, title: true } } },
    });
  }

  async removeSpecialization(requester: CurrentUserPayload, specializationId: string) {
    const profile = await this.requireCallerProfile(requester);
    const spec = await this.prisma.tutorSpecialization.findFirst({
      where: { id: specializationId, tutorProfileId: profile.id },
    });
    if (!spec) {
      throw new NotFoundException("Specialization not found");
    }
    await this.prisma.tutorSpecialization.delete({ where: { id: spec.id } });
  }

  // ---------------------------------------------------------------------
  // Tutor-admin (self-service): submit for review
  // ---------------------------------------------------------------------

  async submitForReview(requester: CurrentUserPayload) {
    const profile = await this.requireCallerProfile(requester);
    if (profile.status !== TutorProfileStatus.DRAFT && profile.status !== TutorProfileStatus.REJECTED) {
      throw new ConflictException(`A profile with status ${profile.status} cannot be submitted`);
    }
    if (!profile.photoUrl) {
      throw new BadRequestException("Upload a profile photo before submitting for review");
    }
    if (!profile.resumeUrl) {
      throw new BadRequestException("Upload a resume before submitting for review");
    }
    const specCount = await this.prisma.tutorSpecialization.count({ where: { tutorProfileId: profile.id } });
    if (specCount === 0) {
      throw new BadRequestException("Add at least one area of specialization before submitting for review");
    }

    const updated = await this.prisma.tutorProfile.update({
      where: { id: profile.id },
      data: { status: TutorProfileStatus.PENDING_REVIEW, submittedAt: new Date(), rejectionReason: null },
    });
    await this.auditService.log({
      actorId: requester.userId,
      action: "tutor_profile.submitted",
      entityType: "TutorProfile",
      entityId: profile.id,
      after: { status: updated.status },
    });
    return updated;
  }

  // ---------------------------------------------------------------------
  // Platform-admin: review queue
  // ---------------------------------------------------------------------

  async adminList(status?: TutorProfileStatus) {
    return this.prisma.tutorProfile.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { email: true } }, specializations: { include: { exam: { select: { slug: true, title: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async adminApprove(actorId: string, profileId: string) {
    const profile = await this.getByIdOrThrow(profileId);
    if (profile.status !== TutorProfileStatus.PENDING_REVIEW) {
      throw new ConflictException("Only a profile pending review can be approved");
    }
    const updated = await this.prisma.tutorProfile.update({
      where: { id: profile.id },
      data: { status: TutorProfileStatus.APPROVED, reviewedAt: new Date(), reviewedById: actorId, rejectionReason: null },
    });
    await this.auditService.log({
      actorId,
      action: "tutor_profile.approved",
      entityType: "TutorProfile",
      entityId: profile.id,
      before: { status: profile.status },
      after: { status: updated.status },
    });
    return updated;
  }

  async adminReject(actorId: string, profileId: string, reason: string) {
    const profile = await this.getByIdOrThrow(profileId);
    if (profile.status !== TutorProfileStatus.PENDING_REVIEW) {
      throw new ConflictException("Only a profile pending review can be rejected");
    }
    const updated = await this.prisma.tutorProfile.update({
      where: { id: profile.id },
      data: { status: TutorProfileStatus.REJECTED, reviewedAt: new Date(), reviewedById: actorId, rejectionReason: reason },
    });
    await this.auditService.log({
      actorId,
      action: "tutor_profile.rejected",
      entityType: "TutorProfile",
      entityId: profile.id,
      before: { status: profile.status },
      after: { status: updated.status },
      description: reason,
    });
    return updated;
  }

  private async getByIdOrThrow(id: string) {
    const profile = await this.prisma.tutorProfile.findUnique({ where: { id } });
    if (!profile) {
      throw new NotFoundException("Tutor profile not found");
    }
    return profile;
  }

  // ---------------------------------------------------------------------
  // Public directory
  // ---------------------------------------------------------------------

  async publicList(filters: { examSlug?: string }) {
    return this.prisma.tutorProfile.findMany({
      where: {
        status: TutorProfileStatus.APPROVED,
        ...(filters.examSlug ? { specializations: { some: { exam: { slug: filters.examSlug } } } } : {}),
      },
      select: PUBLIC_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  async publicGetById(id: string) {
    const profile = await this.prisma.tutorProfile.findUnique({ where: { id }, select: PUBLIC_SELECT });
    // Same "don't leak private state" shape as an unapproved org-owned exam:
    // a not-yet-approved (or rejected) profile 404s exactly like a missing one.
    if (!profile || (await this.isApproved(id)) === false) {
      throw new NotFoundException("Tutor not found");
    }
    return profile;
  }

  private async isApproved(id: string): Promise<boolean> {
    const profile = await this.prisma.tutorProfile.findUnique({ where: { id }, select: { status: true } });
    return profile?.status === TutorProfileStatus.APPROVED;
  }

  // ---------------------------------------------------------------------
  // Dashboard integration (called from DashboardService.forUser)
  // ---------------------------------------------------------------------

  async matchForWeakTopics(weakTopics: WeakTopic[]) {
    if (weakTopics.length === 0) return [];
    const examSlugs = [...new Set(weakTopics.map((t) => t.examSlug))];

    const profiles = await this.prisma.tutorProfile.findMany({
      where: { status: TutorProfileStatus.APPROVED, specializations: { some: { exam: { slug: { in: examSlugs } } } } },
      select: {
        id: true,
        displayName: true,
        headline: true,
        photoUrl: true,
        specializations: { select: { id: true, topicKeyword: true, exam: { select: { slug: true } } } },
      },
    });

    const tutors: TutorRef[] = profiles.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      headline: p.headline,
      photoUrl: p.photoUrl,
      specializations: p.specializations.map((s) => ({ id: s.id, examSlug: s.exam.slug, topicKeyword: s.topicKeyword })),
    }));

    return rankMatches(tutors, weakTopics);
  }
}
