"use client";

export default function ExamError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
      <div className="card empty">
        <strong style={{ color: "var(--text)" }}>Something went wrong loading this exam.</strong>
        <p style={{ margin: "0.4rem 0 0" }}>Please try again in a moment.</p>
        <button type="button" className="btn btn-secondary" style={{ marginTop: "0.75rem" }} onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
