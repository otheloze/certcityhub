// Pure dashboard maths, kept free of Prisma so it is unit-testable. All
// figures are descriptive summaries of the user's own attempts; the readiness
// number is an estimate (mean of recent simulations), never a prediction.

export const MIN_TOPIC_SAMPLE = 3;
export const READINESS_WINDOW = 5;
const WEAK_BELOW = 70;
const STRONG_AT_OR_ABOVE = 75;
const TOP_N = 5;

export interface DashScore {
  percentage: number;
  rawScore: number;
  maxScore: number;
  breakdown: {
    questions?: { answered: boolean }[];
    topics?: { topicId: string; title: string; correct: number; total: number }[];
  };
}

export interface DashAttempt {
  id: string;
  mode: "SIMULATION" | "PRACTICE";
  status: "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";
  startedAt: Date;
  examVersionId: string;
  exam: { id: string; slug: string; title: string; shortCode: string | null; category: string };
  score: DashScore | null;
}

export interface TopicStat {
  topicId: string;
  title: string;
  examTitle: string;
  examSlug: string;
  examVersionId: string;
  correct: number;
  total: number;
  accuracy: number;
}

const dayKey = (d: Date) => Math.floor(d.getTime() / 86_400_000);

export function computeStreak(dates: Date[], now: Date): number {
  const days = new Set(dates.map(dayKey));
  const today = dayKey(now);
  let cursor = days.has(today) ? today : days.has(today - 1) ? today - 1 : null;
  if (cursor === null) return 0;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

export function estimateReadiness(attempts: DashAttempt[]): { percentage: number; basedOn: number } | null {
  const recent = attempts
    .filter((a) => a.mode === "SIMULATION" && a.score)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .slice(0, READINESS_WINDOW);
  if (recent.length === 0) return null;
  const mean = recent.reduce((sum, a) => sum + a.score!.percentage, 0) / recent.length;
  return { percentage: Math.round(mean), basedOn: recent.length };
}

export function aggregateTopics(attempts: DashAttempt[]): TopicStat[] {
  const merged = new Map<string, TopicStat>();
  for (const a of attempts) {
    for (const t of a.score?.breakdown.topics ?? []) {
      const key = `${a.examVersionId}:${t.topicId}`;
      const existing = merged.get(key) ?? {
        topicId: t.topicId,
        title: t.title,
        examTitle: a.exam.title,
        examSlug: a.exam.slug,
        examVersionId: a.examVersionId,
        correct: 0,
        total: 0,
        accuracy: 0,
      };
      existing.correct += t.correct;
      existing.total += t.total;
      merged.set(key, existing);
    }
  }
  return [...merged.values()].map((s) => ({ ...s, accuracy: s.total === 0 ? 0 : (s.correct / s.total) * 100 }));
}

export function splitTopics(stats: TopicStat[]) {
  const sampled = stats.filter((s) => s.total >= MIN_TOPIC_SAMPLE);
  return {
    weakTopics: sampled
      .filter((s) => s.accuracy < WEAK_BELOW)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, TOP_N),
    strongTopics: sampled
      .filter((s) => s.accuracy >= STRONG_AT_OR_ABOVE)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, TOP_N),
  };
}

export function summariseExams(attempts: DashAttempt[]) {
  const byExam = new Map<string, { exam: DashAttempt["exam"]; sims: DashAttempt[]; practice: number }>();
  for (const a of attempts) {
    const entry = byExam.get(a.exam.id) ?? { exam: a.exam, sims: [], practice: 0 };
    if (a.mode === "PRACTICE") entry.practice += 1;
    else if (a.score) entry.sims.push(a);
    byExam.set(a.exam.id, entry);
  }
  return [...byExam.values()].map(({ exam, sims, practice }) => {
    const ordered = [...sims].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    const pct = ordered.map((s) => s.score!.percentage);
    return {
      examId: exam.id,
      slug: exam.slug,
      title: exam.title,
      shortCode: exam.shortCode,
      category: exam.category,
      simulations: sims.length,
      practiceSessions: practice,
      average: pct.length ? pct.reduce((a, b) => a + b, 0) / pct.length : null,
      best: pct.length ? Math.max(...pct) : null,
      last: pct.length ? pct[0] : null,
    };
  });
}

export interface Recommendation {
  kind: "START" | "PRACTICE_TOPIC" | "TAKE_SIMULATION" | "KEEP_GOING";
  title: string;
  detail: string;
  examSlug?: string;
  examVersionId?: string;
  topicId?: string;
}

export function pickRecommendation(attempts: DashAttempt[], weakTopics: TopicStat[]): Recommendation {
  if (attempts.length === 0) {
    return {
      kind: "START",
      title: "Pick your first exam",
      detail: "Browse the catalogue, try a free practice session, and see where you stand.",
    };
  }
  const weakest = weakTopics[0];
  if (weakest) {
    return {
      kind: "PRACTICE_TOPIC",
      title: `Practise ${weakest.title}`,
      detail: `You got ${weakest.correct} of ${weakest.total} correct in this ${weakest.examTitle} topic, your weakest so far. A short practice session is free.`,
      examSlug: weakest.examSlug,
      examVersionId: weakest.examVersionId,
      topicId: weakest.topicId,
    };
  }
  const latest = [...attempts].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
  const hasSimulation = attempts.some((a) => a.mode === "SIMULATION" && a.score);
  if (!hasSimulation) {
    return {
      kind: "TAKE_SIMULATION",
      title: `Try a timed ${latest.exam.title} simulation`,
      detail: "A full simulation uses one attempt credit and gives you a readiness estimate and a topic breakdown.",
      examSlug: latest.exam.slug,
    };
  }
  return {
    kind: "KEEP_GOING",
    title: `Keep going with ${latest.exam.title}`,
    detail: "No clear weak spots yet. Another simulation will sharpen your estimate.",
    examSlug: latest.exam.slug,
  };
}

export function buildDashboard(attempts: DashAttempt[], credits: number, now: Date, creditsUnlimited = false) {
  const scored = attempts.filter((a) => a.score);
  const topicStats = aggregateTopics(scored);
  const { weakTopics, strongTopics } = splitTopics(topicStats);
  const questionsAnswered = scored.reduce(
    (sum, a) => sum + (a.score!.breakdown.questions ?? []).filter((q) => q.answered).length,
    0,
  );
  const recent = [...attempts]
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      mode: a.mode,
      status: a.status,
      startedAt: a.startedAt,
      examTitle: a.exam.title,
      examSlug: a.exam.slug,
      percentage: a.score?.percentage ?? null,
      rawScore: a.score?.rawScore ?? null,
      maxScore: a.score?.maxScore ?? null,
    }));

  return {
    credits,
    creditsUnlimited,
    stats: {
      simulations: scored.filter((a) => a.mode === "SIMULATION").length,
      practiceSessions: scored.filter((a) => a.mode === "PRACTICE").length,
      questionsAnswered,
      streakDays: computeStreak(
        attempts.map((a) => a.startedAt),
        now,
      ),
    },
    readiness: estimateReadiness(attempts),
    recommendation: pickRecommendation(attempts, weakTopics),
    weakTopics,
    strongTopics,
    exams: summariseExams(attempts),
    recent,
  };
}
