import { buildQuestionSnapshot } from "./question-snapshot.util";

describe("buildQuestionSnapshot", () => {
  it("keeps only exam-content fields, dropping DB bookkeeping columns", () => {
    const snapshot = buildQuestionSnapshot({
      id: "q1",
      type: "SINGLE_CHOICE",
      title: "A title",
      stem: { blocks: [] },
      answerSchema: { allowPartialCredit: false },
      explanation: { blocks: [] },
      difficulty: 3,
      estimatedTimeSeconds: 60,
      tags: ["seed"],
      options: [{ id: "o1", label: "A", content: {}, isCorrect: true, sortOrder: 0 }],
    });

    expect(snapshot).not.toHaveProperty("id");
    expect(snapshot).not.toHaveProperty("createdAt");
    expect(snapshot.type).toBe("SINGLE_CHOICE");
    expect(snapshot.options).toEqual([
      { id: "o1", label: "A", content: {}, isCorrect: true, sortOrder: 0 },
    ]);
  });
});
