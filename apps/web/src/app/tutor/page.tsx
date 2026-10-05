"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { TutorGate } from "../../components/tutor-gate";
import { API_ORIGIN, CatalogueExam, fetchCatalogue } from "../../lib/api-client";
import {
  TutorProfile,
  addMySpecialization,
  fetchMyTutorProfile,
  removeMySpecialization,
  submitTutorProfile,
  updateMyTutorProfile,
  uploadTutorPhoto,
  uploadTutorResume,
} from "../../lib/tutor-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

const STATUS_LABEL: Record<TutorProfile["status"], { text: string; cls: string }> = {
  DRAFT: { text: "Draft — not yet submitted", cls: "" },
  PENDING_REVIEW: { text: "Submitted — awaiting review", cls: "status-IN_REVIEW" },
  APPROVED: { text: "Approved — visible to students", cls: "status-PUBLISHED" },
  REJECTED: { text: "Changes requested", cls: "status-RETIRED" },
};

function TutorDashboard({ token }: { token: string }) {
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [exams, setExams] = useState<CatalogueExam[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [examSlug, setExamSlug] = useState("");
  const [topicKeyword, setTopicKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [addingSpec, setAddingSpec] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetchMyTutorProfile(token)
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName);
        setHeadline(p.headline ?? "");
        setBio(p.bio ?? "");
      })
      .catch((err) => setError(errorText(err)));
  }, [token]);

  useEffect(() => {
    load();
    fetchCatalogue()
      .then((list) => {
        setExams(list);
        if (list.length > 0) setExamSlug(list[0].slug);
      })
      .catch(() => undefined);
  }, [load]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const updated = await updateMyTutorProfile(token, { displayName, headline, bio });
      setProfile((p) => (p ? { ...p, ...updated } : updated));
      setMessage("Profile saved.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    setUploadingPhoto(true);
    try {
      const updated = await uploadTutorPhoto(token, file);
      setProfile((p) => (p ? { ...p, ...updated } : updated));
      setMessage("Photo updated.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  async function handleResume(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    setUploadingResume(true);
    try {
      const updated = await uploadTutorResume(token, file);
      setProfile((p) => (p ? { ...p, ...updated } : updated));
      setMessage("Resume updated.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  }

  async function handleAddSpecialization(e: FormEvent) {
    e.preventDefault();
    if (!examSlug) return;
    setError(null);
    setMessage(null);
    setAddingSpec(true);
    try {
      const spec = await addMySpecialization(token, { examSlug, topicKeyword: topicKeyword || undefined });
      setProfile((p) => (p ? { ...p, specializations: [...p.specializations, spec] } : p));
      setTopicKeyword("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setAddingSpec(false);
    }
  }

  async function handleRemoveSpecialization(id: string) {
    setError(null);
    setMessage(null);
    try {
      await removeMySpecialization(token, id);
      setProfile((p) => (p ? { ...p, specializations: p.specializations.filter((s) => s.id !== id) } : p));
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function handleSubmit() {
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const updated = await submitTutorProfile(token);
      setProfile((p) => (p ? { ...p, ...updated } : updated));
      setMessage("Submitted for review. We'll email you once it's been checked.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!profile) {
    return (
      <div className="admin-main">
        <p>{error ?? "Loading your profile…"}</p>
      </div>
    );
  }

  const status = STATUS_LABEL[profile.status];
  const missing: string[] = [];
  if (!profile.photoUrl) missing.push("a profile photo");
  if (!profile.resumeUrl) missing.push("a resume");
  if (profile.specializations.length === 0) missing.push("at least one specialization");
  const canSubmit = missing.length === 0 && (profile.status === "DRAFT" || profile.status === "REJECTED");

  return (
    <div className="admin-main">
      <h1>{profile.displayName || "Your tutor profile"}</h1>
      <p className="field-note">
        <span className={"status-pill " + status.cls}>{status.text}</span>
      </p>
      {profile.status === "REJECTED" && profile.rejectionReason ? (
        <p role="alert">Reviewer feedback: {profile.rejectionReason}</p>
      ) : null}
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      <section className="question-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Photo</h2>
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_ORIGIN}${profile.photoUrl}`}
            alt={profile.displayName}
            style={{ height: 96, width: 96, objectFit: "cover", display: "block", marginBottom: "0.75rem", borderRadius: "50%" }}
          />
        ) : (
          <p className="field-note">No photo uploaded yet.</p>
        )}
        <label className="small-button" style={{ display: "inline-block", cursor: "pointer" }}>
          {uploadingPhoto ? "Uploading…" : "Upload photo"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handlePhoto} disabled={uploadingPhoto} style={{ display: "none" }} />
        </label>
        <span className="field-note" style={{ marginLeft: "0.6rem" }}>PNG, JPEG, WebP or SVG, up to 2MB.</span>
      </section>

      <section className="question-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Resume</h2>
        {profile.resumeUrl ? (
          <p>
            <a href={`${API_ORIGIN}${profile.resumeUrl}`} target="_blank" rel="noreferrer">
              View current resume
            </a>
          </p>
        ) : (
          <p className="field-note">No resume uploaded yet.</p>
        )}
        <label className="small-button" style={{ display: "inline-block", cursor: "pointer" }}>
          {uploadingResume ? "Uploading…" : "Upload resume"}
          <input type="file" accept="application/pdf" onChange={handleResume} disabled={uploadingResume} style={{ display: "none" }} />
        </label>
        <span className="field-note" style={{ marginLeft: "0.6rem" }}>PDF only, up to 5MB.</span>
      </section>

      <section className="question-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Profile details</h2>
        <form onSubmit={saveProfile}>
          <label>
            Name
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={2} />
          </label>
          <label>
            Headline
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. JAMB Mathematics tutor, 8 years' experience" />
          </label>
          <label>
            Bio
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} style={{ width: "100%", marginTop: "0.4rem" }} />
          </label>
          <button type="submit" className="small-button" disabled={saving} style={{ marginTop: "0.6rem" }}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section className="question-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Areas of specialization</h2>
        <p className="field-note">
          Add the exams and, optionally, specific topics you tutor. Students whose weak topics match get suggested your profile.
        </p>
        {profile.specializations.length > 0 ? (
          <table className="data-table" style={{ marginBottom: "1rem" }}>
            <thead>
              <tr>
                <th>Exam</th>
                <th>Topic</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {profile.specializations.map((s) => (
                <tr key={s.id}>
                  <td>{s.exam.title}</td>
                  <td>{s.topicKeyword ?? "Any topic"}</td>
                  <td>
                    <button type="button" className="small-button" onClick={() => handleRemoveSpecialization(s.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="field-note">No specializations added yet.</p>
        )}
        <form onSubmit={handleAddSpecialization}>
          <div className="inline-form">
            <label>
              Exam
              <select value={examSlug} onChange={(e) => setExamSlug(e.target.value)}>
                {exams.map((exam) => (
                  <option key={exam.slug} value={exam.slug}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Topic (optional)
              <input value={topicKeyword} onChange={(e) => setTopicKeyword(e.target.value)} placeholder="e.g. Mathematics" />
            </label>
            <button type="submit" disabled={addingSpec || !examSlug}>
              {addingSpec ? "Adding…" : "Add specialization"}
            </button>
          </div>
        </form>
      </section>

      <section className="question-card">
        <h2 style={{ marginTop: 0 }}>Submit for review</h2>
        {missing.length > 0 ? (
          <p className="field-note">Before you can submit, add: {missing.join(", ")}.</p>
        ) : null}
        <button type="button" className="btn btn-primary" disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "Submitting…" : "Submit for review"}
        </button>
      </section>
    </div>
  );
}

export default function TutorPage() {
  return <TutorGate>{(token) => <TutorDashboard token={token} />}</TutorGate>;
}
