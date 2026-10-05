import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ExamVersionStatus, TopicStatus } from "@examproject/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";
import { buildTree } from "./topic-tree.util";
import { annotateQuestionCounts } from "./topic-question-counts.util";

@Injectable()
export class TopicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findTree(examVersionId: string, includeArchived: boolean) {
    const topics = await this.prisma.topic.findMany({
      where: includeArchived
        ? { examVersionId }
        : { examVersionId, status: TopicStatus.ACTIVE },
    });
    const pairs = await this.prisma.questionTopic.findMany({
      where: { topic: { examVersionId }, question: { status: "PUBLISHED" } },
      select: { questionId: true, topicId: true },
    });
    return annotateQuestionCounts(buildTree(topics as any) as any, pairs);
  }

  async findById(id: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      throw new NotFoundException("Topic not found");
    }
    return topic;
  }

  private async assertVersionIsDraft(examVersionId: string) {
    const version = await this.prisma.examVersion.findUnique({ where: { id: examVersionId } });
    if (!version) {
      throw new NotFoundException("Exam version not found");
    }
    if (version.status !== ExamVersionStatus.DRAFT) {
      throw new ConflictException(
        "Topics can only be modified while the exam version is in DRAFT status",
      );
    }
    return version;
  }

  async create(dto: CreateTopicDto, actorId: string) {
    await this.assertVersionIsDraft(dto.examVersionId);

    if (dto.parentId) {
      const parent = await this.prisma.topic.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.examVersionId !== dto.examVersionId) {
        throw new BadRequestException("parentId must reference a topic within the same exam version");
      }
    }

    const topic = await this.prisma.topic.create({
      data: {
        examVersionId: dto.examVersionId,
        parentId: dto.parentId ?? null,
        title: dto.title,
        slug: dto.slug,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    await this.auditService.log({
      actorId,
      action: "topic.created",
      entityType: "Topic",
      entityId: topic.id,
      after: topic,
    });

    return topic;
  }

  async update(id: string, dto: UpdateTopicDto, actorId: string) {
    const before = await this.findById(id);
    await this.assertVersionIsDraft(before.examVersionId);

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException("A topic cannot be its own parent");
      }
      const parent = await this.prisma.topic.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.examVersionId !== before.examVersionId) {
        throw new BadRequestException("parentId must reference a topic within the same exam version");
      }
    }

    const topic = await this.prisma.topic.update({
      where: { id },
      data: {
        parentId: dto.parentId === undefined ? undefined : dto.parentId,
        title: dto.title,
        slug: dto.slug,
        sortOrder: dto.sortOrder,
      },
    });

    await this.auditService.log({
      actorId,
      action: "topic.updated",
      entityType: "Topic",
      entityId: topic.id,
      before,
      after: topic,
    });

    return topic;
  }

  async archive(id: string, actorId: string) {
    const before = await this.findById(id);
    await this.assertVersionIsDraft(before.examVersionId);

    const topic = await this.prisma.topic.update({
      where: { id },
      data: { status: TopicStatus.ARCHIVED },
    });

    await this.auditService.log({
      actorId,
      action: "topic.archived",
      entityType: "Topic",
      entityId: topic.id,
      before,
      after: topic,
    });

    return topic;
  }

  async remove(id: string, actorId: string) {
    const topic = await this.findById(id);
    await this.assertVersionIsDraft(topic.examVersionId);

    const [childCount, mappingCount] = await Promise.all([
      this.prisma.topic.count({ where: { parentId: id } }),
      this.prisma.questionTopic.count({ where: { topicId: id } }),
    ]);

    if (childCount > 0 || mappingCount > 0) {
      throw new ConflictException(
        "Topic has child topics or mapped questions and cannot be hard-deleted; archive it instead",
      );
    }

    await this.prisma.topic.delete({ where: { id } });

    await this.auditService.log({
      actorId,
      action: "topic.deleted",
      entityType: "Topic",
      entityId: id,
      before: topic,
    });

    return { id, deleted: true };
  }
}
