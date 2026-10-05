"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { AccuracyBars } from "../../components/accuracy-bars";
import { ScoreRing } from "../../components/score-ring";
import { API_ORIGIN, Dashboard, fetchDashboard, startAttempt } from "../../lib/api-client";
import { ExamMonogram } from "../../components/exam-card";

function when(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, ready } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    fetchDashboard(token)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError("Could not load your dashboard. Please refresh in a moment."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, ready, router]);

  async function practise(examVersionId: string, topicId: string) {
    if (!token) return;
    setStarting(topicId);
    try {
      const attempt = await startAttempt(token, examVersionId, { mode: "PRACTICE", topicId, questionCount: 10 });
      router.push(`/attempts/${attempt.id}`);
    } catch {
      setStarting(null);
      setError("Could not start a practice session for that topic.");
    }
  }

  if (loading) {
    return (
      <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
        <p role="alert">{error ?? "Dashboard not available."}</p>
      </div>
    );
  }

  const rec = data.recommendation;
  const recHref =
    rec.kind === "START" || rec.kind === "TAKE_SIMULATION" || rec.kind === "KEEP_GOING"
      ? rec.examSlug
        ? `/exams/${rec.examSlug}`
        : "/exams"
      : null;
  const name = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
      <div className="section-head">
        <span className="eyebrow">Dashboard</span>
        <h1>Welcome back, {name}</h1>
      </div>
      {error ? <p role="alert">{error}</p> : null}

      <div className="dash-hero" style={{ marginBottom: "1rem" }}>
        <div className="card next-step">
          <span className="eyebrow" style={{ color: "#fff", opacity: 0.85 }}>
            Recommended next step
          </span>
          <h2 style={{ margin: "0.4rem 0" }}>{rec.title}</h2>
          <p>{rec.detail}</p>
          <div className="row" style={{ marginTop: "1rem" }}>
            {rec.kind === "PRACTICE_TOPIC" && rec.examVersionId && rec.topicId ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={starting !== null}
                onClick={() => practise(rec.examVersionId!, rec.topicId!)}
              >
                {starting === rec.topicId ? "Starting…" : "Start practice"}
              </button>
            ) : (
              <Link href={recHref ?? "/exams"} className="btn btn-primary">
                {rec.kind === "START" ? "Browse exams" : "Open exam"}
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <div className="row" style={{ gap: "1.25rem", alignItems: "center" }}>
            {data.readiness ? (
              <ScoreRing percentage={data.readiness.percentage} label="readiness" />
            ) : (
              <div className="empty" style={{ padding: "1rem" }}>
                No readiness estimate yet
              </div>
            )}
            <div style={{ flex: 1, minWidth: 160 }}>
              <h3 style={{ marginBottom: "0.3rem" }}>Readiness estimate</h3>
              <p className="field-note" style={{ margin: 0 }}>
                {data.readiness
                  ? `Average of your last ${data.readiness.basedOn} simulation${data.readiness.basedOn === 1 ? "" : "s"}. This is an estimate, not a prediction of your real exam result.`
                  : "Complete a timed simulation and we will show an estimate based on your recent results."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-strip" style={{ marginBottom: "1.5rem" }}>
        <div className="stat">
          <div className="stat-value">{data.creditsUnlimited ? "∞" : data.credits}</div>
          <div className="stat-label">
            {data.creditsUnlimited ? "Unlimited attempts" : "Attempts remaining"} · <Link href="/wallet">wallet</Link>
          </div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.stats.simulations}</div>
          <div className="stat-label">Simulations</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.stats.questionsAnswered}</div>
          <div className="stat-label">Questions answered</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.stats.streakDays}</div>
          <div className="stat-label">Day streak</div>
        </div>
      </div>

      <div className="grid" style={{ marginBottom: "1rem", alignItems: "start" }}>
        <div className="card">
          <div className="card-title">
            <h2>Topics to work on</h2>
          </div>
          {data.weakTopics.length === 0 ? (
            <div className="empty">Answer a few more questions and your weakest topics will appear here.</div>
          ) : (
            <AccuracyBars
              rows={data.weakTopics.map((t) => ({
                id: t.topicId + t.examVersionId,
                label: t.title,
                sub: t.examTitle,
                value: t.accuracy,
                correct: t.correct,
                total: t.total,
                action: (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={starting !== null}
                    onClick={() => practise(t.examVersionId, t.topicId)}
                  >
                    {starting === t.topicId ? "…" : "Practise"}
                  </button>
                ),
              }))}
            />
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <h2>Your strengths</h2>
          </div>
          {data.strongTopics.length === 0 ? (
            <div className="empty">Strong topics show up once you have answered at least three questions in them.</div>
          ) : (
            <AccuracyBars
              rows={data.strongTopics.map((t) => ({
                id: t.topicId + t.examVersionId,
                label: t.title,
                sub: t.examTitle,
                value: t.accuracy,
                correct: t.correct,
                total: t.total,
              }))}
            />
          )}
        </div>
      </div>

      {data.tutorSuggestions.length > 0 ? (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="card-title">
            <h2>Recommended tutors</h2>
          </div>
          <p className="field-note" style={{ marginTop: 0 }}>
            Matched to your weakest topics. Contact them directly — booking isn't handled here.
          </p>
          <div className="grid grid-3">
            {data.tutorSuggestions.map((t) => (
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

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="card-title">
          <h2>Your exams</h2>
        </div>
        {data.exams.length === 0 ? (
          <div className="empty">
            You have not started any exams yet. <Link href="/exams">Browse the catalogue</Link>.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Simulations</th>
                  <th>Practice</th>
                  <th>Average</th>
                  <th>Best</th>
                  <th>Latest</th>
                </tr>
              </thead>
              <tbody>
                {data.exams.map((e) => (
                  <tr key={e.examId}>
                    <td>
                      <Link href={`/exams/${e.slug}`} className="row" style={{ gap: "0.6rem", flexWrap: "nowrap" }}>
                        <ExamMonogram exam={e} />
                        <span>{e.title}</span>
                      </Link>
                    </td>
                    <td>{e.simulations}</td>
                    <td>{e.practiceSessions}</td>
                    <td>{e.average === null ? "–" : `${e.average.toFixed(0)}%`}</td>
                    <td>{e.best === null ? "–" : `${e.best.toFixed(0)}%`}</td>
                    <td>{e.last === null ? "–" : `${e.last.toFixed(0)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <h2>Recent activity</h2>
        </div>
        {data.recent.length === 0 ? (
          <div className="empty">No attempts yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Exam</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.recent.map((a) => (
                  <tr key={a.id}>
                    <td>{when(a.startedAt)}</td>
                    <td>{a.examTitle}</td>
                    <td>
                      <span className="badge">{a.mode === "SIMULATION" ? "Simulation" : "Practice"}</span>
                    </td>
                    <td>{a.status === "IN_PROGRESS" ? "In progress" : a.percentage === null ? "–" : `${a.percentage.toFixed(0)}%`}</td>
                    <td>
                      <Link href={a.status === "IN_PROGRESS" ? `/attempts/${a.id}` : `/attempts/${a.id}/result`}>
                        {a.status === "IN_PROGRESS" ? "Resume" : "View result"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
