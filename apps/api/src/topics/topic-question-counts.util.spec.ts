import { annotateQuestionCounts } from "./topic-question-counts.util";

const tree = [
  {
    id: "a",
    children: [
      { id: "a1", children: [] },
      { id: "a2", children: [{ id: "a2x", children: [] }] },
    ],
  },
  { id: "b", children: [] },
];

describe("annotateQuestionCounts", () => {
  it("counts questions in a node and its whole subtree", () => {
    const out = annotateQuestionCounts(tree, [
      { questionId: "q1", topicId: "a1" },
      { questionId: "q2", topicId: "a2x" },
      { questionId: "q3", topicId: "a" },
      { questionId: "q4", topicId: "b" },
    ]);
    expect(out[0].questionCount).toBe(3);
    expect(out[0].children[1].questionCount).toBe(1);
    expect(out[1].questionCount).toBe(1);
  });

  it("counts a question tagged to two siblings only once in the parent", () => {
    const out = annotateQuestionCounts(tree, [
      { questionId: "q1", topicId: "a1" },
      { questionId: "q1", topicId: "a2x" },
    ]);
    expect(out[0].children[0].questionCount).toBe(1);
    expect(out[0].children[1].questionCount).toBe(1);
    expect(out[0].questionCount).toBe(1);
  });

  it("returns zero for empty topics and does not mutate the input", () => {
    const out = annotateQuestionCounts(tree, []);
    expect(out[0].questionCount).toBe(0);
    expect((tree[0] as any).questionCount).toBeUndefined();
  });
});
