import { buildDashboard, computeStreak, DashAttempt, estimateReadiness, pickRecommendation, splitTopics } from "./dashboard.util";

const exam = { id: "e1", slug: "aws", title: "AWS", shortCode: "CLF", category: "Cloud" };
const day = (n: number) => new Date(Date.UTC(2026, 0, n, 12));

type Topics = { topicId: string; title: string; correct: number; total: number }[];

function attempt(over: Partial<DashAttempt> & { pct?: number; topics?: Topics }): DashAttempt {
  const { pct, topics, ...rest } = over;
  return {
    id: Math.random().toString(36).slice(2),
    mode: "SIMULATION",
    status: "SUBMITTED",
    startedAt: day(10),
    examVersionId: "v1",
    exam,
    score:
      pct === undefined
        ? null
        : {
            percentage: pct,
            rawScore: pct,
            maxScore: 100,
            breakdown: { questions: [{ answered: true }, { answered: false }], topics: topics ?? [] },
          },
    ...rest,
  };
}

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak([day(8), day(9), day(10)], day(10))).toBe(3);
  });
  it("still counts when the last activity was yesterday", () => {
    expect(computeStreak([day(8), day(9)], day(10))).toBe(2);
  });
  it("is zero after a gap of a full day", () => {
    expect(computeStreak([day(7)], day(10))).toBe(0);
  });
  it("counts several attempts on one day once", () => {
    expect(computeStreak([day(10), day(10)], day(10))).toBe(1);
  });
});

describe("estimateReadiness", () => {
  it("is null with no simulations", () => {
    expect(estimateReadiness([attempt({ mode: "PRACTICE", pct: 90 })])).toBeNull();
  });
  it("averages only the latest five simulations", () => {
    const sims = [50, 50, 50, 50, 50, 100].map((pct, i) => attempt({ pct, startedAt: day(i + 1) }));
    // the 100 is the newest, the oldest 50 falls out of the window: (50*4 + 100) / 5 = 60
    expect(estimateReadiness(sims)).toEqual({ percentage: 60, basedOn: 5 });
  });
});

describe("splitTopics", () => {
  const base = { examTitle: "AWS", examSlug: "aws", examVersionId: "v1" };
  it("ignores topics below the minimum sample size", () => {
    const { weakTopics } = splitTopics([{ ...base, topicId: "t", title: "T", correct: 0, total: 2, accuracy: 0 }]);
    expect(weakTopics).toHaveLength(0);
  });
  it("sorts weak topics weakest first and strong topics strongest first", () => {
    const { weakTopics, strongTopics } = splitTopics([
      { ...base, topicId: "a", title: "A", correct: 2, total: 4, accuracy: 50 },
      { ...base, topicId: "b", title: "B", correct: 1, total: 4, accuracy: 25 },
      { ...base, topicId: "c", title: "C", correct: 4, total: 4, accuracy: 100 },
      { ...base, topicId: "d", title: "D", correct: 3, total: 4, accuracy: 75 },
    ]);
    expect(weakTopics.map((t) => t.topicId)).toEqual(["b", "a"]);
    expect(strongTopics.map((t) => t.topicId)).toEqual(["c", "d"]);
  });
});

describe("pickRecommendation", () => {
  it("starts new users at the catalogue", () => {
    expect(pickRecommendation([], []).kind).toBe("START");
  });
  it("recommends practising the weakest sampled topic", () => {
    const rec = pickRecommendation(
      [attempt({ pct: 40 })],
      [{ topicId: "t1", title: "Networking", examTitle: "AWS", examSlug: "aws", examVersionId: "v1", correct: 1, total: 5, accuracy: 20 }],
    );
    expect(rec.kind).toBe("PRACTICE_TOPIC");
    expect(rec.topicId).toBe("t1");
  });
  it("suggests a simulation to someone who has only practised", () => {
    expect(pickRecommendation([attempt({ mode: "PRACTICE", pct: 80 })], []).kind).toBe("TAKE_SIMULATION");
  });
});

describe("buildDashboard", () => {
  it("summarises stats, exams and topic accuracy across attempts", () => {
    const topics: Topics = [{ topicId: "t1", title: "IAM", correct: 1, total: 3 }];
    const d = buildDashboard(
      [attempt({ pct: 40, startedAt: day(9), topics }), attempt({ pct: 60, startedAt: day(10), topics })],
      3,
      day(10),
    );
    expect(d.credits).toBe(3);
    expect(d.stats).toMatchObject({ simulations: 2, questionsAnswered: 2, streakDays: 2 });
    expect(d.exams[0]).toMatchObject({ simulations: 2, average: 50, best: 60, last: 60 });
    expect(d.weakTopics[0]).toMatchObject({ topicId: "t1", correct: 2, total: 6 });
    expect(d.recent[0].startedAt).toEqual(day(10));
  });
});
