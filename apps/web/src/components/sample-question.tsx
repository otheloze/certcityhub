"use client";

import Link from "next/link";
import { useState } from "react";

// A tiny, static taste of Learn mode on the landing page. No account or API
// needed - it exists so a visitor can feel the product in five seconds.
const OPTIONS = [
  { key: "A", text: "Amazon EC2" },
  { key: "B", text: "Amazon S3" },
  { key: "C", text: "Amazon RDS" },
  { key: "D", text: "AWS Lambda" },
];
const CORRECT = "B";

export function SampleQuestion() {
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked !== null;

  return (
    <div className="sample-card" aria-live="polite">
      <div className="sample-head">
        <span>Try a practice question</span>
        <span className="badge badge-primary">Learn mode</span>
      </div>
      <p className="sample-q">Which AWS service provides object storage?</p>
      <div className="option-list" style={{ marginBottom: "0.9rem" }}>
        {OPTIONS.map((o) => {
          const isPicked = picked === o.key;
          const showCorrect = answered && o.key === CORRECT;
          return (
            <button
              key={o.key}
              type="button"
              className={"option" + (isPicked ? " selected" : "")}
              onClick={() => !answered && setPicked(o.key)}
              disabled={answered && !isPicked && !showCorrect}
              style={{
                textAlign: "left",
                borderColor: showCorrect ? "var(--good-mark)" : isPicked && o.key !== CORRECT ? "var(--bad-mark)" : undefined,
                background: showCorrect ? "var(--good-bg)" : isPicked && o.key !== CORRECT ? "var(--bad-bg)" : undefined,
                opacity: answered && !isPicked && !showCorrect ? 0.55 : 1,
              }}
            >
              <span className="option-key">{o.key}</span>
              <span style={{ flex: 1, color: "var(--text)" }}>{o.text}</span>
              {showCorrect ? <span aria-label="Correct answer">✓</span> : isPicked ? <span aria-label="Incorrect">✕</span> : null}
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className={"feedback " + (picked === CORRECT ? "feedback-correct" : "feedback-wrong")}>
          <strong>{picked === CORRECT ? "Correct — Amazon S3" : "Not quite — the answer is Amazon S3"}</strong>
          <p>S3 stores data as objects in buckets, which makes it the go-to service for object storage. EC2 is compute, RDS is relational databases and Lambda runs code.</p>
          <div className="row" style={{ marginTop: "0.6rem" }}>
            <Link href="/exams" className="btn btn-primary btn-sm">
              Practice free
            </Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicked(null)}>
              Reset
            </button>
          </div>
        </div>
      ) : (
        <p className="kbd-hint" style={{ margin: 0 }}>
          Pick an answer to see instant feedback and an explanation.
        </p>
      )}
    </div>
  );
}
