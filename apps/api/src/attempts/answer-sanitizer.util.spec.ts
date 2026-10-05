import { QuestionType } from "@examproject/shared-types";
import { sanitizeQuestionSnapshot } from "./answer-sanitizer.util";

describe("sanitizeQuestionSnapshot", () => {
  it("strips isCorrect from every option", () => {
    const sanitized = sanitizeQuestionSnapshot({
      type: QuestionType.SINGLE_CHOICE,
      stem: { blocks: [] },
      answerSchema: { allowPartialCredit: false },
      options: [
        { label: "A", content: {}, isCorrect: true, sortOrder: 0 },
        { label: "B", content: {}, isCorrect: false, sortOrder: 1 },
      ],
    });

    expect(sanitized.options?.every((o) => !("isCorrect" in o))).toBe(true);
  });

  it("strips correctValue/tolerance from a NUMERIC answerSchema", () => {
    const sanitized = sanitizeQuestionSnapshot({
      type: QuestionType.NUMERIC,
      stem: { blocks: [] },
      answerSchema: { correctValue: 42, tolerance: 0.5, unit: "kg" },
    });

    expect(sanitized.answerSchema).toEqual({ unit: "kg" });
  });

  it("strips acceptedAnswers from a SHORT_ANSWER answerSchema", () => {
    const sanitized = sanitizeQuestionSnapshot({
      type: QuestionType.SHORT_ANSWER,
      stem: { blocks: [] },
      answerSchema: { acceptedAnswers: ["x"], caseSensitive: false, matchType: "exact" },
    });

    expect(sanitized.answerSchema).toEqual({ caseSensitive: false, matchType: "exact" });
  });

  it("always strips the explanation entirely", () => {
    const sanitized = sanitizeQuestionSnapshot({
      type: QuestionType.TRUE_FALSE,
      stem: { blocks: [] },
      answerSchema: { allowPartialCredit: false },
      explanation: { blocks: [{ type: "text", text: "because..." }] },
    });

    expect("explanation" in sanitized).toBe(false);
  });
});
