import Link from "next/link";
import { CSSProperties } from "react";
import { notFound } from "next/navigation";
import {
  ApiError,
  ExamVersionConfig,
  TopicNode,
  fetchCatalogue,
  fetchExamBySlug,
  fetchPublishedVersions,
  fetchTopicTree,
  rethrowIfDynamicServerUsage,
} from "../../../lib/api-client";
import { ExamActions, TopicOption } from "../../../components/exam-actions";
import { ExamMonogram } from "../../../components/exam-card";
import { examAccent } from "../../../lib/exam-theme";

// A real 404 from the API means the exam genuinely doesn't exist; anything
// else (network/DNS failure, a 5xx) must not be treated the same way, or a
// transient infra blip looks identical to a permanently dead link. Letting
// it propagate lets the nearest error.tsx boundary handle it instead.
function examNotFoundOrRethrow(error: unknown): null {
  rethrowIfDynamicServerUsage(error);
  if (error instanceof ApiError && error.status === 404) {
    return null;
  }
  throw error;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const exam = await fetchExamBySlug(params.slug).catch(examNotFoundOrRethrow);
  return { title: exam ? exam.title : "Exam" };
}

function flattenTopics(nodes: TopicNode[], depth = 0): TopicOption[] {
  return nodes.flatMap((node) => [{ id: node.id, title: node.title, depth }, ...flattenTopics(node.children, depth + 1)]);
}

function Syllabus({ nodes }: { nodes: TopicNode[] }) {
  if (nodes.length === 0) return null;
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="topic-row">
            <span>{node.title}</span>
            {node.questionCount !== undefined ? (
              <span className="count-pill">
                {node.questionCount} question{node.questionCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <Syllabus nodes={node.children} />
        </li>
      ))}
    </ul>
  );
}

const SCORING_LABEL: Record<string, string> = {
  RAW: "Raw score (1 point per question)",
  PERCENTAGE: "Percentage correct",
  WEIGHTED: "Weighted by question difficulty",
};

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function Rules({ config }: { config: ExamVersionConfig }) {
  return (
    <ul className="check-list">
      <li>
        Time limit: <strong>{Math.round(config.durationSeconds / 60)} minutes</strong>, enforced by the server
      </li>
      <li>
        Scoring: <strong>{SCORING_LABEL[config.scoringStrategy.type] ?? config.scoringStrategy.type}</strong>
      </li>
      <li>Go back to earlier questions: {yesNo(config.navigation.allowBackNavigation)}</li>
      <li>Change answers: {yesNo(config.navigation.allowAnswerChanges)}</li>
      <li>Mark questions for review: {yesNo(config.navigation.allowMarkForReview)}</li>
      <li>No hints or explanations during a simulation; full review afterwards</li>
    </ul>
  );
}

export default async function ExamDetailPage({ params }: { params: { slug: string } }) {
  const exam = await fetchExamBySlug(params.slug).catch(examNotFoundOrRethrow);
  if (!exam) {
    notFound();
  }

  const [versions, catalogue] = await Promise.all([
    fetchPublishedVersions(exam.id).catch((error) => {
      rethrowIfDynamicServerUsage(error);
      return [];
    }),
    fetchCatalogue().catch((error) => {
      rethrowIfDynamicServerUsage(error);
      return [];
    }),
  ]);
  const current = versions[0];
  const topicTree = current
    ? await fetchTopicTree(current.id).catch((error) => {
        rethrowIfDynamicServerUsage(error);
        return [];
      })
    : [];
  const stats = catalogue.find((e) => e.id === exam.id)?.version ?? null;

  return (
    <>
      <section className="page-hero" style={{ "--exam-accent": examAccent(exam.category) } as CSSProperties}>
        <div className="container">
          <nav aria-label="Breadcrumb" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
            <Link href="/exams">Exams</Link> <span className="muted">/</span> <span className="muted">{exam.category}</span>
          </nav>
          <div className="row" style={{ alignItems: "flex-start", gap: "1.25rem", flexWrap: "nowrap" }}>
            <ExamMonogram exam={exam} large />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ marginBottom: "0.35rem" }}>{exam.title}</h1>
              <div className="row" style={{ gap: "0.4rem", marginBottom: "0.7rem" }}>
                {exam.provider ? <span className="muted" style={{ fontSize: "0.92rem" }}>{exam.provider}</span> : null}
                {exam.shortCode ? <span className="badge badge-primary">{exam.shortCode}</span> : null}
                {exam.level ? <span className="badge">{exam.level}</span> : null}
              </div>
              {exam.description ? <p className="lead" style={{ maxWidth: 640, marginBottom: "0.9rem" }}>{exam.description}</p> : null}
              {stats ? (
                <div className="row" style={{ gap: "0.5rem" }}>
                  <span className="badge">{stats.questionCount} questions</span>
                  <span className="badge">{stats.topicCount} topics</span>
                  <span className="badge">{stats.durationMinutes} min simulation</span>
                  <span className="badge badge-good">Free practice</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="container section-tight" style={{ paddingTop: "1.75rem" }}>
        {!current ? (
          <div className="card empty">
            <strong style={{ color: "var(--text)" }}>This exam isn&rsquo;t published yet.</strong>
            <p style={{ margin: "0.4rem 0 0" }}>Check back soon, or browse other exams.</p>
            <Link href="/exams" className="btn btn-secondary" style={{ marginTop: "0.75rem" }}>
              Browse exams
            </Link>
          </div>
        ) : (
          <div className="detail-grid">
            <div className="stack">
              <ExamActions examId={exam.id} examVersionId={current.id} topics={flattenTopics(topicTree)} />

              <div className="card">
                <div className="card-title">
                  <h2>Syllabus &amp; topics</h2>
                  <span className="badge">{current.versionLabel}</span>
                </div>
                {topicTree.length === 0 ? <p>No topics have been added yet.</p> : <div className="syllabus"><Syllabus nodes={topicTree} /></div>}
              </div>
            </div>

            <aside className="stack" style={{ position: "sticky", top: "calc(var(--header-h) + 1rem)" }}>
              <div className="card">
                <h3>Exam rules</h3>
                <Rules config={current.config} />
              </div>
              <div className="info-banner">
                Independent practice content with original questions. Not affiliated with or endorsed by the exam provider.
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
