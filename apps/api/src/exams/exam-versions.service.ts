import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ExamVersionStatus } from "@examproject/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateExamVersionDto } from "./dto/create-exam-version.dto";
import { UpdateExamVersionDto } from "./dto/update-exam-version.dto";
import { ExamsService } from "./exams.service";

@Injectable()
export class ExamVersionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly examsService: ExamsService,
  ) {}

  async findForExam(examId: string, includeAll: boolean) {
    return this.prisma.examVersion.findMany({
      where: includeAll ? { examId } : { examId, status: ExamVersionStatus.PUBLISHED },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const version = await this.prisma.examVersion.findUnique({ where: { id } });
    if (!version) {
      throw new NotFoundException("Exam version not found");
    }
    return version;
  }

  async findByIdWithExam(id: string) {
    const version = await this.prisma.examVersion.findUnique({
      where: { id },
      include: { exam: { select: { id: true, slug: true, title: true } } },
    });
    if (!version) {
      throw new NotFoundException("Exam version not found");
    }
    return version;
  }

  async create(examId: string, dto: CreateExamVersionDto, actorId: string) {
    await this.examsService.findById(examId);

    const existing = await this.prisma.examVersion.findUnique({
      where: { examId_versionLabel: { examId, versionLabel: dto.versionLabel } },
    });
    if (existing) {
      throw new ConflictException("A version with this label already exists for this exam");
    }

    const version = await this.prisma.examVersion.create({
      data: {
        examId,
        versionLabel: dto.versionLabel,
        config: dto.config as any,
        status: ExamVersionStatus.DRAFT,
      },
    });

    await this.auditService.log({
      actorId,
      action: "exam_version.created",
      entityType: "ExamVersion",
      entityId: version.id,
      after: version,
    });

    return version;
  }

  async update(id: string, dto: UpdateExamVersionDto, actorId: string) {
    const before = await this.findById(id);
    if (before.status !== ExamVersionStatus.DRAFT) {
      throw new ConflictException("Only DRAFT exam versions can be edited");
    }

    const version = await this.prisma.examVersion.update({
      where: { id },
      data: {
        versionLabel: dto.versionLabel,
        config: dto.config ? (dto.config as any) : undefined,
      },
    });

    await this.auditService.log({
      actorId,
      action: "exam_version.updated",
      entityType: "ExamVersion",
      entityId: version.id,
      before,
      after: version,
    });

    return version;
  }

  async publish(id: string, actorId: string) {
    const before = await this.findById(id);
    if (before.status !== ExamVersionStatus.DRAFT) {
      throw new ConflictException("Only DRAFT exam versions can be published");
    }

    const version = await this.prisma.examVersion.update({
      where: { id },
      data: { status: ExamVersionStatus.PUBLISHED, publishedAt: new Date() },
    });

    await this.auditService.log({
      actorId,
      action: "exam_version.published",
      entityType: "ExamVersion",
      entityId: version.id,
      before,
      after: version,
    });

    return version;
  }

  async archive(id: string, actorId: string) {
    const before = await this.findById(id);
    if (before.status !== ExamVersionStatus.PUBLISHED) {
      throw new ConflictException("Only PUBLISHED exam versions can be archived");
    }

    const version = await this.prisma.examVersion.update({
      where: { id },
      data: { status: ExamVersionStatus.ARCHIVED },
    });

    await this.auditService.log({
      actorId,
      action: "exam_version.archived",
      entityType: "ExamVersion",
      entityId: version.id,
      before,
      after: version,
    });

    return version;
  }
}
