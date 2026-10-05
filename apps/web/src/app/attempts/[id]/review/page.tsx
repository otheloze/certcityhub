"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StemBlocks } from "../../../../components/stem-blocks";
import { useAuth } from "../../../../lib/auth-context";
import { AttemptReview, ReviewQuestion, fetchAttemptReview } from "../../../../lib/api-client";

function text(blocks: { type: string; text?: string }[] | undefined) {
  return (blocks ?? []).map((b, i) => (b.type === "text" ? <span key={i}>{b.text} </span> : null));
}

function describeAnswer(q: ReviewQuestion): string {
  const a = q.answer;
  if (!a) return "No answer";
  if (Array.isArray(a.optionLabels)) return (a.optionLabels as string[]).join(", ") || "No answer";
  if (typeof a.optionLabel === "string") return a.optionLabel;
  if (typeof a.value === "number") return String(a.value);
  if (typeof a.text === "string") return a.text;
  return "No answer";
}

function describeCorrect(q: ReviewQuestion): string {
  const c = q.feedback.correct;
  if (c.optionLabels) return c.optionLabels.join(", ");
  if (c.value !== undefined) return `${c.value}${c.tolerance ? ` (±${c.tolerance})` : ""}`;
  if (c.acceptedAnswers) return c.acceptedAnswers.join(", ");
  return "";
}

type Filter = "all" | "wrong" | "flagged";

export default function ReviewPage({ params }: { params: { id: string } }) {
  const attemptId = params.id;
  const router = useRouter();
  const { token, ready } = useAuth();
  const [review, setReview] = useState<AttemptReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    fetchAttemptReview(token, attemptId)
      .then((data) => !cancelled && setReview(data))
      .catch(() => !cancelled && setError("Could not load the review. Has the attempt been submitted?"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [attemptId, token, ready, router]);

  if (loading) {
    return (
      <div className="container-narrow section-tight" style={{ paddingTop: "2.5rem" }}>
        <p>Loading review…</p>
      </div>
    );
  }
  if (!review) {
    return (
      <div className="container-narrow section-tight" style={{ paddingTop: "2.5rem" }}>
        <p role="alert">{error ?? "Review not available."}</p>
      </div>
    );
  }

  const statusOf = (q: ReviewQuestion) => (q.feedback.isCorrect ? "correct" : q.answer != null ? "wrong" : "skipped");
  const wrongCount = review.questions.filter((q) => statusOf(q) !== "correct").length;
  const flaggedCount = review.questions.filter((q) => q.markedForReview).length;
  const shown = review.questions.filter((q) =>
    filter === "all" ? true : filter === "wrong" ? statusOf(q) !== "correct" : q.markedForReview,
  );

  return (
    <div className="container-narrow section-tight" style={{ paddingTop: "2.5rem" }}>
      <Link href={`/attempts/${attemptId}/result`} className="back-link">
        ← Back to result
      </Link>
      <h1>Review your answers</h1>
      <p>
        {review.score.rawScore.toFixed(1)} / {review.score.maxScore.toFixed(1)} points ({review.score.percentage.toFixed(1)}%)
      </p>

      <div className="chip-row" style={{ margin: "1rem 0 1.25rem" }}>
        <button type="button" className={"chip" + (filter === "all" ? " chip-active" : "")} onClick={() => setFilter("all")}>
          All ({review.questions.length})
        </button>
        <button type="button" className={"chip" + (filter === "wrong" ? " chip-active" : "")} onClick={() => setFilter("wrong")}>
          Incorrect or skipped ({wrongCount})
        </button>
        <button type="button" className={"chip" + (filter === "flagged" ? " chip-active" : "")} onClick={() => setFilter("flagged")}>
          Flagged ({flaggedCount})
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="card empty">Nothing to show for this filter.</div>
      ) : null}

      {shown.map((q) => {
        const status = statusOf(q);
        return (
          <section key={q.id} className={"question-card review-" + status}>
            <p className="review-heading">
              <strong>Question {q.order + 1}</strong>
              <span className={"mode-badge " + (status === "correct" ? "ok-badge" : "bad-badge")}>
                {status === "correct" ? "✓ Correct" : status === "wrong" ? "✕ Incorrect" : "– Not answered"}
              </span>
              {q.markedForReview ? <span className="mode-badge weak-badge">⚑ Flagged</span> : null}
            </p>
            <div className="q-stem" style={{ marginBottom: "0.8rem" }}>
              <StemBlocks blocks={q.stem.blocks} />
            </div>
            {q.options.length > 0 ? (
              <ul className="review-options" style={{ marginBottom: "0.8rem" }}>
                {q.options.map((o) => (
                  <li key={o.label}>
                    <strong>{o.label}.</strong> {text(o.content.blocks)}
                  </li>
                ))}
              </ul>
            ) : null}
            <p style={{ marginBottom: "0.3rem" }}>
              <strong style={{ color: "var(--text)" }}>Your answer:</strong> {describeAnswer(q)}
            </p>
            {!q.feedback.isCorrect ? (
              <p style={{ marginBottom: "0.6rem" }}>
                <strong style={{ color: "var(--text)" }}>Correct answer:</strong> {describeCorrect(q)}
              </p>
            ) : null}
            {q.feedback.explanation ? <p className="review-explanation">{text(q.feedback.explanation.blocks)}</p> : null}
          </section>
        );
      })}
    </div>
  );
}
