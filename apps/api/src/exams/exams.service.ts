import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ExamStatus, ExamVersionStatus, QuestionStatus, TopicStatus } from "@examproject/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateExamDto } from "./dto/create-exam.dto";
import { UpdateExamDto } from "./dto/update-exam.dto";

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findCatalogue() {
    return this.prisma.exam.findMany({
      where: { status: ExamStatus.ACTIVE, organizationId: null },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
  }

  // An organization's own private exams - never shown in the public
  // catalogue or to other organizations.
  findAllForOrganization(organizationId: string) {
    return this.prisma.exam.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  // Catalogue cards: each active exam plus a summary of its newest published
  // version. Three flat queries (no N+1) regardless of how many exams exist.
  async findCatalogueWithVersions() {
    const exams = await this.prisma.exam.findMany({
      where: { status: ExamStatus.ACTIVE, organizationId: null },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: {
        versions: {
          where: { status: ExamVersionStatus.PUBLISHED },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const versionIds = exams.flatMap((e) => e.versions.map((v) => v.id));
    const [questionCounts, topicCounts] = await Promise.all([
      this.prisma.question.groupBy({
        by: ["examVersionId"],
        where: { examVersionId: { in: versionIds }, status: QuestionStatus.PUBLISHED },
        _count: { _all: true },
      }),
      this.prisma.topic.groupBy({
        by: ["examVersionId"],
        where: { examVersionId: { in: versionIds }, status: TopicStatus.ACTIVE },
        _count: { _all: true },
      }),
    ]);
    const questionsByVersion = new Map(questionCounts.map((r) => [r.examVersionId, r._count._all]));
    const topicsByVersion = new Map(topicCounts.map((r) => [r.examVersionId, r._count._all]));

    return exams.map(({ versions, ...exam }) => {
      const v = versions[0];
      const durationSeconds = Number((v?.config as { durationSeconds?: number } | undefined)?.durationSeconds ?? 0);
      return {
        ...exam,
        version: v
          ? {
              id: v.id,
              versionLabel: v.versionLabel,
              questionCount: questionsByVersion.get(v.id) ?? 0,
              topicCount: topicsByVersion.get(v.id) ?? 0,
              durationMinutes: Math.round(durationSeconds / 60),
            }
          : null,
      };
    });
  }

  async findBySlug(slug: string, includeArchived: boolean) {
    const exam = await this.prisma.exam.findUnique({ where: { slug } });
    if (!exam || (!includeArchived && exam.status !== ExamStatus.ACTIVE)) {
      throw new NotFoundException("Exam not found");
    }
    return exam;
  }

  async findById(id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      throw new NotFoundException("Exam not found");
    }
    return exam;
  }

  // `organizationId` is only ever set by the org-scoped CMS (OrgExamsController),
  // never taken from client input on the public admin route - it makes the
  // created exam private to that org (excluded from findCatalogueWithVersions).
  async create(dto: CreateExamDto, actorId: string, organizationId?: string) {
    const existing = await this.prisma.exam.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException("An exam with this slug already exists");
    }

    const exam = await this.prisma.exam.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        shortCode: dto.shortCode,
        provider: dto.provider,
        level: dto.level,
        sortOrder: dto.sortOrder,
        organizationId,
      },
    });

    await this.auditService.log({
      actorId,
      action: "exam.created",
      entityType: "Exam",
      entityId: exam.id,
      after: exam,
    });

    return exam;
  }

  async update(id: string, dto: UpdateExamDto, actorId: string) {
    const before = await this.findById(id);

    const exam = await this.prisma.exam.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        shortCode: dto.shortCode,
        provider: dto.provider,
        level: dto.level,
        sortOrder: dto.sortOrder,
      },
    });

    await this.auditService.log({
      actorId,
      action: "exam.updated",
      entityType: "Exam",
      entityId: exam.id,
      before,
      after: exam,
    });

    return exam;
  }

  async archive(id: string, actorId: string) {
    const before = await this.findById(id);

    const exam = await this.prisma.exam.update({
      where: { id },
      data: { status: ExamStatus.ARCHIVED },
    });

    await this.auditService.log({
      actorId,
      action: "exam.archived",
      entityType: "Exam",
      entityId: exam.id,
      before,
      after: exam,
    });

    return exam;
  }
}
