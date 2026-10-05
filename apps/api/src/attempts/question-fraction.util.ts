// A credit lot can limit an attempt to a fraction of the exam (the free plan
// is "a quarter of the real exam"). Always at least one question, never more
// than the total.
export function limitedQuestionCount(total: number, fraction: number): number {
  if (total <= 0) return 0;
  if (fraction >= 1) return total;
  return Math.min(total, Math.max(1, Math.ceil(total * fraction)));
}
