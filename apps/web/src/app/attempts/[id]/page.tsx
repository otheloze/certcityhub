"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { StemBlocks } from "../../../components/stem-blocks";
import { ConfirmModal } from "../../../components/confirm-modal";
import {
  AnswerFeedback,
  Attempt,
  AttemptQuestionView,
  ExamVersionConfig,
  checkAttemptAnswer,
  fetchAttempt,
  fetchAttemptQuestions,
  fetchExamVersion,
  saveAttemptAnswer,
  setAttemptReviewFlag,
  submitAttempt,
} from "../../../lib/api-client";

const LOW_TIME_SECONDS = 300;

function formatRemaining(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export default function AttemptPage({ params }: { params: { id: string } }) {
  const attemptId = params.id;
  const router = useRouter();
  const { token, ready } = useAuth();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [config, setConfig] = useState<ExamVersionConfig | null>(null);
  const [examTitle, setExamTitle] = useState("Exam");
  const [questions, setQuestions] = useState<AttemptQuestionView[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [checking, setChecking] = useState(false);

  const submit = useCallback(async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    try {
      await submitAttempt(token, attemptId);
    } finally {
      router.push(`/attempts/${attemptId}/result`);
    }
  }, [token, attemptId, submitting, router]);

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
        if (fetchedAttempt.status !== "IN_PROGRESS") {
          router.push(`/attempts/${attemptId}/result`);
          return;
        }
        const [fetchedVersion, fetchedQuestions] = await Promise.all([
          fetchExamVersion(fetchedAttempt.examVersionId),
          fetchAttemptQuestions(token!, attemptId),
        ]);
        if (cancelled) return;
        setAttempt(fetchedAttempt);
        setConfig(fetchedVersion.config);
        if (fetchedVersion.exam?.title) setExamTitle(fetchedVersion.exam.title);
        setQuestions(fetchedQuestions);
        setRemainingSeconds((new Date(fetchedAttempt.expiresAt).getTime() - Date.now()) / 1000);
      } catch {
        if (!cancelled) setError("Could not load this exam attempt.");
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

  useEffect(() => {
    if (remainingSeconds === null) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          submit();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds !== null]);

  const current = questions[currentIndex];
  // Practice is for learning: navigation and answer changes are never restricted.
  const isPractice = attempt?.mode === "PRACTICE";
  const allowBack = isPractice || (config?.navigation.allowBackNavigation ?? true);
  const allowChanges = isPractice || (config?.navigation.allowAnswerChanges ?? true);
  const allowReview = config?.navigation.allowMarkForReview ?? true;
  const isLocked = !allowChanges && current?.answer != null;

  const answeredCount = questions.filter((q) => q.answer != null).length;
  const flaggedCount = questions.filter((q) => q.markedForReview).length;
  const unansweredCount = questions.length - answeredCount;

  // Optimistic: show the selection immediately, then persist in the background
  // and roll back only if the server rejects it.
  async function saveResponse(responseData: Record<string, unknown>) {
    if (!token || !current) return;
    const questionId = current.id;
    const previousAnswer = current.answer;
    setError(null);
    setFeedback((prev) => {
      const { [questionId]: _stale, ...rest } = prev;
      return rest;
    });
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, answer: responseData } : q)));
    try {
      await saveAttemptAnswer(token, attemptId, current.questionId, responseData);
    } catch {
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, answer: previousAnswer } : q)));
      setError("Could not save your answer. Check your connection and try again.");
    }
  }

  async function checkCurrent() {
    if (!token || !current) return;
    setChecking(true);
    setError(null);
    try {
      const result = await checkAttemptAnswer(token, attemptId, current.questionId);
      setFeedback((prev) => ({ ...prev, [current.id]: result }));
    } catch {
      setError("Could not check your answer. Make sure you have answered, then try again.");
    } finally {
      setChecking(false);
    }
  }

  async function toggleReview() {
    if (!token || !current || !allowReview) return;
    const questionId = current.id;
    const previous = current.markedForReview;
    const marked = !previous;
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, markedForReview: marked } : q)));
    try {
      await setAttemptReviewFlag(token, attemptId, current.questionId, marked);
    } catch {
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, markedForReview: previous } : q)));
      setError("Could not update the review flag.");
    }
  }

  function goTo(index: number) {
    if (index < 0 || index >= questions.length) return;
    if (!allowBack && index < currentIndex) return;
    setCurrentIndex(index);
  }

  // Keyboard shortcuts read the latest state through a ref, so the single
  // listener never sees stale closures.
  const keys = useRef<(e: KeyboardEvent) => void>(() => undefined);
  keys.current = (e: KeyboardEvent) => {
    const target = e.target as HTMLInputElement | null;
    const typing =
      target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && target.type !== "radio" && target.type !== "checkbox";
    if (typing || confirming || e.metaKey || e.ctrlKey || e.altKey || !current) return;
    const key = e.key.toLowerCase();
    if (key === "arrowright" || key === "n") return goTo(currentIndex + 1);
    if (key === "arrowleft" || key === "p") return goTo(currentIndex - 1);
    if (key === "m") return void toggleReview();
    const options = current.options ?? [];
    if (options.length === 0 || isLocked) return;
    const index = /^[1-9]$/.test(key) ? Number(key) - 1 : key.length === 1 && key >= "a" && key <= "h" ? key.charCodeAt(0) - 97 : -1;
    const option = options[index];
    if (!option) return;
    if (current.type === "MULTIPLE_CHOICE") {
      const selected = ((current.answer?.optionLabels as string[]) ?? []) as string[];
      saveResponse({
        optionLabels: selected.includes(option.label) ? selected.filter((l) => l !== option.label) : [...selected, option.label],
      });
    } else {
      saveResponse({ optionLabel: option.label });
    }
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (loading) {
    return (
      <div className="exam-shell">
        <div className="container" style={{ paddingTop: "4rem" }}>
          <p>Loading your exam…</p>
        </div>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="exam-shell">
        <div className="container-narrow" style={{ paddingTop: "4rem" }}>
          <p role="alert">{error}</p>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="exam-shell">
        <div className="container-narrow" style={{ paddingTop: "4rem" }}>
          <p role="alert">This exam has no questions.</p>
        </div>
      </div>
    );
  }

  const low = remainingSeconds !== null && remainingSeconds <= LOW_TIME_SECONDS;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="exam-shell">
      <header className="exam-topbar">
        <div className="container exam-topbar-inner">
          <span className="exam-title">
            {examTitle}
            <span className="mode-badge">{isPractice ? "Practice" : "Simulation"}</span>
          </span>
          <div className="exam-progress" aria-label={`${answeredCount} of ${questions.length} answered`}>
            <div className="progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <small>
              {answeredCount} / {questions.length} answered
            </small>
          </div>
          <span className={"exam-timer" + (low ? " low" : "")} role="timer" aria-label="Time remaining">
            <span aria-hidden="true">⏱</span> {remainingSeconds !== null ? formatRemaining(remainingSeconds) : "--:--"}
          </span>
        </div>
      </header>

      <div className="exam-layout">
        <div>
          {error ? <p role="alert">{error}</p> : null}

          <section className="question-card" aria-labelledby="q-heading">
            <div className="q-meta">
              <span id="q-heading">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {allowReview ? (
                <label className="flag-toggle">
                  <input type="checkbox" checked={current.markedForReview} onChange={toggleReview} />
                  Flag for review
                </label>
              ) : null}
            </div>

            <div className="q-stem">
              <StemBlocks blocks={current.stem.blocks} />
            </div>

            <QuestionInput key={current.id} question={current} disabled={isLocked} onAnswer={saveResponse} />

            {isLocked ? <p className="kbd-hint">Your answer is locked for this exam.</p> : null}

            {isPractice ? (
              <div className="practice-check">
                <button type="button" className="btn btn-secondary" onClick={checkCurrent} disabled={checking || current.answer == null}>
                  {checking ? "Checking…" : "Check answer"}
                </button>
                {feedback[current.id] ? <FeedbackPanel feedback={feedback[current.id]} /> : null}
              </div>
            ) : null}
          </section>

          <p className="kbd-hint">
            Shortcuts: <kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–<kbd>4</kbd> choose
            {allowReview ? (
              <>
                {" "}
                · <kbd>M</kbd> flag
              </>
            ) : null}
          </p>
        </div>

        <aside className="exam-side">
          <div className="card">
            <h3 style={{ fontSize: "0.95rem" }}>Questions</h3>
            <div className="question-palette">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => goTo(index)}
                  disabled={!allowBack && index < currentIndex}
                  aria-label={`Question ${index + 1}${q.answer != null ? ", answered" : ""}${q.markedForReview ? ", flagged" : ""}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                  className={
                    "palette-item" +
                    (index === currentIndex ? " palette-current" : "") +
                    (q.answer != null ? " palette-answered" : "") +
                    (q.markedForReview ? " palette-flagged" : "")
                  }
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="legend">
              <span>
                <i style={{ background: "var(--primary-soft)", borderColor: "var(--mark)" }} />
                Answered
              </span>
              <span>
                <i />
                Unanswered
              </span>
              <span>⚑ Flagged</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="exam-bottombar">
        <div className="exam-bottombar-inner">
          <button type="button" className="btn btn-secondary" onClick={() => goTo(currentIndex - 1)} disabled={!allowBack || currentIndex === 0}>
            ← Previous
          </button>
          {!isLast ? (
            <button type="button" className="btn btn-secondary" onClick={() => goTo(currentIndex + 1)}>
              Next →
            </button>
          ) : null}
          <button
            type="button"
            className={"btn push " + (isLast ? "btn-primary" : "btn-secondary")}
            onClick={() => setConfirming(true)}
            disabled={submitting}
          >
            {isPractice ? "Finish practice" : "Submit exam"}
          </button>
        </div>
      </div>

      {confirming ? (
        <ConfirmModal
          title={isPractice ? "Finish this practice session?" : "Submit your exam?"}
          confirmLabel={isPractice ? "Finish and see results" : "Submit exam"}
          cancelLabel="Keep working"
          busy={submitting}
          onConfirm={submit}
          onCancel={() => setConfirming(false)}
        >
          <p>
            You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
          </p>
          <div className="row">
            {unansweredCount > 0 ? <span className="badge badge-warn">{unansweredCount} unanswered</span> : null}
            {flaggedCount > 0 ? <span className="badge badge-warn">{flaggedCount} flagged for review</span> : null}
          </div>
          {!isPractice ? <p style={{ marginTop: "0.75rem", marginBottom: 0 }}>You can&rsquo;t change your answers after submitting.</p> : null}
        </ConfirmModal>
      ) : null}
    </div>
  );
}

function QuestionInput({
  question,
  disabled,
  onAnswer,
}: {
  question: AttemptQuestionView;
  disabled: boolean;
  onAnswer: (responseData: Record<string, unknown>) => void;
}) {
  const optionText = (blocks: { type: string; text?: string }[]) =>
    blocks.map((b, i) => (b.type === "text" ? <span key={i}>{b.text}</span> : null));

  if (question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE") {
    const selected = (question.answer?.optionLabel as string) ?? "";
    return (
      <div className="option-list" role="radiogroup">
        {question.options?.map((option, i) => (
          <label key={option.label} className={"option" + (selected === option.label ? " selected" : "")}>
            <input
              type="radio"
              name={question.id}
              value={option.label}
              checked={selected === option.label}
              disabled={disabled}
              onChange={() => onAnswer({ optionLabel: option.label })}
            />
            <span className="option-key">
              {question.type === "TRUE_FALSE" ? (option.label === "True" ? "T" : "F") : String.fromCharCode(65 + i)}
            </span>
            <span>{optionText(option.content.blocks)}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const selected = ((question.answer?.optionLabels as string[]) ?? []) as string[];
    return (
      <>
        <p className="kbd-hint" style={{ marginTop: 0 }}>
          Select all that apply.
        </p>
        <div className="option-list">
          {question.options?.map((option, i) => (
            <label key={option.label} className={"option" + (selected.includes(option.label) ? " selected" : "")}>
              <input
                type="checkbox"
                value={option.label}
                checked={selected.includes(option.label)}
                disabled={disabled}
                onChange={(e) => {
                  const next = e.target.checked ? [...selected, option.label] : selected.filter((l) => l !== option.label);
                  onAnswer({ optionLabels: next });
                }}
              />
              <span className="option-key">{String.fromCharCode(65 + i)}</span>
              <span>{optionText(option.content.blocks)}</span>
            </label>
          ))}
        </div>
      </>
    );
  }

  if (question.type === "NUMERIC") {
    const value = (question.answer?.value as number) ?? "";
    return (
      <label className="text-answer">
        Your answer (number)
        <input
          type="number"
          step="any"
          defaultValue={value}
          disabled={disabled}
          onBlur={(e) => {
            const parsed = Number(e.target.value);
            if (!Number.isNaN(parsed) && e.target.value !== "") {
              onAnswer({ value: parsed });
            }
          }}
        />
      </label>
    );
  }

  const text = (question.answer?.text as string) ?? "";
  return (
    <label className="text-answer">
      Your answer
      <input
        type="text"
        defaultValue={text}
        disabled={disabled}
        onBlur={(e) => {
          if (e.target.value.trim() !== "") {
            onAnswer({ text: e.target.value });
          }
        }}
      />
    </label>
  );
}

function describeCorrect(feedback: AnswerFeedback): string | null {
  const { correct } = feedback;
  if (correct.optionLabels && correct.optionLabels.length > 0) return `Correct answer: ${correct.optionLabels.join(", ")}`;
  if (correct.value !== undefined) {
    return `Correct answer: ${correct.value}${correct.tolerance ? ` (±${correct.tolerance})` : ""}`;
  }
  if (correct.acceptedAnswers && correct.acceptedAnswers.length > 0) {
    return `Accepted answer${correct.acceptedAnswers.length > 1 ? "s" : ""}: ${correct.acceptedAnswers.join(", ")}`;
  }
  return null;
}

function FeedbackPanel({ feedback }: { feedback: AnswerFeedback }) {
  const correctText = describeCorrect(feedback);
  return (
    <div className={"feedback " + (feedback.isCorrect ? "feedback-correct" : "feedback-wrong")} role="status">
      <strong>{feedback.isCorrect ? "✓ Correct" : feedback.fraction > 0 ? "◐ Partly correct" : "✕ Not quite"}</strong>
      {!feedback.isCorrect && correctText ? <p>{correctText}</p> : null}
      {feedback.explanation ? feedback.explanation.blocks.map((b, i) => (b.type === "text" ? <p key={i}>{b.text}</p> : null)) : null}
    </div>
  );
}
