import { QuestionType } from "@examproject/shared-types";
import { gradeAnswer } from "./answer-grading.util";

describe("gradeAnswer", () => {
  it("returns unanswered when no responseData is given", () => {
    const result = gradeAnswer(
      { type: QuestionType.SINGLE_CHOICE, answerSchema: {}, options: [] },
      null,
    );
    expect(result).toEqual({ isCorrect: false, fraction: 0 });
  });

  describe("SINGLE_CHOICE / TRUE_FALSE", () => {
    const snapshot = {
      type: QuestionType.SINGLE_CHOICE,
      answerSchema: { allowPartialCredit: false },
      options: [
        { label: "A", isCorrect: true },
        { label: "B", isCorrect: false },
      ],
    };

    it("awards full credit for the correct option", () => {
      expect(gradeAnswer(snapshot, { optionLabel: "A" })).toEqual({ isCorrect: true, fraction: 1 });
    });

    it("awards no credit for the wrong option", () => {
      expect(gradeAnswer(snapshot, { optionLabel: "B" })).toEqual({ isCorrect: false, fraction: 0 });
    });

    it("treats selecting more than one option as unanswered", () => {
      expect(gradeAnswer(snapshot, { optionLabels: ["A", "B"] })).toEqual({
        isCorrect: false,
        fraction: 0,
      });
    });
  });

  describe("MULTIPLE_CHOICE", () => {
    const options = [
      { label: "A", isCorrect: true },
      { label: "B", isCorrect: true },
      { label: "C", isCorrect: false },
    ];

    it("all-or-nothing: exact match required when allowPartialCredit is false", () => {
      const snapshot = { type: QuestionType.MULTIPLE_CHOICE, answerSchema: { allowPartialCredit: false }, options };
      expect(gradeAnswer(snapshot, { optionLabels: ["A", "B"] })).toEqual({ isCorrect: true, fraction: 1 });
      expect(gradeAnswer(snapshot, { optionLabels: ["A"] })).toEqual({ isCorrect: false, fraction: 0 });
      expect(gradeAnswer(snapshot, { optionLabels: ["A", "B", "C"] })).toEqual({
        isCorrect: false,
        fraction: 0,
      });
    });

    it("awards partial credit proportional to correct minus incorrect selections when enabled", () => {
      const snapshot = { type: QuestionType.MULTIPLE_CHOICE, answerSchema: { allowPartialCredit: true }, options };
      // 1 correct, 0 incorrect out of 2 correct options => 0.5
      expect(gradeAnswer(snapshot, { optionLabels: ["A"] }).fraction).toBeCloseTo(0.5);
      // 1 correct, 1 incorrect => (1-1)/2 = 0
      expect(gradeAnswer(snapshot, { optionLabels: ["A", "C"] }).fraction).toBeCloseTo(0);
      // never goes negative: 0 correct, 1 incorrect => max(0, (0-1)/2) = 0
      expect(gradeAnswer(snapshot, { optionLabels: ["C"] }).fraction).toBe(0);
    });
  });

  describe("NUMERIC", () => {
    const snapshot = {
      type: QuestionType.NUMERIC,
      answerSchema: { correctValue: 100, tolerance: 0.5 },
    };

    it("accepts a value within tolerance", () => {
      expect(gradeAnswer(snapshot, { value: 100.4 })).toEqual({ isCorrect: true, fraction: 1 });
    });

    it("rejects a value outside tolerance", () => {
      expect(gradeAnswer(snapshot, { value: 101 })).toEqual({ isCorrect: false, fraction: 0 });
    });
  });

  describe("SHORT_ANSWER", () => {
    it("matches exactly, case-insensitively by default", () => {
      const snapshot = {
        type: QuestionType.SHORT_ANSWER,
        answerSchema: { acceptedAnswers: ["Paris"], caseSensitive: false, matchType: "exact" },
      };
      expect(gradeAnswer(snapshot, { text: "paris" })).toEqual({ isCorrect: true, fraction: 1 });
      expect(gradeAnswer(snapshot, { text: "London" })).toEqual({ isCorrect: false, fraction: 0 });
    });

    it("respects caseSensitive: true", () => {
      const snapshot = {
        type: QuestionType.SHORT_ANSWER,
        answerSchema: { acceptedAnswers: ["Paris"], caseSensitive: true, matchType: "exact" },
      };
      expect(gradeAnswer(snapshot, { text: "paris" })).toEqual({ isCorrect: false, fraction: 0 });
    });

    it("supports contains matching", () => {
      const snapshot = {
        type: QuestionType.SHORT_ANSWER,
        answerSchema: { acceptedAnswers: ["error"], caseSensitive: false, matchType: "contains" },
      };
      expect(gradeAnswer(snapshot, { text: "a network error occurred" })).toEqual({
        isCorrect: true,
        fraction: 1,
      });
    });
  });
});
