"use client";

import { useMemo, useState } from "react";
import { CatalogueExam } from "../lib/api-client";
import { ExamCard } from "./exam-card";

interface Group {
  category: string;
  order: number;
  exams: CatalogueExam[];
}

function matches(exam: CatalogueExam, q: string) {
  if (!q) return true;
  const haystack = [exam.title, exam.shortCode, exam.provider, exam.category, exam.description, exam.level]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function ExamCatalogue({ exams, initialQuery = "" }: { exams: CatalogueExam[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string>("All");

  const groups = useMemo<Group[]>(() => {
    const byCategory = new Map<string, Group>();
    for (const exam of exams) {
      const g = byCategory.get(exam.category) ?? { category: exam.category, order: exam.sortOrder, exams: [] };
      g.order = Math.min(g.order, exam.sortOrder);
      g.exams.push(exam);
      byCategory.set(exam.category, g);
    }
    return [...byCategory.values()]
      .map((g) => ({ ...g, exams: g.exams.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)) }))
      .sort((a, b) => a.order - b.order || a.category.localeCompare(b.category));
  }, [exams]);

  const visible = groups
    .filter((g) => category === "All" || g.category === category)
    .map((g) => ({ ...g, exams: g.exams.filter((e) => matches(e, query)) }))
    .filter((g) => g.exams.length > 0);

  return (
    <div>
      <div className="stack">
        <div className="search-box" style={{ maxWidth: "none" }}>
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exams, e.g. SAT, AWS, JAMB, CompTIA…"
            aria-label="Search exams"
          />
        </div>

        <div className="chip-row" role="tablist" aria-label="Exam categories">
          {["All", ...groups.map((g) => g.category)].map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={category === name}
              className={"chip" + (category === name ? " chip-active" : "")}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "1.75rem" }}>
        {visible.length === 0 ? (
          <div className="card empty">
            <strong style={{ color: "var(--text)" }}>No exams match “{query}”.</strong>
            <p style={{ margin: "0.4rem 0 0" }}>Try another name, code or provider.</p>
          </div>
        ) : (
          visible.map((g) => (
            <section key={g.category} className="category-block" aria-label={g.category}>
              <div className="category-head">
                <h2>{g.category}</h2>
                <span className="count-pill">{g.exams.length}</span>
              </div>
              <div className="grid grid-3">
                {g.exams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
