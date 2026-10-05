import { QuestionType } from "@examproject/shared-types";
import { gradeAnswer, GradableSnapshot } from "../scoring/answer-grading.util";

// Used by PRACTICE attempts (instant feedback) and the post-exam review.
// Reveals the answer key, so it must never be served for an in-progress
// simulation - the callers enforce that.

export interface AnswerFeedback {
  isCorrect: boolean;
  fraction: number;
  correct: {
    optionLabels?: string[];
    value?: number;
    tolerance?: number;
    acceptedAnswers?: string[];
  };
  explanation: unknown | null;
}

export function buildFeedback(
  snapshot: GradableSnapshot & { explanation?: unknown },
  responseData: Record<string, unknown> | null | undefined,
): AnswerFeedback {
  const { isCorrect, fraction } = gradeAnswer(snapshot, responseData);

  const correct: AnswerFeedback["correct"] = {};
  switch (snapshot.type) {
    case QuestionType.SINGLE_CHOICE:
    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.TRUE_FALSE:
      correct.optionLabels = (snapshot.options ?? []).filter((o) => o.isCorrect).map((o) => o.label);
      break;
    case QuestionType.NUMERIC:
      correct.value = snapshot.answerSchema?.correctValue as number | undefined;
      correct.tolerance = snapshot.answerSchema?.tolerance as number | undefined;
      break;
    case QuestionType.SHORT_ANSWER:
      correct.acceptedAnswers = (snapshot.answerSchema?.acceptedAnswers as string[] | undefined) ?? [];
      break;
  }

  return { isCorrect, fraction, correct, explanation: snapshot.explanation ?? null };
}
