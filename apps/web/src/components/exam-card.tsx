import Link from "next/link";
import { CSSProperties } from "react";
import { CatalogueExam } from "../lib/api-client";
import { examAccent, monogram } from "../lib/exam-theme";

export function ExamMonogram({ exam, large }: { exam: Pick<CatalogueExam, "category" | "shortCode" | "title">; large?: boolean }) {
  return (
    <span
      className={"mono" + (large ? " mono-lg" : "")}
      style={{ "--exam-accent": examAccent(exam.category) } as CSSProperties}
      aria-hidden="true"
    >
      {monogram(exam.shortCode, exam.title)}
    </span>
  );
}

export function ExamCard({ exam }: { exam: CatalogueExam }) {
  const v = exam.version;
  return (
    <Link
      href={`/exams/${exam.slug}`}
      className="exam-card"
      style={{ "--exam-accent": examAccent(exam.category) } as CSSProperties}
    >
      <div className="exam-card-head">
        <ExamMonogram exam={exam} />
        <div style={{ minWidth: 0 }}>
          <h3>{exam.title}</h3>
          {exam.provider ? <div className="provider">{exam.provider}</div> : null}
        </div>
      </div>
      {exam.description ? <p>{exam.description}</p> : null}
      <div className="exam-card-foot">
        {exam.shortCode ? <span className="badge badge-primary">{exam.shortCode}</span> : null}
        {exam.level ? <span className="badge">{exam.level}</span> : null}
        {v ? (
          <>
            <span className="badge">{v.questionCount} questions</span>
            <span className="badge">{v.durationMinutes} min</span>
          </>
        ) : (
          <span className="badge badge-warn">Coming soon</span>
        )}
      </div>
    </Link>
  );
}
