import { WeakTopic } from "../tutors/tutor-matching.util";

// A single attempt has far fewer questions per topic than the dashboard's
// cross-attempt-history stat, so these thresholds are deliberately
// different (and stricter on accuracy) from dashboard.util.ts's
// MIN_TOPIC_SAMPLE/WEAK_BELOW - see the plan for the full rationale.
export const ATTEMPT_WEAK_MIN_ANSWERED = 2;
export const ATTEMPT_WEAK_BELOW = 60;
export const ATTEMPT_WEAK_TOP_N = 3;

export interface AttemptTopicBreakdown {
  topicId: string;
  title: string;
  correct: number;
  total: number;
  accuracy: number;
}

export function deriveAttemptWeakTopics(
  topics: AttemptTopicBreakdown[],
  exam: { slug: string; title: string },
): WeakTopic[] {
  return topics
    .filter((t) => t.total >= ATTEMPT_WEAK_MIN_ANSWERED && t.accuracy < ATTEMPT_WEAK_BELOW)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, ATTEMPT_WEAK_TOP_N)
    .map((t) => ({ topicId: t.topicId, title: t.title, examSlug: exam.slug, examTitle: exam.title }));
}
