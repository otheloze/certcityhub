// Pure, DB-free choice of WHICH credit lot pays for an attempt, so the policy
// is unit-testable. The caller holds a per-user lock, so this decision and the
// decrement that follows cannot interleave with another start for that user.

export interface LotCandidate {
  id: string;
  scopeType: "GLOBAL" | "EXAM";
  examId: string | null;
  remaining: number;
  expiresAt: Date | null;
  questionFraction: number;
  createdAt: Date;
}

export function isLotEligible(lot: LotCandidate, examId: string, now: Date): boolean {
  if (lot.remaining <= 0) return false;
  if (lot.expiresAt && lot.expiresAt <= now) return false;
  return lot.scopeType === "GLOBAL" || (lot.scopeType === "EXAM" && lot.examId === examId);
}

// Order of use:
//  1. Full-exam lots before limited (e.g. free-plan) lots, so a user who has
//     bought attempts never silently burns one on a shortened exam.
//  2. Soonest expiry first (use it or lose it); never-expiring last.
//  3. Exam-specific before global, keeping flexible credits flexible.
//  4. Oldest first.
export function pickLot<T extends LotCandidate>(lots: T[], examId: string, now: Date): T | null {
  const eligible = lots.filter((lot) => isLotEligible(lot, examId, now));
  if (eligible.length === 0) return null;

  return [...eligible].sort((a, b) => {
    if (a.questionFraction !== b.questionFraction) return b.questionFraction - a.questionFraction;

    const aExpiry = a.expiresAt ? a.expiresAt.getTime() : Number.POSITIVE_INFINITY;
    const bExpiry = b.expiresAt ? b.expiresAt.getTime() : Number.POSITIVE_INFINITY;
    if (aExpiry !== bExpiry) return aExpiry - bExpiry;

    if (a.scopeType !== b.scopeType) return a.scopeType === "EXAM" ? -1 : 1;

    return a.createdAt.getTime() - b.createdAt.getTime();
  })[0];
}
