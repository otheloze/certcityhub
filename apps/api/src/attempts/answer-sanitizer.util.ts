import { QuestionType } from "@examproject/shared-types";

// Strips everything that would leak the correct answer from a frozen
// AttemptQuestion.snapshot before it's served to the student during an
// in-progress attempt - "no explanations during exam, no hints" per the
// exam-integrity requirement. The full snapshot (with answer keys) stays in
// the DB for the grading module to use later.

export interface SanitizableOption {
  id?: string;
  label: string;
  content: unknown;
  isCorrect?: boolean;
  sortOrder: number;
}

export type SanitizedOption = Omit<SanitizableOption, "isCorrect">;

export interface SanitizableQuestionSnapshot {
  type: QuestionType;
  title?: string | null;
  stem: unknown;
  answerSchema: Record<string, unknown>;
  explanation?: unknown;
  options?: SanitizableOption[];
  difficulty?: number | null;
  estimatedTimeSeconds?: number | null;
  tags?: string[];
}

export interface SanitizedQuestionSnapshot {
  type: QuestionType;
  title?: string | null;
  stem: unknown;
  answerSchema: Record<string, unknown>;
  options?: SanitizedOption[];
  difficulty?: number | null;
  estimatedTimeSeconds?: number | null;
  tags?: string[];
}

const ANSWER_SCHEMA_STRIP_KEYS: Partial<Record<QuestionType, string[]>> = {
  [QuestionType.NUMERIC]: ["correctValue", "tolerance"],
  [QuestionType.SHORT_ANSWER]: ["acceptedAnswers"],
};

export function sanitizeQuestionSnapshot(
  snapshot: SanitizableQuestionSnapshot,
): SanitizedQuestionSnapshot {
  const strippedKeys = ANSWER_SCHEMA_STRIP_KEYS[snapshot.type] ?? [];
  const answerSchema = { ...snapshot.answerSchema };
  for (const key of strippedKeys) {
    delete answerSchema[key];
  }

  const options: SanitizedOption[] | undefined = snapshot.options?.map((option) => {
    const { isCorrect: _isCorrect, ...rest } = option;
    return rest;
  });

  return {
    type: snapshot.type,
    title: snapshot.title,
    stem: snapshot.stem,
    answerSchema,
    options,
    difficulty: snapshot.difficulty,
    estimatedTimeSeconds: snapshot.estimatedTimeSeconds,
    tags: snapshot.tags,
  };
}
