"use client";

import { FormEvent, useState } from "react";
import { adminCreateQuestion, adminMapTopic, QuestionType } from "../lib/admin-api";

export interface FlatTopic {
  id: string;
  title: string;
  depth: number;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Single choice",
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / false",
  NUMERIC: "Numeric",
  SHORT_ANSWER: "Short answer",
};

const blocks = (text: string) => ({ blocks: [{ type: "text", text }] });

export function QuestionForm({
  token,
  examId,
  examVersionId,
  topics,
  onCreated,
}: {
  token: string;
  examId: string;
  examVersionId: string;
  topics: FlatTopic[];
  onCreated: () => void;
}) {
  const [type, setType] = useState<QuestionType>("SINGLE_CHOICE");
  const [stem, setStem] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [topicId, setTopicId] = useState("");
  const [options, setOptions] = useState([
    { text: "", correct: true },
    { text: "", correct: false },
  ]);
  const [tfCorrect, setTfCorrect] = useState<"True" | "False">("True");
  const [partial, setPartial] = useState(false);
  const [numValue, setNumValue] = useState("");
  const [numTolerance, setNumTolerance] = useState("0");
  const [answers, setAnswers] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchType, setMatchType] = useState("exact");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isChoice = type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";

  function setCorrect(index: number, value: boolean) {
    setOptions((prev) =>
      prev.map((o, i) => {
        if (type === "SINGLE_CHOICE") return { ...o, correct: i === index };
        return i === index ? { ...o, correct: value } : o;
      }),
    );
  }

  function buildPayload(): Record<string, unknown> | string {
    if (!stem.trim()) return "Write the question text.";

    const base: Record<string, unknown> = {
      examId,
      examVersionId,
      type,
      stem: blocks(stem.trim()),
      difficulty,
      explanation: explanation.trim() ? blocks(explanation.trim()) : undefined,
    };

    if (isChoice) {
      const filled = options.filter((o) => o.text.trim());
      if (filled.length < 2) return "Add at least two answer options.";
      const correct = filled.filter((o) => o.correct).length;
      if (correct === 0) return "Mark at least one correct option.";
      if (type === "SINGLE_CHOICE" && correct !== 1) return "A single-choice question needs exactly one correct option.";
      return {
        ...base,
        answerSchema: { allowPartialCredit: type === "MULTIPLE_CHOICE" && partial },
        options: filled.map((o, i) => ({
          label: String.fromCharCode(65 + i),
          content: blocks(o.text.trim()),
          isCorrect: o.correct,
        })),
      };
    }

    if (type === "TRUE_FALSE") {
      return {
        ...base,
        answerSchema: { allowPartialCredit: false },
        options: ["True", "False"].map((label) => ({
          label,
          content: blocks(label),
          isCorrect: label === tfCorrect,
        })),
      };
    }

    if (type === "NUMERIC") {
      if (numValue === "" || Number.isNaN(Number(numValue))) return "Enter the correct numeric value.";
      return { ...base, answerSchema: { correctValue: Number(numValue), tolerance: Number(numTolerance) || 0 } };
    }

    const accepted = answers
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    if (accepted.length === 0) return "Enter at least one accepted answer.";
    return { ...base, answerSchema: { acceptedAnswers: accepted, caseSensitive, matchType } };
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = buildPayload();
    if (typeof payload === "string") {
      setError(payload);
      return;
    }
    setSaving(true);
    try {
      const created = await adminCreateQuestion(token, payload);
      if (topicId) await adminMapTopic(token, created.id, topicId, true);
      setStem("");
      setExplanation("");
      setOptions([
        { text: "", correct: true },
        { text: "", correct: false },
      ]);
      setNumValue("");
      setAnswers("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the question.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <strong>New question (saved as a draft)</strong>
      <div className="inline-form">
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Difficulty
          <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label>
          Topic
          <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            <option value="">(none)</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {"  ".repeat(t.depth)}
                {t.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Question
        <textarea value={stem} onChange={(e) => setStem(e.target.value)} />
      </label>

      {isChoice ? (
        <div>
          {options.map((o, i) => (
            <div key={i} className="inline-form" style={{ marginBottom: "0.4rem" }}>
              <strong style={{ width: 22 }}>{String.fromCharCode(65 + i)}</strong>
              <input
                style={{ flex: 1, minWidth: 220 }}
                value={o.text}
                onChange={(e) => setOptions((prev) => prev.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                placeholder="Answer option"
              />
              <label className="check-row">
                <input
                  type={type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                  name="correct"
                  checked={o.correct}
                  onChange={(e) => setCorrect(i, e.target.checked)}
                />
                Correct
              </label>
            </div>
          ))}
          <div className="button-row">
            <button
              type="button"
              className="small-button secondary-button"
              onClick={() => setOptions((prev) => [...prev, { text: "", correct: false }])}
              disabled={options.length >= 8}
            >
              + Add option
            </button>
            {options.length > 2 ? (
              <button
                type="button"
                className="small-button secondary-button"
                onClick={() => setOptions((prev) => prev.slice(0, -1))}
              >
                − Remove last
              </button>
            ) : null}
          </div>
          {type === "MULTIPLE_CHOICE" ? (
            <label className="check-row" style={{ marginTop: "0.5rem" }}>
              <input type="checkbox" checked={partial} onChange={(e) => setPartial(e.target.checked)} /> Award partial credit
            </label>
          ) : null}
        </div>
      ) : null}

      {type === "TRUE_FALSE" ? (
        <label>
          Correct answer
          <select value={tfCorrect} onChange={(e) => setTfCorrect(e.target.value as "True" | "False")}>
            <option value="True">True</option>
            <option value="False">False</option>
          </select>
        </label>
      ) : null}

      {type === "NUMERIC" ? (
        <div className="inline-form">
          <label>
            Correct value
            <input type="number" step="any" value={numValue} onChange={(e) => setNumValue(e.target.value)} />
          </label>
          <label>
            Tolerance (±)
            <input type="number" step="any" min={0} value={numTolerance} onChange={(e) => setNumTolerance(e.target.value)} />
          </label>
        </div>
      ) : null}

      {type === "SHORT_ANSWER" ? (
        <div className="inline-form">
          <label style={{ flex: 1, minWidth: 220 }}>
            Accepted answers (comma-separated)
            <input value={answers} onChange={(e) => setAnswers(e.target.value)} />
          </label>
          <label>
            Match
            <select value={matchType} onChange={(e) => setMatchType(e.target.value)}>
              <option value="exact">Exact</option>
              <option value="contains">Contains</option>
              <option value="regex">Pattern (regex)</option>
            </select>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} /> Case sensitive
          </label>
        </div>
      ) : null}

      <label>
        Explanation (shown after answering, never during an exam)
        <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </label>

      {error ? <p role="alert">{error}</p> : null}
      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save draft question"}
      </button>
    </form>
  );
}
