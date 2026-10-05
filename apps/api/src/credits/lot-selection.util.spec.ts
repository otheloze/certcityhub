import { isLotEligible, LotCandidate, pickLot } from "./lot-selection.util";

const NOW = new Date("2026-09-28T12:00:00Z");
const DAY = 86_400_000;

function lot(overrides: Partial<LotCandidate> & { id: string }): LotCandidate {
  return {
    scopeType: "GLOBAL",
    examId: null,
    remaining: 1,
    expiresAt: null,
    questionFraction: 1,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("isLotEligible", () => {
  it("rejects an empty lot", () => {
    expect(isLotEligible(lot({ id: "a", remaining: 0 }), "exam-1", NOW)).toBe(false);
  });

  it("rejects an expired lot but accepts one expiring in the future", () => {
    expect(isLotEligible(lot({ id: "a", expiresAt: new Date(NOW.getTime() - 1) }), "exam-1", NOW)).toBe(false);
    expect(isLotEligible(lot({ id: "a", expiresAt: new Date(NOW.getTime() + DAY) }), "exam-1", NOW)).toBe(true);
  });

  it("accepts GLOBAL credits for any exam", () => {
    expect(isLotEligible(lot({ id: "a" }), "exam-1", NOW)).toBe(true);
    expect(isLotEligible(lot({ id: "a" }), "exam-2", NOW)).toBe(true);
  });

  it("only accepts EXAM-scoped credits for that exact exam", () => {
    const aws = lot({ id: "aws", scopeType: "EXAM", examId: "aws" });
    expect(isLotEligible(aws, "aws", NOW)).toBe(true);
    expect(isLotEligible(aws, "sat", NOW)).toBe(false);
  });
});

describe("pickLot", () => {
  it("returns null when nothing is eligible", () => {
    expect(pickLot([lot({ id: "a", remaining: 0 })], "exam-1", NOW)).toBeNull();
  });

  it("never picks another exam's credits", () => {
    const sat = lot({ id: "sat", scopeType: "EXAM", examId: "sat" });
    expect(pickLot([sat], "aws", NOW)).toBeNull();
  });

  it("uses full-exam credits before limited (free-plan) credits", () => {
    const free = lot({ id: "free", questionFraction: 0.25 });
    const paid = lot({ id: "paid", createdAt: new Date("2026-06-01T00:00:00Z") });
    expect(pickLot([free, paid], "exam-1", NOW)?.id).toBe("paid");
  });

  it("uses the soonest-expiring credits first, never-expiring last", () => {
    const never = lot({ id: "never" });
    const soon = lot({ id: "soon", expiresAt: new Date(NOW.getTime() + DAY) });
    const later = lot({ id: "later", expiresAt: new Date(NOW.getTime() + 30 * DAY) });
    expect(pickLot([never, later, soon], "exam-1", NOW)?.id).toBe("soon");
  });

  it("prefers exam-specific over global when otherwise equal", () => {
    const global = lot({ id: "global" });
    const specific = lot({ id: "specific", scopeType: "EXAM", examId: "exam-1" });
    expect(pickLot([global, specific], "exam-1", NOW)?.id).toBe("specific");
  });

  it("falls back to the oldest lot on a full tie", () => {
    const newer = lot({ id: "newer", createdAt: new Date("2026-05-01T00:00:00Z") });
    const older = lot({ id: "older", createdAt: new Date("2026-02-01T00:00:00Z") });
    expect(pickLot([newer, older], "exam-1", NOW)?.id).toBe("older");
  });

  it("skips an expired lot even if it would otherwise win", () => {
    const expired = lot({ id: "expired", expiresAt: new Date(NOW.getTime() - DAY) });
    const valid = lot({ id: "valid" });
    expect(pickLot([expired, valid], "exam-1", NOW)?.id).toBe("valid");
  });
});
