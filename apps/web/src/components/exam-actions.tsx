"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, Wallet, fetchWallet, startAttempt } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";

export interface TopicOption {
  id: string;
  title: string;
  depth: number;
}

export function ExamActions({
  examId,
  examVersionId,
  topics,
}: {
  examId: string;
  examVersionId: string;
  topics: TopicOption[];
}) {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [busy, setBusy] = useState<"simulation" | "practice" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [topicId, setTopicId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("");
  const [needsAccessCode, setNeedsAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState("");

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    fetchWallet(token, examId)
      .then((w) => !cancelled && setWallet(w))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [ready, token, examId]);

  async function begin(kind: "simulation" | "practice") {
    if (!token) {
      router.push("/login");
      return;
    }
    setError(null);
    setBusy(kind);
    try {
      const attempt = await startAttempt(
        token,
        examVersionId,
        kind === "practice"
          ? {
              mode: "PRACTICE",
              topicId: topicId || undefined,
              questionCount,
              difficulty: difficulty ? Number(difficulty) : undefined,
            }
          : { mode: "SIMULATION", accessCode: accessCode || undefined },
      );
      router.push(`/attempts/${attempt.id}`);
    } catch (err) {
      setBusy(null);
      if (err instanceof ApiError && err.status === 402 && err.code === "ORG_ACCESS_CODE_REQUIRED") {
        setNeedsAccessCode(true);
        setError(needsAccessCode ? "That code was not accepted. Check it and try again." : null);
      } else if (err instanceof ApiError && err.status === 402) {
        setError("You have no attempts left for this exam. Get more attempts in your wallet. Practice is always free.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError("No questions match those practice settings. Try a different topic or difficulty.");
      } else if (err instanceof ApiError && err.status === 0) {
        setError("Could not reach the server. Please try again in a moment.");
      } else {
        setError("Could not start. Please try again.");
      }
    }
  }

  const eligible = wallet?.eligible;
  let creditLine: string;
  let creditTone: "good" | "warn" | "neutral" = "neutral";
  if (!token) {
    creditLine = "Log in to start. New accounts include free-plan attempts.";
  } else if (!eligible) {
    creditLine = "Checking your attempts…";
  } else if (eligible.fullExam > 0) {
    creditLine = `${eligible.fullExam} full-exam attempt${eligible.fullExam === 1 ? "" : "s"} available`;
    creditTone = "good";
  } else if (eligible.limited > 0) {
    creditLine = `${eligible.limited} free-plan attempt${eligible.limited === 1 ? "" : "s"}: a shortened exam using a quarter of the questions`;
    creditTone = "warn";
  } else {
    creditLine = "No attempts left for this exam";
    creditTone = "warn";
  }

  return (
    <>
      <div className="card">
        <div className="card-title">
          <h2>Exam simulation</h2>
          <span className={"badge" + (creditTone === "good" ? " badge-good" : creditTone === "warn" ? " badge-warn" : "")}>{creditLine}</span>
        </div>
        <p>
          A timed, full-length exam with no hints and no feedback until you finish. Uses one attempt.{" "}
          {token ? <Link href="/wallet">Get more attempts</Link> : null}
        </p>
        {needsAccessCode ? (
          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            One-time organization exam code
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="e.g. K7X9-MQ3P"
              autoCapitalize="characters"
            />
            <span className="field-note">Issued by your organization for this exam. It can only be used once.</span>
          </label>
        ) : null}
        <button type="button" className="btn btn-primary btn-lg" onClick={() => begin("simulation")} disabled={busy !== null}>
          {busy === "simulation"
            ? "Starting…"
            : needsAccessCode
              ? "Submit code and start"
              : token
                ? "Start exam simulation"
                : "Log in to start"}
        </button>
      </div>

      <div className="card">
        <div className="card-title">
          <h2>Practice</h2>
          <span className="badge badge-good">Free &amp; unlimited</span>
        </div>
        <p>Choose what to work on and get instant feedback with an explanation after each answer.</p>
        <div className="practice-form">
          <label>
            Topic
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {"  ".repeat(t.depth)}
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Questions
            <input
              type="number"
              min={1}
              max={50}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            />
          </label>
          <label>
            Difficulty
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => begin("practice")} disabled={busy !== null}>
          {busy === "practice" ? "Starting…" : "Start practice"}
        </button>
      </div>

      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
