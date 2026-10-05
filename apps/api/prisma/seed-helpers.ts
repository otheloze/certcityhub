import { QuestionType } from "@prisma/client";

export interface Q {
  type: QuestionType;
  stem: string;
  explanation: string;
  answerSchema: Record<string, unknown>;
  options?: { label: string; text: string; isCorrect: boolean }[];
  difficulty: number;
  passage?: string;
}

const LABELS = ["A", "B", "C", "D", "E", "F"];

// Deterministic rotation so the correct answer is not always in the same slot.
function rotate<T>(items: T[], seed: string): { rotated: T[]; shift: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const shift = h % items.length;
  return { rotated: [...items.slice(shift), ...items.slice(0, shift)], shift };
}

export const mc = (stem: string, opts: string[], correct: number, explanation: string, difficulty = 2): Q => {
  const { rotated, shift } = rotate(opts, stem);
  const newCorrect = (correct - shift + opts.length) % opts.length;
  return {
    type: QuestionType.SINGLE_CHOICE,
    stem,
    explanation,
    answerSchema: { allowPartialCredit: false },
    options: rotated.map((text, i) => ({ label: LABELS[i], text, isCorrect: i === newCorrect })),
    difficulty,
  };
};

export const multi = (stem: string, opts: string[], correct: number[], explanation: string, difficulty = 3): Q => ({
  type: QuestionType.MULTIPLE_CHOICE,
  stem,
  explanation,
  answerSchema: { allowPartialCredit: false },
  options: opts.map((text, i) => ({ label: LABELS[i], text, isCorrect: correct.includes(i) })),
  difficulty,
});

export const tf = (stem: string, answer: boolean, explanation: string, difficulty = 2): Q => ({
  type: QuestionType.TRUE_FALSE,
  stem,
  explanation,
  answerSchema: { allowPartialCredit: false },
  options: [
    { label: "True", text: "True", isCorrect: answer },
    { label: "False", text: "False", isCorrect: !answer },
  ],
  difficulty,
});

export const num = (stem: string, value: number, explanation: string, tolerance = 0, difficulty = 2): Q => ({
  type: QuestionType.NUMERIC,
  stem,
  explanation,
  answerSchema: { correctValue: value, tolerance },
  difficulty,
});

export interface ExamSeed {
  slug: string;
  title: string;
  shortCode: string;
  provider: string;
  level: string;
  category: string;
  sortOrder: number;
  durationMinutes: number;
  blueprint?: { questionCount: number; randomize: boolean };
  description: string;
  topics: { title: string; questions: Q[] }[];
}

// Scenario-style helpers: harder default difficulty, same option handling.
export const sc = (stem: string, opts: string[], correct: number, explanation: string): Q =>
  mc(stem, opts, correct, explanation, 3);

export const ms = (stem: string, opts: string[], correct: number[], explanation: string): Q =>
  multi(stem, opts, correct, explanation, 4);

// Short-answer question (gap-fill, word formation, key-word transformation).
export const sa = (stem: string, accepted: string[], explanation: string, difficulty = 3): Q => ({
  type: QuestionType.SHORT_ANSWER,
  stem,
  explanation,
  answerSchema: { acceptedAnswers: accepted, caseSensitive: false, matchType: "exact" },
  difficulty,
});

// Attach one shared reading passage or transcript to a set of questions.
export const withPassage = (passage: string, questions: Q[]): Q[] => questions.map((q) => ({ ...q, passage }));
