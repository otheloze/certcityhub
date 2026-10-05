"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "../../../components/admin-gate";
import { ExamSummary, fetchExamCatalogue } from "../../../lib/api-client";
import {
  AdminVersion,
  adminCreateExam,
  adminCreateVersion,
  adminListVersions,
  adminPublishVersion,
  slugify,
} from "../../../lib/admin-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

function AddVersionForm({ token, examId, onDone }: { token: string; examId: string; onDone: () => void }) {
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [back, setBack] = useState(true);
  const [changes, setChanges] = useState(true);
  const [review, setReview] = useState(true);
  const [scoring, setScoring] = useState("RAW");
  const [count, setCount] = useState("");
  const [randomize, setRandomize] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await adminCreateVersion(token, examId, {
        versionLabel: label,
        config: {
          durationSeconds: minutes * 60,
          navigation: { allowBackNavigation: back, allowAnswerChanges: changes, allowMarkForReview: review },
          scoringStrategy: { type: scoring },
          blueprint: count ? { questionCount: Number(count), randomize } : undefined,
        },
      });
      setLabel("");
      onDone();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <form onSubmit={submit}>
      <strong>New version</strong>
      <div className="inline-form">
        <label>
          Label
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="2027-v1" required />
        </label>
        <label>
          Duration (minutes)
          <input type="number" min={1} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
        </label>
        <label>
          Scoring
          <select value={scoring} onChange={(e) => setScoring(e.target.value)}>
            <option value="RAW">Raw score</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="WEIGHTED">Weighted by difficulty</option>
          </select>
        </label>
        <label>
          Questions per attempt
          <input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} placeholder="all" />
        </label>
      </div>
      <div className="inline-form">
        <label className="check-row">
          <input type="checkbox" checked={back} onChange={(e) => setBack(e.target.checked)} /> Allow going back
        </label>
        <label className="check-row">
          <input type="checkbox" checked={changes} onChange={(e) => setChanges(e.target.checked)} /> Allow changing answers
        </label>
        <label className="check-row">
          <input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} /> Allow mark for review
        </label>
        <label className="check-row">
          <input type="checkbox" checked={randomize} onChange={(e) => setRandomize(e.target.checked)} /> Randomise questions
        </label>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit">Create version</button>
    </form>
  );
}

function ExamsAdmin({ token }: { token: string }) {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [versions, setVersions] = useState<Record<string, AdminVersion[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [provider, setProvider] = useState("");
  const [level, setLevel] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await fetchExamCatalogue();
      setExams(list);
      const entries = await Promise.all(list.map(async (e) => [e.id, await adminListVersions(token, e.id)] as const));
      setVersions(Object.fromEntries(entries));
    } catch (err) {
      setError(errorText(err));
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function createExam(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await adminCreateExam(token, {
        slug: slug || slugify(title),
        title,
        description: description || undefined,
        category: category || undefined,
        shortCode: shortCode || undefined,
        provider: provider || undefined,
        level: level || undefined,
      });
      setMessage(`Exam "${title}" created. Add a version below.`);
      setTitle("");
      setSlug("");
      setDescription("");
      setCategory("");
      setShortCode("");
      setProvider("");
      setLevel("");
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function publish(version: AdminVersion) {
    setError(null);
    setMessage(null);
    try {
      await adminPublishVersion(token, version.id);
      setMessage(`Version ${version.versionLabel} published. Its topic tree and configuration are now frozen.`);
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div className="admin-main">
      <Link href="/admin" className="back-link">
        ← Administration
      </Link>
      <h1>Exams &amp; content</h1>
      <p>
        Everything below is data: adding an exam needs no code change. Create an exam, add a version, build its topic
        tree, write questions, publish.
      </p>
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      <form onSubmit={createExam}>
        <strong>New exam</strong>
        <div className="inline-form">
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            URL name
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={title ? slugify(title) : "auto"} />
          </label>
          <label style={{ flex: 1, minWidth: 220 }}>
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>
        <div className="inline-form">
          <label>
            Category
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Cloud, IT, School..." />
          </label>
          <label>
            Short code
            <input value={shortCode} onChange={(e) => setShortCode(e.target.value)} placeholder="CLF-C02" />
          </label>
          <label>
            Provider
            <input value={provider} onChange={(e) => setProvider(e.target.value)} />
          </label>
          <label>
            Level
            <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Foundational" />
          </label>
          <button type="submit">Create exam</button>
        </div>
      </form>

      {exams.map((exam) => (
        <section key={exam.id} className="question-card" style={{ marginTop: "1.5rem" }}>
          <h2 style={{ marginTop: 0 }}>{exam.title}</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Questions / attempt</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(versions[exam.id] ?? []).map((v) => (
                <tr key={v.id}>
                  <td>{v.versionLabel}</td>
                  <td>
                    <span className={`status-pill status-${v.status}`}>{v.status}</span>
                  </td>
                  <td>{Math.round(v.config.durationSeconds / 60)} min</td>
                  <td>{v.config.blueprint?.questionCount ?? "all"}</td>
                  <td>
                    <div className="button-row">
                      <Link href={`/admin/versions/${v.id}`} className="small-button secondary-button" style={{ borderRadius: 6, fontWeight: 600 }}>
                        Topics &amp; questions
                      </Link>
                      {v.status === "DRAFT" ? (
                        <button type="button" className="small-button" onClick={() => publish(v)}>
                          Publish
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <AddVersionForm token={token} examId={exam.id} onDone={load} />
        </section>
      ))}
    </div>
  );
}

export default function AdminExamsPage() {
  return <AdminGate>{(token) => <ExamsAdmin token={token} />}</AdminGate>;
}
