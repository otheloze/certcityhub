"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { AccuracyBars } from "../../../../components/accuracy-bars";
import { ScoreRing } from "../../../../components/score-ring";
import {
  API_ORIGIN,
  Attempt,
  AttemptResult,
  ExamVersionSummary,
  fetchAttempt,
  fetchAttemptResult,
  fetchExamVersion,
  startAttempt,
} from "../../../../lib/api-client";

function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

function verdict(pct: number) {
  if (pct >= 75) return { text: "✓ Strong result", cls: "badge-good", advice: "You're performing well. Keep it sharp with a full simulation." };
  if (pct >= 50) return { text: "◐ Getting there", cls: "badge-warn", advice: "Solid foundations. Target your weakest topics below to move up." };
  return { text: "⚠ Needs work", cls: "badge-bad", advice: "Focus on the topics below with practice sessions, then try again." };
}

export default function AttemptResultPage({ params }: { params: { id: string } }) {
  const attemptId = params.id;
  const router = useRouter();
  const { token, ready } = useAuth();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [version, setVersion] = useState<ExamVersionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingTopic, setStartingTopic] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const fetchedAttempt = await fetchAttempt(token!, attemptId);
        if (fetchedAttempt.status === "IN_PROGRESS") {
          router.push(`/attempts/${attemptId}`);
          return;
        }
        const [fetchedResult, fetchedVersion] = await Promise.all([
          fetchAttemptResult(token!, attemptId),
          fetchExamVersion(fetchedAttempt.examVersionId).catch(() => null),
        ]);
        if (cancelled) return;
        setAttempt(fetchedAttempt);
        setResult(fetchedResult);
        setVersion(fetchedVersion);
      } catch {
        if (!cancelled) setError("Could not load this result.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, token, ready]);

  async function practiceTopic(topicId: string) {
    if (!token || !attempt) return;
    setStartingTopic(topicId);
    try {
      const practice = await startAttempt(token, attempt.examVersionId, {
        mode: "PRACTICE",
        topicId,
        questionCount: 10,
      });
      router.push(`/attempts/${practice.id}`);
    } catch {
      setStartingTopic(null);
      setError("Could not start a practice session for that topic.");
    }
  }

  if (loading) {
    return (
      <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
        <p>Loading your result…</p>
      </div>
    );
  }

  if (!result || !attempt) {
    return (
      <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
        <p role="alert">{error ?? "Result not available."}</p>
      </div>
    );
  }

  const questions = result.breakdown.questions;
  const correct = questions.filter((q) => q.isCorrect).length;
  const unanswered = questions.filter((q) => !q.answered).length;
  const incorrect = questions.length - correct - unanswered;
  const usedMs = attempt.submittedAt
    ? new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()
    : new Date(attempt.expiresAt).getTime() - new Date(attempt.startedAt).getTime();
  const v = verdict(result.percentage);
  const isPractice = attempt.mode === "PRACTICE";
  const weakest = [...result.breakdown.topics].sort((a, b) => a.accuracy - b.accuracy)[0];
  const examPath = version?.exam ? `/exams/${version.exam.slug}` : "/exams";

  return (
    <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
      <div className="section-head">
        <span className="eyebrow">{isPractice ? "Practice session" : "Exam simulation"}</span>
        <h1>{version?.exam?.title ?? "Your result"}</h1>
        <p>{attempt.status === "EXPIRED" ? "Time ran out, so your answers were submitted automatically." : "Submitted."}</p>
      </div>
      {error ? <p role="alert">{error}</p> : null}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="row" style={{ gap: "2rem", alignItems: "center" }}>
          <ScoreRing percentage={result.percentage} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <span className={"badge " + v.cls}>{v.text}</span>
            <h2 style={{ margin: "0.6rem 0 0.3rem" }}>
              {result.rawScore % 1 === 0 ? result.rawScore : result.rawScore.toFixed(1)} / {result.maxScore % 1 === 0 ? result.maxScore : result.maxScore.toFixed(1)} points
            </h2>
            <p>{v.advice}</p>
            <div className="stats-strip" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
              <div className="stat">
                <div className="stat-value" style={{ fontSize: "1.4rem" }}>
                  {correct}
                </div>
                <div className="stat-label">Correct</div>
              </div>
              <div className="stat">
                <div className="stat-value" style={{ fontSize: "1.4rem" }}>
                  {incorrect}
                </div>
                <div className="stat-label">Incorrect</div>
              </div>
              <div className="stat">
                <div className="stat-value" style={{ fontSize: "1.4rem" }}>
                  {unanswered}
                </div>
                <div className="stat-label">Unanswered</div>
              </div>
              <div className="stat">
                <div className="stat-value" style={{ fontSize: "1.4rem" }}>
                  {formatDuration(usedMs)}
                </div>
                <div className="stat-label">Time used</div>
              </div>
            </div>
          </div>
        </div>
        <div className="row" style={{ marginTop: "1.25rem" }}>
          <Link href={`/attempts/${attemptId}/review`} className="btn btn-primary">
            Review your answers
          </Link>
          {weakest && result.breakdown.topics.length > 1 ? (
            <button type="button" className="btn btn-secondary" disabled={startingTopic !== null} onClick={() => practiceTopic(weakest.topicId)}>
              {startingTopic === weakest.topicId ? "Starting…" : `Practise weakest: ${weakest.title}`}
            </button>
          ) : null}
          <Link href={examPath} className="btn btn-ghost">
            {isPractice ? "Back to exam" : "Start another simulation"}
          </Link>
        </div>
      </div>

      {result.breakdown.topics.length > 0 ? (
        <div className="card">
          <div className="card-title">
            <h2>Performance by topic</h2>
            <span className="badge">{result.breakdown.topics.length} topics</span>
          </div>
          <AccuracyBars
            rows={[...result.breakdown.topics]
              .sort((a, b) => a.accuracy - b.accuracy)
              .map((t) => ({
                id: t.topicId,
                label: t.title,
                value: t.accuracy,
                correct: t.correct,
                total: t.total,
                action: (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={startingTopic !== null}
                    onClick={() => practiceTopic(t.topicId)}
                  >
                    {startingTopic === t.topicId ? "…" : "Practise"}
                  </button>
                ),
              }))}
          />
          <p className="field-note" style={{ marginBottom: 0 }}>
            Sorted weakest first. Small samples can be misleading, so treat topics with only a few questions as a guide, not a verdict.
          </p>
        </div>
      ) : null}

      {result.tutorSuggestions.length > 0 ? (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="card-title">
            <h2>Recommended tutors</h2>
          </div>
          <p className="field-note" style={{ marginTop: 0 }}>
            Matched to this attempt's weakest topics. Contact them directly — booking isn't handled here.
          </p>
          <div className="grid grid-3">
            {result.tutorSuggestions.map((t) => (
              <Link key={t.tutorId} href={`/tutors/${t.tutorId}`} className="exam-card">
                <div className="exam-card-head">
                  {t.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${API_ORIGIN}${t.photoUrl}`}
                      alt={t.displayName}
                      style={{ height: 48, width: 48, objectFit: "cover", borderRadius: "50%" }}
                    />
                  ) : (
                    <span className="mono">{t.displayName.charAt(0).toUpperCase()}</span>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <h3>{t.displayName}</h3>
                    {t.headline ? <div className="provider">{t.headline}</div> : null}
                  </div>
                </div>
                <p>
                  For {t.matchedTopic.title} ({t.matchedTopic.examTitle})
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
