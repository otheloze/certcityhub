import { gradeAnswer, GradableSnapshot } from "./answer-grading.util";

export type ScoringStrategyType = "RAW" | "PERCENTAGE" | "WEIGHTED";

export interface ScorableAttemptQuestion {
  attemptQuestionId: string;
  questionId: string;
  snapshot: GradableSnapshot & { difficulty?: number | null };
  responseData: Record<string, unknown> | null;
}

export interface QuestionBreakdownEntry {
  attemptQuestionId: string;
  questionId: string;
  isCorrect: boolean;
  answered: boolean;
  pointsAwarded: number;
  pointsPossible: number;
}

export interface ScoreResult {
  rawScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    questions: QuestionBreakdownEntry[];
  };
}

// WEIGHTED uses each question's difficulty (1-5) as its point value; RAW and
// PERCENTAGE both weight every question equally - they differ only in how a
// UI would primarily present the same underlying rawScore/maxScore.
function pointsPossibleFor(
  strategy: ScoringStrategyType,
  snapshot: ScorableAttemptQuestion["snapshot"],
): number {
  if (strategy === "WEIGHTED") {
    return snapshot.difficulty ?? 1;
  }
  return 1;
}

export function calculateScore(
  questions: ScorableAttemptQuestion[],
  strategy: ScoringStrategyType,
): ScoreResult {
  const breakdown: QuestionBreakdownEntry[] = questions.map((q) => {
    const pointsPossible = pointsPossibleFor(strategy, q.snapshot);
    const { isCorrect, fraction } = gradeAnswer(q.snapshot, q.responseData);
    return {
      attemptQuestionId: q.attemptQuestionId,
      questionId: q.questionId,
      isCorrect,
      answered: q.responseData != null,
      pointsAwarded: fraction * pointsPossible,
      pointsPossible,
    };
  });

  const rawScore = breakdown.reduce((sum, b) => sum + b.pointsAwarded, 0);
  const maxScore = breakdown.reduce((sum, b) => sum + b.pointsPossible, 0);
  const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;

  return { rawScore, maxScore, percentage, breakdown: { questions: breakdown } };
}
