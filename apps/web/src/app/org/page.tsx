"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { OrgGate } from "../../components/org-gate";
import { API_ORIGIN } from "../../lib/api-client";
import { OrgProfile, fetchMyOrg, updateMyOrg, uploadOrgLogo } from "../../lib/org-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

function OrgDashboard({ token }: { token: string }) {
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [mission, setMission] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    fetchMyOrg(token)
      .then((o) => {
        setOrg(o);
        setMission(o.missionStatement ?? "");
      })
      .catch((err) => setError(errorText(err)));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveMission(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const updated = await updateMyOrg(token, { missionStatement: mission });
      setOrg(updated ? { ...org!, ...updated } : org);
      setMessage("Mission statement saved.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    setUploading(true);
    try {
      const updated = await uploadOrgLogo(token, file);
      setOrg(updated);
      setMessage("Logo updated.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (!org) {
    return (
      <div className="admin-main">
        <p>{error ?? "Loading your organization…"}</p>
      </div>
    );
  }

  return (
    <div className="admin-main">
      <h1>{org.name}</h1>
      <p className="field-note">Organization dashboard</p>
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      <div className="stats-strip" style={{ margin: "1.25rem 0" }}>
        <div className="stat">
          <div className="stat-value">{org.memberCount}</div>
          <div className="stat-label">
            Active members · <Link href="/org/members">manage</Link>
          </div>
        </div>
        <div className="stat">
          <div className="stat-value">{org.examCount}</div>
          <div className="stat-label">
            Custom exams · <Link href="/org/exams">manage</Link>
          </div>
        </div>
        <div className="stat">
          <div className="stat-value">{org.allowedExamSlugs.length}</div>
          <div className="stat-label">Grantable shared exams</div>
        </div>
      </div>

      <section className="question-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Logo</h2>
        {org.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_ORIGIN}${org.logoUrl}`}
            alt={`${org.name} logo`}
            style={{ maxHeight: 96, maxWidth: 240, display: "block", marginBottom: "0.75rem", borderRadius: 8 }}
          />
        ) : (
          <p className="field-note">No logo uploaded yet.</p>
        )}
        <label className="small-button" style={{ display: "inline-block", cursor: "pointer" }}>
          {uploading ? "Uploading…" : "Upload logo"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogo} disabled={uploading} style={{ display: "none" }} />
        </label>
        <span className="field-note" style={{ marginLeft: "0.6rem" }}>PNG, JPEG, WebP or SVG, up to 2MB.</span>
      </section>

      <section className="question-card">
        <h2 style={{ marginTop: 0 }}>Mission statement</h2>
        <form onSubmit={saveMission}>
          <label>
            Shown to your members and, where relevant, on your organization's pages.
            <textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={4}
              maxLength={2000}
              style={{ width: "100%", marginTop: "0.4rem" }}
            />
          </label>
          <button type="submit" className="small-button" disabled={saving} style={{ marginTop: "0.6rem" }}>
            {saving ? "Saving…" : "Save mission statement"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function OrgPage() {
  return <OrgGate>{(token) => <OrgDashboard token={token} />}</OrgGate>;
}
