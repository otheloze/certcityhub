import { QuestionType } from "@examproject/shared-types";
import { limitedQuestionCount } from "./question-fraction.util";
import { collectSubtreeIds } from "./topic-subtree.util";
import { buildFeedback } from "./answer-feedback.util";

describe("limitedQuestionCount", () => {
  it("keeps the full count at fraction 1", () => {
    expect(limitedQuestionCount(40, 1)).toBe(40);
  });

  it("limits the free plan to a quarter, rounding up", () => {
    expect(limitedQuestionCount(40, 0.25)).toBe(10);
    expect(limitedQuestionCount(18, 0.25)).toBe(5);
  });

  it("always offers at least one question and never more than the total", () => {
    expect(limitedQuestionCount(2, 0.1)).toBe(1);
    expect(limitedQuestionCount(3, 5)).toBe(3);
  });

  it("returns 0 for an empty exam", () => {
    expect(limitedQuestionCount(0, 0.25)).toBe(0);
  });
});

describe("collectSubtreeIds", () => {
  const topics = [
    { id: "root", parentId: null },
    { id: "a", parentId: "root" },
    { id: "a1", parentId: "a" },
    { id: "a1x", parentId: "a1" },
    { id: "b", parentId: "root" },
  ];

  it("includes the topic and every descendant at any depth", () => {
    expect(collectSubtreeIds(topics, "a").sort()).toEqual(["a", "a1", "a1x"]);
  });

  it("returns only itself for a leaf", () => {
    expect(collectSubtreeIds(topics, "b")).toEqual(["b"]);
  });

  it("does not loop forever on a corrupt cycle", () => {
    const cyclic = [
      { id: "x", parentId: "y" },
      { id: "y", parentId: "x" },
    ];
    expect(collectSubtreeIds(cyclic, "x").sort()).toEqual(["x", "y"]);
  });
});

describe("buildFeedback", () => {
  it("reveals the correct option labels and explanation for a wrong choice", () => {
    const feedback = buildFeedback(
      {
        type: QuestionType.SINGLE_CHOICE,
        answerSchema: {},
        options: [
          { label: "A", isCorrect: false },
          { label: "B", isCorrect: true },
        ],
        explanation: { blocks: [{ type: "text", text: "Because B." }] },
      },
      { optionLabel: "A" },
    );
    expect(feedback.isCorrect).toBe(false);
    expect(feedback.correct.optionLabels).toEqual(["B"]);
    expect(feedback.explanation).toEqual({ blocks: [{ type: "text", text: "Because B." }] });
  });

  it("reveals the numeric key and tolerance", () => {
    const feedback = buildFeedback(
      { type: QuestionType.NUMERIC, answerSchema: { correctValue: 10, tolerance: 0.5 } },
      { value: 10.2 },
    );
    expect(feedback.isCorrect).toBe(true);
    expect(feedback.correct).toEqual({ value: 10, tolerance: 0.5 });
    expect(feedback.explanation).toBeNull();
  });

  it("reveals accepted answers for short-answer questions", () => {
    const feedback = buildFeedback(
      {
        type: QuestionType.SHORT_ANSWER,
        answerSchema: { acceptedAnswers: ["paris"], caseSensitive: false, matchType: "exact" },
      },
      null,
    );
    expect(feedback.isCorrect).toBe(false);
    expect(feedback.correct.acceptedAnswers).toEqual(["paris"]);
  });
});
