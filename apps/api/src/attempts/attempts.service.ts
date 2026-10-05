import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Attempt, AttemptMode, CreditLot } from "@prisma/client";
import { AttemptStatus, ExamVersionStatus, QuestionStatus, Role } from "@examproject/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { GradingService } from "../scoring/grading.service";
import { CreditsService, TX_OPTIONS } from "../credits/credits.service";
import { OrganizationsService } from "../organizations/organizations.service";
import { resolveAttemptAccessPath } from "../organizations/org-access.util";
import { TutorsService } from "../tutors/tutors.service";
import { StartAttemptDto } from "./dto/start-attempt.dto";
import { SaveAnswerDto } from "./dto/save-answer.dto";
import { SetReviewFlagDto } from "./dto/set-review-flag.dto";
import { selectQuestions } from "./question-selection.util";
import { sanitizeQuestionSnapshot } from "./answer-sanitizer.util";
import { buildQuestionSnapshot } from "./question-snapshot.util";
import { limitedQuestionCount } from "./question-fraction.util";
import { collectSubtreeIds } from "./topic-subtree.util";
import { buildFeedback } from "./answer-feedback.util";
import { deriveAttemptWeakTopics } from "./attempt-weak-topics.util";

const DEFAULT_BLUEPRINT = { questionCount: Number.MAX_SAFE_INTEGER, randomize: false };

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gradingService: GradingService,
    private readonly creditsService: CreditsService,
    private readonly organizationsService: OrganizationsService,
    private readonly tutorsService: TutorsService,
  ) {}

  async start(dto: StartAttemptDto, requester: CurrentUserPayload) {
    const mode = dto.mode ?? AttemptMode.SIMULATION;

    const examVersion = await this.prisma.examVersion.findUnique({
      where: { id: dto.examVersionId },
      include: { exam: true },
    });
    if (!examVersion || examVersion.status !== ExamVersionStatus.PUBLISHED) {
      throw new NotFoundException("Exam version not found or not published");
    }

    // A private, organization-owned exam is only visible to that org's own
    // active members (or a platform admin) - reject before revealing
    // anything about it, same 404 shape as a missing/unpublished version,
    // so a random credit (e.g. a spare GLOBAL free-plan lot) can never be
    // spent on someone else's private content just by guessing its id.
    let isActiveOrgMember = false;
    if (examVersion.exam.organizationId) {
      const membership = await this.organizationsService.findActiveMembership(
        requester.userId,
        examVersion.exam.organizationId,
      );
      isActiveOrgMember = !!membership;
      if (!isActiveOrgMember && requester.role !== Role.ADMIN) {
        throw new NotFoundException("Exam version not found or not published");
      }
    }

    const config = examVersion.config as any;

    let candidates = await this.prisma.question.findMany({
      where: { examVersionId: examVersion.id, status: QuestionStatus.PUBLISHED },
      include: { options: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "asc" },
    });

    let practiceSelection: typeof candidates = [];
    let durationSeconds: number = config.durationSeconds;

    if (mode === AttemptMode.PRACTICE) {
      candidates = await this.filterForPractice(candidates, examVersion.id, dto);
      if (candidates.length === 0) {
        throw new BadRequestException("No published questions match those practice settings");
      }
      const count = dto.questionCount ?? Math.min(10, candidates.length);
      practiceSelection = selectQuestions(candidates, { questionCount: count, randomize: true });
      durationSeconds = Math.max(600, practiceSelection.length * 120);
    } else if (candidates.length === 0) {
      throw new BadRequestException("This exam version has no published questions yet");
    }

    const blueprint = config.blueprint ?? DEFAULT_BLUEPRINT;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

    // Credit check, attempt creation and debit are ONE transaction. The
    // per-user lock makes a second concurrent start wait, then see the
    // already-spent credit - so one credit can never produce two attempts.
    return this.prisma.$transaction(async (tx) => {
      let selected = practiceSelection;
      let lot: CreditLot | null = null;
      let redeemedCodeId: string | null = null;

      if (mode === AttemptMode.SIMULATION) {
        const path = resolveAttemptAccessPath({
          examOrganizationId: examVersion.exam.organizationId,
          isActiveOrgMember,
          accessCodeProvided: !!dto.accessCode,
        });

        if (path !== "ORG_OWNED_FREE") {
          await this.creditsService.lockUserCredits(tx, requester.userId);

          if (path === "ORG_GATED_CODE") {
            const redeemed = await this.organizationsService.redeemAccessCode(
              tx,
              requester.userId,
              examVersion.examId,
              dto.accessCode!,
            );
            lot = redeemed.lot;
            redeemedCodeId = redeemed.codeId;
          } else {
            // Before the plain "no eligible credits" 402, check whether an
            // org access code is what's actually missing, so the frontend
            // can prompt for a code instead of suggesting a purchase.
            if (
              !dto.accessCode &&
              (await this.organizationsService.hasUnusedAccessCode(requester.userId, examVersion.examId, tx))
            ) {
              throw new HttpException(
                { message: "Enter your one-time organization exam code to start.", code: "ORG_ACCESS_CODE_REQUIRED" },
                HttpStatus.PAYMENT_REQUIRED,
              );
            }
            lot = await this.creditsService.reserveLot(tx, requester.userId, examVersion.examId);
          }
        }

        const fullCount = Math.min(blueprint.questionCount, candidates.length);
        selected = selectQuestions(candidates, {
          questionCount: lot ? limitedQuestionCount(fullCount, lot.questionFraction) : fullCount,
          randomize: blueprint.randomize,
        });
      }

      const created = await tx.attempt.create({
        data: {
          userId: requester.userId,
          examVersionId: examVersion.id,
          mode,
          status: AttemptStatus.IN_PROGRESS,
          startedAt,
          expiresAt,
        },
      });

      if (lot) {
        await this.creditsService.debitLot(tx, lot, requester.userId, created.id);
      }
      if (redeemedCodeId) {
        await this.organizationsService.markAccessCodeUsed(tx, redeemedCodeId, created.id);
      }

      await tx.attemptSnapshot.create({
        data: { attemptId: created.id, examVersionConfig: config },
      });

      await tx.attemptQuestion.createMany({
        data: selected.map((question, index) => ({
          attemptId: created.id,
          order: index,
          questionId: question.id,
          snapshot: buildQuestionSnapshot(question as any) as any,
        })),
      });

      return created;
    }, TX_OPTIONS);
  }

  private async filterForPractice<T extends { id: string; difficulty: number | null }>(
    candidates: T[],
    examVersionId: string,
    dto: StartAttemptDto,
  ): Promise<T[]> {
    let result = candidates;

    if (dto.topicId) {
      const topics = await this.prisma.topic.findMany({
        where: { examVersionId },
        select: { id: true, parentId: true },
      });
      if (!topics.some((t) => t.id === dto.topicId)) {
        throw new BadRequestException("That topic does not belong to this exam version");
      }
      const topicIds = collectSubtreeIds(topics, dto.topicId);
      const mappings = await this.prisma.questionTopic.findMany({
        where: { topicId: { in: topicIds } },
        select: { questionId: true },
      });
      const allowed = new Set(mappings.map((m) => m.questionId));
      result = result.filter((q) => allowed.has(q.id));
    }

    if (dto.difficulty) {
      result = result.filter((q) => q.difficulty === dto.difficulty);
    }
    return result;
  }

  async findById(id: string, requester: CurrentUserPayload) {
    const attempt = await this.getOwnedAttempt(id, requester);
    return this.applyLazyExpiry(attempt);
  }

  async findQuestions(id: string, requester: CurrentUserPayload) {
    const attempt = await this.getOwnedAttempt(id, requester);
    await this.applyLazyExpiry(attempt);

    const attemptQuestions = await this.prisma.attemptQuestion.findMany({
      where: { attemptId: id },
      include: { answer: true },
      orderBy: { order: "asc" },
    });

    return attemptQuestions.map((aq) => ({
      id: aq.id,
      questionId: aq.questionId,
      order: aq.order,
      markedForReview: aq.markedForReview,
      ...sanitizeQuestionSnapshot(aq.snapshot as any),
      answer: aq.answer?.responseData ?? null,
    }));
  }

  async setReviewFlag(id: string, questionId: string, dto: SetReviewFlagDto, requester: CurrentUserPayload) {
    const attempt = await this.getOwnedAttempt(id, requester);
    if (attempt.userId !== requester.userId) {
      throw new ForbiddenException("Only the attempt owner can flag questions for review");
    }

    const current = await this.applyLazyExpiry(attempt);
    if (current.status !== AttemptStatus.IN_PROGRESS) {
      throw new ConflictException(`Cannot flag questions on a ${current.status} attempt`);
    }

    const config = (await this.prisma.attemptSnapshot.findUnique({ where: { attemptId: id } }))
      ?.examVersionConfig as any;
    if (!(config?.navigation?.allowMarkForReview ?? true)) {
      throw new ConflictException("Marking questions for review is not allowed for this exam");
    }

    const attemptQuestion = await this.prisma.attemptQuestion.findUnique({
      where: { attemptId_questionId: { attemptId: id, questionId } },
    });
    if (!attemptQuestion) {
      throw new NotFoundException("This question is not part of this attempt");
    }

    return this.prisma.attemptQuestion.update({
      where: { id: attemptQuestion.id },
      data: { markedForReview: dto.marked },
    });
  }

  // Instant feedback, PRACTICE attempts only. Revealing the key during a
  // simulation would defeat the exam, so it is refused there.
  async checkAnswer(id: string, questionId: string, requester: CurrentUserPayload) {
    const attempt = await this.getOwnedAttempt(id, requester);
    if (attempt.userId !== requester.userId) {
      throw new ForbiddenException("Only the attempt owner can check answers");
    }
    if (attempt.mode !== AttemptMode.PRACTICE) {
      throw new ConflictException("Instant feedback is only available in Practice mode.");
    }

    const attemptQuestion = await this.prisma.attemptQuestion.findUnique({
      where: { attemptId_questionId: { attemptId: id, questionId } },
      include: { answer: true },
    });
    if (!attemptQuestion) {
      throw new NotFoundException("This question is not part of this attempt");
    }
    if (!attemptQuestion.answer) {
      throw new ConflictException("Answer the question first, then check it.");
    }

    return buildFeedback(attemptQuestion.snapshot as any, attemptQuestion.answer.responseData as any);
  }

  // Full answer review once an attempt is over (submitted or expired).
  async getReview(id: string, requester: CurrentUserPayload) {
    const attempt = await this.getOwnedAttempt(id, requester);
    const current = await this.applyLazyExpiry(attempt);
    if (current.status === AttemptStatus.IN_PROGRESS) {
      throw new ConflictException("Finish the attempt to review your answers.");
    }

    const score = await this.gradingService.gradeAttempt(id);
    const entries = ((score.breakdown as any)?.questions ?? []) as {
      attemptQuestionId: string;
      isCorrect: boolean;
      pointsAwarded: number;
      pointsPossible: number;
    }[];
    const entryById = new Map(entries.map((e) => [e.attemptQuestionId, e]));

    const attemptQuestions = await this.prisma.attemptQuestion.findMany({
      where: { attemptId: id },
      include: { answer: true },
      orderBy: { order: "asc" },
    });

    return {
      attempt: { id: current.id, status: current.status, mode: current.mode },
      score: {
        rawScore: score.rawScore,
        maxScore: score.maxScore,
        percentage: score.percentage,
      },
      questions: attemptQuestions.map((aq) => {
        const snapshot = aq.snapshot as any;
        const entry = entryById.get(aq.id);
        return {
          id: aq.id,
          questionId: aq.questionId,
          order: aq.order,
          markedForReview: aq.markedForReview,
          type: snapshot.type,
          title: snapshot.title,
          stem: snapshot.stem,
          options: (snapshot.options ?? []).map((o: any) => ({
            label: o.label,
            content: o.content,
            sortOrder: o.sortOrder,
          })),
          answer: aq.answer?.responseData ?? null,
          pointsAwarded: entry?.pointsAwarded ?? 0,
          pointsPossible: entry?.pointsPossible ?? 1,
          feedback: buildFeedback(snapshot, (aq.answer?.responseData as any) ?? null),
        };
      }),
    };
  }

  async getResult(id: string, requester: CurrentUserPayload) {
    const attempt = await this.getOwnedAttempt(id, requester);
    if (attempt.status === AttemptStatus.IN_PROGRESS) {
      throw new ConflictException("This attempt has not been submitted yet");
    }
    const score = await this.gradingService.gradeAttempt(id);

    const examVersion = await this.prisma.examVersion.findUnique({
      where: { id: attempt.examVersionId },
      include: { exam: true },
    });

    const topics = (score.breakdown as any)?.topics ?? [];
    const weakTopics = examVersion
      ? deriveAttemptWeakTopics(topics, { slug: examVersion.exam.slug, title: examVersion.exam.title })
      : [];
    // Computed fresh on every call (never persisted into Score.breakdown) so
    // it reflects the tutor's current approval status/specializations, not
    // whatever was true when this attempt happened to first get graded.
    const tutorSuggestions = await this.tutorsService.matchForWeakTopics(weakTopics);

    return { ...score, tutorSuggestions };
  }

  async saveAnswer(id: string, questionId: string, dto: SaveAnswerDto, requester: CurrentUserPayload) {
    const attempt = await this.getOwnedAttempt(id, requester);
    if (attempt.userId !== requester.userId) {
      throw new ForbiddenException("Only the attempt owner can submit answers");
    }

    const current = await this.applyLazyExpiry(attempt);
    if (current.status !== AttemptStatus.IN_PROGRESS) {
      throw new ConflictException(`Cannot answer questions on a ${current.status} attempt`);
    }

    const attemptQuestion = await this.prisma.attemptQuestion.findUnique({
      where: { attemptId_questionId: { attemptId: id, questionId } },
      include: { answer: true },
    });
    if (!attemptQuestion) {
      throw new NotFoundException("This question is not part of this attempt");
    }

    const config = (await this.prisma.attemptSnapshot.findUnique({ where: { attemptId: id } }))
      ?.examVersionConfig as any;
    const allowAnswerChanges =
      attempt.mode === AttemptMode.PRACTICE ? true : (config?.navigation?.allowAnswerChanges ?? true);

    if (attemptQuestion.answer && !allowAnswerChanges) {
      throw new ConflictException("Answer changes are not allowed for this exam");
    }

    const answer = await this.prisma.answer.upsert({
      where: { attemptQuestionId: attemptQuestion.id },
      update: { responseData: dto.responseData as any },
      create: {
        attemptId: id,
        attemptQuestionId: attemptQuestion.id,
        responseData: dto.responseData as any,
      },
    });

    return answer;
  }

  async submit(id: string, requester: CurrentUserPayload) {
    const attempt = await this.getOwnedAttempt(id, requester);
    if (attempt.userId !== requester.userId) {
      throw new ForbiddenException("Only the attempt owner can submit this attempt");
    }

    // Idempotent: a repeat POST /submit on an already-terminal attempt just
    // returns the current state rather than erroring or double-submitting.
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return attempt;
    }

    const now = new Date();
    const isExpired = now >= attempt.expiresAt;
    const updated = await this.prisma.attempt.update({
      where: { id },
      data: isExpired
        ? { status: AttemptStatus.EXPIRED }
        : { status: AttemptStatus.SUBMITTED, submittedAt: now },
    });

    await this.gradingService.gradeAttempt(id);
    return updated;
  }

  private async getOwnedAttempt(id: string, requester: CurrentUserPayload): Promise<Attempt> {
    const attempt = await this.prisma.attempt.findUnique({ where: { id } });
    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }
    if (requester.role !== Role.ADMIN && attempt.userId !== requester.userId) {
      throw new ForbiddenException("You do not have access to this attempt");
    }
    return attempt;
  }

  // The server, never the client, decides when time is up: any read/write on
  // an attempt first checks `now >= expiresAt` and flips it to EXPIRED before
  // proceeding, rather than trusting a client-reported remaining time.
  private async applyLazyExpiry(attempt: Attempt): Promise<Attempt> {
    if (attempt.status === AttemptStatus.IN_PROGRESS && new Date() >= attempt.expiresAt) {
      const expired = await this.prisma.attempt.update({
        where: { id: attempt.id },
        data: { status: AttemptStatus.EXPIRED },
      });
      await this.gradingService.gradeAttempt(attempt.id);
      return expired;
    }
    return attempt;
  }
}
