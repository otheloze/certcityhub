import { QuestionType } from "@examproject/shared-types";
import { calculateScore, ScorableAttemptQuestion } from "./score-calculator.util";

function question(
  attemptQuestionId: string,
  isCorrect: boolean,
  answered: boolean,
  difficulty: number | null = null,
): ScorableAttemptQuestion {
  return {
    attemptQuestionId,
    questionId: `q-${attemptQuestionId}`,
    snapshot: {
      type: QuestionType.SINGLE_CHOICE,
      answerSchema: {},
      difficulty,
      options: [
        { label: "A", isCorrect: true },
        { label: "B", isCorrect: false },
      ],
    },
    responseData: answered ? { optionLabel: isCorrect ? "A" : "B" } : null,
  };
}

describe("calculateScore", () => {
  it("weights every question equally under RAW/PERCENTAGE", () => {
    const questions = [question("1", true, true), question("2", false, true), question("3", true, true)];
    const result = calculateScore(questions, "RAW");
    expect(result.rawScore).toBe(2);
    expect(result.maxScore).toBe(3);
    expect(result.percentage).toBeCloseTo((2 / 3) * 100);
  });

  it("weights questions by difficulty under WEIGHTED", () => {
    const questions = [
      question("1", true, true, 5),
      question("2", false, true, 3),
      question("3", true, true, 1),
    ];
    const result = calculateScore(questions, "WEIGHTED");
    expect(result.maxScore).toBe(9); // 5 + 3 + 1
    expect(result.rawScore).toBe(6); // 5 (correct) + 0 (wrong) + 1 (correct)
  });

  it("treats an unanswered question as zero points but still counts it toward maxScore", () => {
    const questions = [question("1", true, true), question("2", false, false)];
    const result = calculateScore(questions, "RAW");
    expect(result.maxScore).toBe(2);
    expect(result.rawScore).toBe(1);
    expect(result.breakdown.questions[1].answered).toBe(false);
  });

  it("returns 0 percentage rather than NaN when there are no questions", () => {
    const result = calculateScore([], "RAW");
    expect(result.percentage).toBe(0);
  });
});
