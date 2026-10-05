// Pure, DB-free selection logic so the blueprint rule is unit-testable
// without Prisma. Sprint 2 keeps this deliberately simple: pick N published
// questions, optionally shuffled - no per-topic quota or difficulty
// distribution yet (see the architecture doc's future question-pool design).

export interface SelectableQuestion {
  id: string;
  [key: string]: unknown;
}

export interface BlueprintConfig {
  questionCount: number;
  randomize: boolean;
}

// Deterministic ordering (by whatever order `questions` was already fetched
// in, e.g. createdAt asc) when randomize=false, so a fixed-sequence exam
// stays reproducible across attempts.
export function selectQuestions<T extends SelectableQuestion>(
  questions: T[],
  blueprint: BlueprintConfig,
): T[] {
  const pool = blueprint.randomize ? shuffle(questions) : questions;
  return pool.slice(0, Math.min(blueprint.questionCount, pool.length));
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
