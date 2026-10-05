// Builds the frozen, JSON-safe snapshot stored on AttemptQuestion.snapshot.
// Deliberately picks only the fields that matter for taking/grading a
// question - never the live row's Date/bookkeeping columns (createdAt,
// createdById, ...), which have no place in a historical snapshot anyway.

export interface SourceOption {
  id: string;
  label: string;
  content: unknown;
  isCorrect: boolean;
  sortOrder: number;
}

export interface SourceQuestion {
  id: string;
  type: string;
  title: string | null;
  stem: unknown;
  answerSchema: unknown;
  explanation: unknown;
  difficulty: number | null;
  estimatedTimeSeconds: number | null;
  tags: string[];
  options: SourceOption[];
}

export function buildQuestionSnapshot(question: SourceQuestion) {
  return {
    type: question.type,
    title: question.title,
    stem: question.stem,
    answerSchema: question.answerSchema,
    explanation: question.explanation,
    difficulty: question.difficulty,
    estimatedTimeSeconds: question.estimatedTimeSeconds,
    tags: question.tags,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      content: option.content,
      isCorrect: option.isCorrect,
      sortOrder: option.sortOrder,
    })),
  };
}
