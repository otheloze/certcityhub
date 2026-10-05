"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "../../../../components/admin-gate";
import { FlatTopic, QuestionForm } from "../../../../components/question-form";
import { TopicNode } from "../../../../lib/api-client";
import {
  AdminQuestion,
  AdminVersion,
  QuestionStatus,
  adminChangeQuestionStatus,
  adminCreateTopic,
  adminGetVersion,
  adminListQuestions,
  adminPublishVersion,
  adminTopicTree,
  slugify,
} from "../../../../lib/admin-api";

const NEXT_STEPS: Record<QuestionStatus, { label: string; to: QuestionStatus }[]> = {
  DRAFT: [{ label: "Submit for review", to: "IN_REVIEW" }],
  IN_REVIEW: [
    { label: "Approve", to: "APPROVED" },
    { label: "Reject", to: "DRAFT" },
  ],
  APPROVED: [
    { label: "Publish", to: "PUBLISHED" },
    { label: "Back to draft", to: "DRAFT" },
  ],
  PUBLISHED: [{ label: "Retire", to: "RETIRED" }],
  RETIRED: [],
};

function flatten(nodes: TopicNode[], depth = 0): FlatTopic[] {
  return nodes.flatMap((n) => [{ id: n.id, title: n.title, depth }, ...flatten(n.children, depth + 1)]);
}

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

function TopicList({ nodes, onAddChild, editable }: { nodes: TopicNode[]; onAddChild: (id: string) => void; editable: boolean }) {
  if (nodes.length === 0) return null;
  return (
    <ul>
      {nodes.map((n) => (
        <li key={n.id}>
          <div className="topic-row">
            <span>
              {n.title} {n.status === "ARCHIVED" ? <span className="status-pill status-ARCHIVED">archived</span> : null}
            </span>
            {editable ? (
              <button type="button" className="small-button secondary-button" onClick={() => onAddChild(n.id)}>
                + Sub-topic
              </button>
            ) : null}
          </div>
          <TopicList nodes={n.children} onAddChild={onAddChild} editable={editable} />
        </li>
      ))}
    </ul>
  );
}

function VersionEditor({ token, versionId }: { token: string; versionId: string }) {
  const [version, setVersion] = useState<AdminVersion | null>(null);
  const [tree, setTree] = useState<TopicNode[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [parentId, setParentId] = useState("");

  const load = useCallback(async () => {
    try {
      const [v, t, q] = await Promise.all([
        adminGetVersion(token, versionId),
        adminTopicTree(token, versionId),
        adminListQuestions(token, versionId),
      ]);
      setVersion(v);
      setTree(t);
      setQuestions(q);
    } catch (err) {
      setError(errorText(err));
    }
  }, [token, versionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addTopic(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await adminCreateTopic(token, {
        examVersionId: versionId,
        parentId: parentId || undefined,
        title: topicTitle,
        slug: slugify(topicTitle),
      });
      setTopicTitle("");
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function move(question: AdminQuestion, to: QuestionStatus) {
    setError(null);
    setMessage(null);
    try {
      await adminChangeQuestionStatus(token, question.id, to);
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function publishVersion() {
    setError(null);
    try {
      await adminPublishVersion(token, versionId);
      setMessage("Version published. Its topic tree and configuration are now frozen.");
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  if (!version) {
    return (
      <div className="admin-main">
        {error ? <p role="alert">{error}</p> : <p>Loading…</p>}
      </div>
    );
  }

  const topics = flatten(tree);
  const editable = version.status === "DRAFT";

  return (
    <div className="admin-main">
      <Link href="/admin/exams" className="back-link">
        ← Exams &amp; content
      </Link>
      <h1>
        {version.exam?.title} — {version.versionLabel}{" "}
        <span className={`status-pill status-${version.status}`}>{version.status}</span>
      </h1>
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {editable ? (
        <p>
          This version is a draft. Build the topic tree and write questions, then publish it.{" "}
          <button type="button" className="small-button" onClick={publishVersion}>
            Publish version
          </button>
        </p>
      ) : (
        <p>Published versions are frozen: their configuration and topic tree can no longer change. Questions can still be added and published.</p>
      )}

      <h2>Topic tree</h2>
      {tree.length === 0 ? <p>No topics yet.</p> : <TopicList nodes={tree} editable={editable} onAddChild={setParentId} />}
      {editable ? (
        <form onSubmit={addTopic}>
          <strong>Add topic</strong>
          <div className="inline-form">
            <label>
              Under
              <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">(top level)</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {"  ".repeat(t.depth)}
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ flex: 1, minWidth: 220 }}>
              Title
              <input value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} required />
            </label>
            <button type="submit">Add</button>
          </div>
        </form>
      ) : null}

      <h2>Questions ({questions.length})</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Type</th>
            <th>Topic</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td>{q.stem.blocks[0]?.text ?? q.title}</td>
              <td>{q.type.replace("_", " ").toLowerCase()}</td>
              <td>{q.questionTopics.find((t) => t.isPrimary)?.topic.title ?? "—"}</td>
              <td>
                <span className={`status-pill status-${q.status}`}>{q.status.replace("_", " ")}</span>
              </td>
              <td>
                <div className="button-row">
                  {NEXT_STEPS[q.status].map((step) => (
                    <button
                      key={step.to}
                      type="button"
                      className={"small-button" + (step.to === "DRAFT" || step.to === "RETIRED" ? " secondary-button" : "")}
                      onClick={() => move(q, step.to)}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section style={{ marginTop: "1.5rem" }}>
        <QuestionForm
          token={token}
          examId={version.examId}
          examVersionId={versionId}
          topics={topics}
          onCreated={load}
        />
      </section>
    </div>
  );
}

export default function AdminVersionPage({ params }: { params: { id: string } }) {
  return <AdminGate>{(token) => <VersionEditor token={token} versionId={params.id} />}</AdminGate>;
}
