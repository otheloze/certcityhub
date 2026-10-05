import { QuestionStatus } from "@examproject/shared-types";
import { QuestionStatusService } from "./question-status.service";

describe("QuestionStatusService", () => {
  const service = new QuestionStatusService();

  it("accepts the full legal chain DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> RETIRED", () => {
    expect(service.isTransitionAllowed(QuestionStatus.DRAFT, QuestionStatus.IN_REVIEW)).toBe(true);
    expect(service.isTransitionAllowed(QuestionStatus.IN_REVIEW, QuestionStatus.APPROVED)).toBe(true);
    expect(service.isTransitionAllowed(QuestionStatus.APPROVED, QuestionStatus.PUBLISHED)).toBe(true);
    expect(service.isTransitionAllowed(QuestionStatus.PUBLISHED, QuestionStatus.RETIRED)).toBe(true);
  });

  it("allows rejection back to DRAFT from IN_REVIEW or APPROVED", () => {
    expect(service.isTransitionAllowed(QuestionStatus.IN_REVIEW, QuestionStatus.DRAFT)).toBe(true);
    expect(service.isTransitionAllowed(QuestionStatus.APPROVED, QuestionStatus.DRAFT)).toBe(true);
  });

  it("rejects a direct jump from DRAFT to PUBLISHED", () => {
    expect(service.isTransitionAllowed(QuestionStatus.DRAFT, QuestionStatus.PUBLISHED)).toBe(false);
  });

  it("treats RETIRED as terminal", () => {
    for (const target of Object.values(QuestionStatus)) {
      expect(service.isTransitionAllowed(QuestionStatus.RETIRED, target)).toBe(false);
    }
  });
});
