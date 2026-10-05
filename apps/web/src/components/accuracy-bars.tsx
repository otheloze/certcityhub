import { ReactNode } from "react";

export interface AccuracyRow {
  id: string;
  label: string;
  sub?: string;
  value: number; // 0-100
  correct: number;
  total: number;
  action?: ReactNode;
}

// Status is always icon + words (never colour alone): >=75 strong, <50 needs work.
function status(value: number) {
  if (value >= 75) return { text: "✓ Strong", cls: "badge-good" };
  if (value < 50) return { text: "⚠ Needs work", cls: "badge-bad" };
  return null;
}

export function AccuracyBars({ rows }: { rows: AccuracyRow[] }) {
  return (
    <div>
      {rows.map((row) => {
        const s = status(row.value);
        return (
          <div key={row.id} className="bar-row">
            <div className="bar-label">
              {row.label}
              <small>
                {row.correct} of {row.total} correct
                {row.sub ? ` · ${row.sub}` : ""}
              </small>
            </div>
            <div className="bar-track" title={`${row.label}: ${row.value.toFixed(0)}% (${row.correct}/${row.total})`}>
              <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, row.value))}%` }} />
            </div>
            <div className="row" style={{ gap: "0.5rem", justifyContent: "flex-end", flexWrap: "nowrap" }}>
              {s ? <span className={"badge " + s.cls}>{s.text}</span> : null}
              <span className="bar-value">{row.value.toFixed(0)}%</span>
              {row.action}
            </div>
          </div>
        );
      })}
    </div>
  );
}
