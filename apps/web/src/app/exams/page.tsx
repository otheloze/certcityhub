import { fetchCatalogue, rethrowIfDynamicServerUsage } from "../../lib/api-client";
import { ExamCatalogue } from "../../components/exam-catalogue";

export const metadata = { title: "All exams" };

export default async function ExamsPage({ searchParams }: { searchParams?: { q?: string } }) {
  const exams = await fetchCatalogue().catch((error) => {
    rethrowIfDynamicServerUsage(error);
    return [];
  });
  return (
    <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
      <div className="section-head">
        <span className="eyebrow">Exam catalogue</span>
        <h1>Find your exam</h1>
        <p>Search by name, code or provider, or browse by category. Practice is free for every exam.</p>
      </div>
      {exams.length === 0 ? (
        <div className="card empty">
          <strong style={{ color: "var(--text)" }}>No exams are available yet.</strong>
          <p style={{ margin: "0.4rem 0 0" }}>Check that the API is running, or add exams from the admin area.</p>
        </div>
      ) : (
        <ExamCatalogue exams={exams} initialQuery={searchParams?.q ?? ""} />
      )}
    </div>
  );
}
