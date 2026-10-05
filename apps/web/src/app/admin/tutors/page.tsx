"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "../../../components/admin-gate";
import { API_ORIGIN } from "../../../lib/api-client";
import { AdminTutorProfile, TutorProfileStatus, approveAdminTutor, fetchAdminTutors, rejectAdminTutor } from "../../../lib/tutor-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

const FILTERS: { label: string; value: TutorProfileStatus | "" }[] = [
  { label: "Pending review", value: "PENDING_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Draft", value: "DRAFT" },
  { label: "All", value: "" },
];

function AdminTutors({ token }: { token: string }) {
  const [status, setStatus] = useState<TutorProfileStatus | "">("PENDING_REVIEW");
  const [tutors, setTutors] = useState<AdminTutorProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    fetchAdminTutors(token, status || undefined)
      .then(setTutors)
      .catch((err) => setError(errorText(err)));
  }, [token, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(id: string) {
    setError(null);
    setMessage(null);
    setBusyId(id);
    try {
      await approveAdminTutor(token, id);
      setMessage("Tutor approved.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(e: FormEvent, id: string) {
    e.preventDefault();
    const reason = reasons[id]?.trim();
    if (!reason) {
      setError("Give a reason so the tutor knows what to fix.");
      return;
    }
    setError(null);
    setMessage(null);
    setBusyId(id);
    try {
      await rejectAdminTutor(token, id, reason);
      setMessage("Sent back to the tutor with your feedback.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-main">
      <Link href="/admin" className="back-link">
        ← Administration
      </Link>
      <h1>Tutors</h1>
      <p>Review submitted profiles before they're listed publicly and suggested to students.</p>
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      <div className="chip-row" style={{ margin: "1rem 0" }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={"chip" + (status === f.value ? " chip-active" : "")}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {tutors.length === 0 ? (
        <div className="card empty">No tutors match this filter.</div>
      ) : (
        tutors.map((tutor) => (
          <section key={tutor.id} className="question-card" style={{ marginBottom: "1.25rem" }}>
            <div className="row" style={{ gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
              {tutor.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_ORIGIN}${tutor.photoUrl}`}
                  alt={tutor.displayName}
                  style={{ height: 56, width: 56, objectFit: "cover", borderRadius: "50%" }}
                />
              ) : null}
              <div>
                <strong style={{ color: "var(--text)" }}>{tutor.displayName}</strong>
                <div className="field-note">{tutor.user.email}</div>
              </div>
              <span className="status-pill" style={{ marginLeft: "auto" }}>
                {tutor.status}
              </span>
            </div>
            {tutor.headline ? <p>{tutor.headline}</p> : null}
            {tutor.bio ? <p style={{ whiteSpace: "pre-wrap" }}>{tutor.bio}</p> : null}
            <p>
              <strong>Specializations:</strong>{" "}
              {tutor.specializations.length === 0
                ? "none"
                : tutor.specializations.map((s) => (s.topicKeyword ? `${s.exam.title} — ${s.topicKeyword}` : s.exam.title)).join(", ")}
            </p>
            {tutor.resumeUrl ? (
              <p>
                <a href={`${API_ORIGIN}${tutor.resumeUrl}`} target="_blank" rel="noreferrer">
                  View resume
                </a>
              </p>
            ) : (
              <p className="field-note">No resume uploaded.</p>
            )}
            {tutor.status === "PENDING_REVIEW" ? (
              <div className="row" style={{ gap: "0.6rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                <button type="button" className="small-button" disabled={busyId === tutor.id} onClick={() => handleApprove(tutor.id)}>
                  {busyId === tutor.id ? "…" : "Approve"}
                </button>
                <form onSubmit={(e) => handleReject(e, tutor.id)} className="row" style={{ gap: "0.4rem", flexWrap: "nowrap" }}>
                  <input
                    value={reasons[tutor.id] ?? ""}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [tutor.id]: e.target.value }))}
                    placeholder="Reason for rejecting"
                    style={{ minWidth: 220 }}
                  />
                  <button type="submit" className="small-button" disabled={busyId === tutor.id}>
                    Reject
                  </button>
                </form>
              </div>
            ) : null}
            {tutor.status === "REJECTED" && tutor.rejectionReason ? (
              <p className="field-note">Last feedback: {tutor.rejectionReason}</p>
            ) : null}
          </section>
        ))
      )}
    </div>
  );
}

export default function AdminTutorsPage() {
  return <AdminGate>{(token) => <AdminTutors token={token} />}</AdminGate>;
}
