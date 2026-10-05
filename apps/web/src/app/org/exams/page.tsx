"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { OrgGate } from "../../../components/org-gate";
import { OrgExam, createOrgExam, fetchOrgExams } from "../../../lib/org-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function OrgExams({ token }: { token: string }) {
  const [exams, setExams] = useState<OrgExam[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    fetchOrgExams(token)
      .then(setExams)
      .catch((err) => setError(errorText(err)));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setCreating(true);
    try {
      await createOrgExam(token, { slug: slug || slugify(title), title, description: description || undefined });
      setMessage(`Exam "${title}" created. Add a version, topics and questions via the API to publish it.`);
      setTitle("");
      setSlug("");
      setDescription("");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="admin-main">
      <Link href="/org" className="back-link">
        ← Organization
      </Link>
      <h1>Your custom exams</h1>
      <p>
        Exams created here are private to your organization: they never appear in the public catalogue, and only
        your members can attempt them, for free and without limit. Each new exam builds on the same versioning,
        topic and question engine as the platform's own exams.
      </p>
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      <form onSubmit={handleCreate}>
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
          <button type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create exam"}
          </button>
        </div>
      </form>

      <table className="data-table" style={{ marginTop: "1.5rem" }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Slug</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => (
            <tr key={exam.id}>
              <td>{exam.title}</td>
              <td className="mono">{exam.slug}</td>
              <td>
                <span className="status-pill">{exam.status}</span>
              </td>
            </tr>
          ))}
          {exams.length === 0 ? (
            <tr>
              <td colSpan={3} className="empty">
                No custom exams yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default function OrgExamsPage() {
  return <OrgGate>{(token) => <OrgExams token={token} />}</OrgGate>;
}
