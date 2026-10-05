import { selectQuestions } from "./question-selection.util";

describe("selectQuestions", () => {
  const questions = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

  it("keeps input order and caps at questionCount when not randomized", () => {
    const result = selectQuestions(questions, { questionCount: 2, randomize: false });
    expect(result.map((q) => q.id)).toEqual(["a", "b"]);
  });

  it("returns all available questions if questionCount exceeds the pool size", () => {
    const result = selectQuestions(questions, { questionCount: 10, randomize: false });
    expect(result).toHaveLength(4);
  });

  it("returns a shuffled subset of the requested size when randomized", () => {
    const result = selectQuestions(questions, { questionCount: 3, randomize: true });
    expect(result).toHaveLength(3);
    const ids = result.map((q) => q.id);
    // Every selected id must come from the original pool, with no duplicates.
    expect(new Set(ids).size).toBe(3);
    for (const id of ids) {
      expect(["a", "b", "c", "d"]).toContain(id);
    }
  });
});
