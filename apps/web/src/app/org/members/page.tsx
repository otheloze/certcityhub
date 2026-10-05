"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { OrgGate } from "../../../components/org-gate";
import { OrgMember, addOrgMember, fetchMyOrg, fetchOrgMembers, issueOrgAccess, revokeOrgAccess, revokeOrgMember } from "../../../lib/org-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

function statusLabel(status: string) {
  if (status === "UNUSED") return { text: "Code issued, not yet used", cls: "" };
  if (status === "USED") return { text: "Used", cls: "status-PUBLISHED" };
  return { text: "Revoked", cls: "status-RETIRED" };
}

function OrgMembers({ token }: { token: string }) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [allowedExamSlugs, setAllowedExamSlugs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [adding, setAdding] = useState(false);

  const [accessExam, setAccessExam] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [m, org] = await Promise.all([fetchOrgMembers(token), fetchMyOrg(token)]);
      setMembers(m);
      setAllowedExamSlugs(org.allowedExamSlugs);
    } catch (err) {
      setError(errorText(err));
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setAdding(true);
    try {
      const { temporaryPassword } = await addOrgMember(token, {
        email,
        displayName: displayName || undefined,
        externalRef: externalRef || undefined,
      });
      setMessage(
        `Member added. Temporary password (copy this now, it will not be shown again): ${temporaryPassword}`,
      );
      setEmail("");
      setDisplayName("");
      setExternalRef("");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleIssueAccess(memberId: string) {
    const examSlug = accessExam[memberId] || allowedExamSlugs[0];
    if (!examSlug) return;
    setError(null);
    setMessage(null);
    setBusyId(memberId);
    try {
      const { code } = await issueOrgAccess(token, memberId, examSlug);
      setMessage(`One-time exam code for ${examSlug} (copy this now, it will not be shown again): ${code}`);
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeAccess(codeId: string) {
    setError(null);
    setMessage(null);
    setBusyId(codeId);
    try {
      await revokeOrgAccess(token, codeId);
      setMessage("Access code revoked.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeMember(memberId: string) {
    setError(null);
    setMessage(null);
    setBusyId(memberId);
    try {
      await revokeOrgMember(token, memberId);
      setMessage("Member revoked.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-main">
      <Link href="/org" className="back-link">
        ← Organization
      </Link>
      <h1>Members</h1>
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      <form onSubmit={handleAddMember}>
        <strong>Add a member</strong>
        <div className="inline-form">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Display name
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label>
            Your own reference (optional)
            <input value={externalRef} onChange={(e) => setExternalRef(e.target.value)} placeholder="e.g. student ID" />
          </label>
          <button type="submit" disabled={adding}>
            {adding ? "Adding…" : "Add member"}
          </button>
        </div>
      </form>

      <table className="data-table" style={{ marginTop: "1.5rem" }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Exam access</th>
            <th>Grant access</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>{m.email}</td>
              <td>{m.displayName ?? "–"}</td>
              <td>
                {m.access.length === 0 ? (
                  "–"
                ) : (
                  <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                    {m.access.map((a) => {
                      const label = statusLabel(a.status);
                      return (
                        <li key={a.id}>
                          <span className={"status-pill " + label.cls}>
                            {a.examId} — {label.text}
                          </span>
                          {a.status === "UNUSED" ? (
                            <button
                              type="button"
                              className="small-button"
                              style={{ marginLeft: "0.5rem" }}
                              onClick={() => handleRevokeAccess(a.id)}
                              disabled={busyId === a.id}
                            >
                              {busyId === a.id ? "…" : "Revoke"}
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </td>
              <td>
                <div className="row" style={{ gap: "0.4rem", flexWrap: "nowrap" }}>
                  <select
                    value={accessExam[m.id] ?? allowedExamSlugs[0] ?? ""}
                    onChange={(e) => setAccessExam((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  >
                    {allowedExamSlugs.map((slug) => (
                      <option key={slug} value={slug}>
                        {slug}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="small-button" onClick={() => handleIssueAccess(m.id)} disabled={busyId === m.id}>
                    {busyId === m.id ? "…" : "Issue code"}
                  </button>
                </div>
              </td>
              <td>
                <span className={"status-pill " + (m.status === "ACTIVE" ? "status-PUBLISHED" : "status-RETIRED")}>{m.status}</span>
              </td>
              <td>
                {m.status === "ACTIVE" ? (
                  <button type="button" className="small-button" onClick={() => handleRevokeMember(m.id)} disabled={busyId === m.id}>
                    Revoke
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
          {members.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty">
                No members yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default function OrgMembersPage() {
  return <OrgGate>{(token) => <OrgMembers token={token} />}</OrgGate>;
}
