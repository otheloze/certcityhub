import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { calculateScore, ScorableAttemptQuestion, ScoringStrategyType } from "./score-calculator.util";

@Injectable()
export class GradingService {
  constructor(private readonly prisma: PrismaService) {}

  // Idempotent: called from both the explicit submit path and the lazy-expiry
  // path, so a second call (e.g. a retried request) just returns the
  // already-computed score rather than re-grading.
  async gradeAttempt(attemptId: string) {
    const existing = await this.prisma.score.findUnique({ where: { attemptId } });
    if (existing) {
      return existing;
    }

    const [attemptQuestions, snapshotRow] = await Promise.all([
      this.prisma.attemptQuestion.findMany({ where: { attemptId }, include: { answer: true } }),
      this.prisma.attemptSnapshot.findUnique({ where: { attemptId } }),
    ]);

    const strategy = ((snapshotRow?.examVersionConfig as any)?.scoringStrategy?.type ??
      "RAW") as ScoringStrategyType;

    const scorable: ScorableAttemptQuestion[] = attemptQuestions.map((aq) => ({
      attemptQuestionId: aq.id,
      questionId: aq.questionId,
      snapshot: aq.snapshot as any,
      responseData: (aq.answer?.responseData as any) ?? null,
    }));

    const result = calculateScore(scorable, strategy);
    const topics = await this.aggregateTopicBreakdown(
      attemptQuestions.map((aq) => aq.questionId),
      result.breakdown.questions,
    );

    return this.prisma.score.create({
      data: {
        attemptId,
        strategy,
        rawScore: result.rawScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        breakdown: { ...result.breakdown, topics } as any,
      },
    });
  }

  // Analytics-only: joins through whatever topic mappings are LIVE right now,
  // not a frozen snapshot - an admin re-tagging a question's topic later
  // shifts future reads of this breakdown, which is fine for analytics (it's
  // not the graded content itself, just how we bucket it for reporting).
  private async aggregateTopicBreakdown(
    questionIds: string[],
    entries: { questionId: string; isCorrect: boolean }[],
  ) {
    const mappings = await this.prisma.questionTopic.findMany({
      where: { questionId: { in: questionIds } },
      include: { topic: true },
    });

    const topicsByQuestionId = new Map<string, { id: string; title: string }[]>();
    for (const mapping of mappings) {
      const list = topicsByQuestionId.get(mapping.questionId) ?? [];
      list.push({ id: mapping.topic.id, title: mapping.topic.title });
      topicsByQuestionId.set(mapping.questionId, list);
    }

    const aggregate = new Map<string, { title: string; correct: number; total: number }>();
    for (const entry of entries) {
      for (const topic of topicsByQuestionId.get(entry.questionId) ?? []) {
        const agg = aggregate.get(topic.id) ?? { title: topic.title, correct: 0, total: 0 };
        agg.total += 1;
        if (entry.isCorrect) agg.correct += 1;
        aggregate.set(topic.id, agg);
      }
    }

    return [...aggregate.entries()].map(([topicId, agg]) => ({
      topicId,
      title: agg.title,
      correct: agg.correct,
      total: agg.total,
      accuracy: agg.total > 0 ? (agg.correct / agg.total) * 100 : 0,
    }));
  }
}
