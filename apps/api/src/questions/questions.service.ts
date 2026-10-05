import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { QuestionStatus, QuestionType } from "@examproject/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { MapTopicDto } from "./dto/map-topic.dto";
import { QuestionStatusService } from "./question-status.service";

export interface FindQuestionsQuery {
  status?: QuestionStatus;
  type?: QuestionType;
  examId?: string;
  examVersionId?: string;
  topicId?: string;
  take?: number;
  skip?: number;
}

const QUESTION_INCLUDE = {
  options: { orderBy: { sortOrder: "asc" as const } },
  questionTopics: { include: { topic: true } },
};

const UNIQUE_CONSTRAINT_VIOLATION = "P2025";
const PRISMA_UNIQUE_VIOLATION_CODE = "P2002";

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly questionStatusService: QuestionStatusService,
  ) {}

  async find(query: FindQuestionsQuery) {
    return this.prisma.question.findMany({
      where: {
        status: query.status,
        type: query.type,
        examId: query.examId,
        examVersionId: query.examVersionId,
        questionTopics: query.topicId ? { some: { topicId: query.topicId } } : undefined,
      },
      include: QUESTION_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: query.take ?? 50,
      skip: query.skip ?? 0,
    });
  }

  async findById(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: QUESTION_INCLUDE,
    });
    if (!question) {
      throw new NotFoundException("Question not found");
    }
    return question;
  }

  async create(dto: CreateQuestionDto, actorId: string) {
    const question = await this.prisma.question.create({
      data: {
        examId: dto.examId,
        examVersionId: dto.examVersionId,
        type: dto.type,
        title: dto.title,
        stem: dto.stem as any,
        answerSchema: dto.answerSchema as any,
        explanation: dto.explanation as any,
        difficulty: dto.difficulty,
        estimatedTimeSeconds: dto.estimatedTimeSeconds,
        tags: dto.tags ?? [],
        status: QuestionStatus.DRAFT,
        createdById: actorId,
        updatedById: actorId,
        options: dto.options
          ? {
              create: dto.options.map((option, index) => ({
                label: option.label,
                content: option.content as any,
                isCorrect: option.isCorrect ?? false,
                sortOrder: option.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: QUESTION_INCLUDE,
    });

    await this.auditService.log({
      actorId,
      action: "question.created",
      entityType: "Question",
      entityId: question.id,
      after: question,
    });

    return question;
  }

  async update(id: string, dto: UpdateQuestionDto, actorId: string) {
    const before = await this.findById(id);

    if (before.status === QuestionStatus.RETIRED) {
      throw new ConflictException("Retired questions cannot be edited");
    }

    const wasPublished = before.status === QuestionStatus.PUBLISHED;

    const question = await this.prisma.$transaction(async (tx) => {
      if (dto.options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
      }

      return tx.question.update({
        where: { id },
        data: {
          title: dto.title,
          stem: dto.stem as any,
          answerSchema: dto.answerSchema as any,
          explanation: dto.explanation as any,
          difficulty: dto.difficulty,
          estimatedTimeSeconds: dto.estimatedTimeSeconds,
          tags: dto.tags,
          updatedById: actorId,
          version: wasPublished ? { increment: 1 } : undefined,
          options: dto.options
            ? {
                create: dto.options.map((option, index) => ({
                  label: option.label,
                  content: option.content as any,
                  isCorrect: option.isCorrect ?? false,
                  sortOrder: option.sortOrder ?? index,
                })),
              }
            : undefined,
        },
        include: QUESTION_INCLUDE,
      });
    });

    await this.auditService.log({
      actorId,
      action: wasPublished ? "question.updated_published" : "question.updated",
      entityType: "Question",
      entityId: question.id,
      before,
      after: question,
      description: wasPublished ? "Edited a published question; version bumped" : undefined,
    });

    return question;
  }

  async changeStatus(id: string, dto: ChangeStatusDto, actorId: string) {
    const before = await this.findById(id);

    if (!this.questionStatusService.isTransitionAllowed(before.status as QuestionStatus, dto.targetStatus)) {
      throw new BadRequestException(
        `Illegal question status transition: ${before.status} -> ${dto.targetStatus}`,
      );
    }

    const question = await this.prisma.question.update({
      where: { id },
      data: { status: dto.targetStatus, updatedById: actorId },
      include: QUESTION_INCLUDE,
    });

    await this.auditService.log({
      actorId,
      action: "question.status_changed",
      entityType: "Question",
      entityId: question.id,
      before,
      after: question,
    });

    return question;
  }

  async findTopics(id: string) {
    await this.findById(id);
    return this.prisma.questionTopic.findMany({
      where: { questionId: id },
      include: { topic: true },
    });
  }

  async mapTopic(id: string, dto: MapTopicDto, actorId: string) {
    await this.findById(id);

    const topic = await this.prisma.topic.findUnique({ where: { id: dto.topicId } });
    if (!topic) {
      throw new NotFoundException("Topic not found");
    }

    try {
      const mapping = await this.prisma.questionTopic.create({
        data: { questionId: id, topicId: dto.topicId, isPrimary: dto.isPrimary ?? false },
      });

      await this.auditService.log({
        actorId,
        action: "question.topic_mapped",
        entityType: "Question",
        entityId: id,
        after: mapping,
      });

      return mapping;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PRISMA_UNIQUE_VIOLATION_CODE) {
        throw new ConflictException("This question is already mapped to this topic");
      }
      throw error;
    }
  }

  async unmapTopic(id: string, topicId: string, actorId: string) {
    await this.findById(id);

    try {
      await this.prisma.questionTopic.delete({
        where: { questionId_topicId: { questionId: id, topicId } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION) {
        throw new NotFoundException("Topic mapping not found");
      }
      throw error;
    }

    await this.auditService.log({
      actorId,
      action: "question.topic_unmapped",
      entityType: "Question",
      entityId: id,
      description: `Removed mapping to topic ${topicId}`,
    });

    return { questionId: id, topicId, removed: true };
  }
}
