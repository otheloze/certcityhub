import { deriveAttemptWeakTopics } from "./attempt-weak-topics.util";

const exam = { slug: "jamb-utme", title: "JAMB UTME" };

describe("deriveAttemptWeakTopics", () => {
  it("excludes a topic below the min-answered floor even at 0% accuracy", () => {
    const result = deriveAttemptWeakTopics(
      [{ topicId: "t1", title: "Algebra", correct: 0, total: 1, accuracy: 0 }],
      exam,
    );
    expect(result).toEqual([]);
  });

  it("includes a topic with enough samples below the accuracy threshold", () => {
    const result = deriveAttemptWeakTopics(
      [{ topicId: "t1", title: "Algebra", correct: 1, total: 3, accuracy: 33 }],
      exam,
    );
    expect(result).toEqual([{ topicId: "t1", title: "Algebra", examSlug: "jamb-utme", examTitle: "JAMB UTME" }]);
  });

  it("excludes a topic at or above the accuracy threshold", () => {
    const result = deriveAttemptWeakTopics(
      [{ topicId: "t1", title: "Algebra", correct: 3, total: 5, accuracy: 60 }],
      exam,
    );
    expect(result).toEqual([]);
  });

  it("sorts weakest-first", () => {
    const result = deriveAttemptWeakTopics(
      [
        { topicId: "t1", title: "Algebra", correct: 1, total: 4, accuracy: 25 },
        { topicId: "t2", title: "Geometry", correct: 0, total: 4, accuracy: 0 },
        { topicId: "t3", title: "Trig", correct: 2, total: 5, accuracy: 40 },
      ],
      exam,
    );
    expect(result.map((t) => t.topicId)).toEqual(["t2", "t1", "t3"]);
  });

  it("caps the result at the top-N weakest topics", () => {
    const result = deriveAttemptWeakTopics(
      [
        { topicId: "t1", title: "A", correct: 0, total: 3, accuracy: 0 },
        { topicId: "t2", title: "B", correct: 0, total: 3, accuracy: 10 },
        { topicId: "t3", title: "C", correct: 0, total: 3, accuracy: 20 },
        { topicId: "t4", title: "D", correct: 0, total: 3, accuracy: 30 },
      ],
      exam,
    );
    expect(result).toHaveLength(3);
    expect(result.map((t) => t.topicId)).toEqual(["t1", "t2", "t3"]);
  });

  it("stamps examSlug/examTitle from the exam param onto every entry", () => {
    const result = deriveAttemptWeakTopics(
      [{ topicId: "t1", title: "Algebra", correct: 1, total: 4, accuracy: 25 }],
      exam,
    );
    expect(result[0].examSlug).toBe("jamb-utme");
    expect(result[0].examTitle).toBe("JAMB UTME");
  });
});
