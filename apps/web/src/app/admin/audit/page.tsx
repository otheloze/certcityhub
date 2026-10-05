"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "../../../components/admin-gate";
import { AuditEntry, adminAuditLogs } from "../../../lib/admin-api";

function AuditTable({ token }: { token: string }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminAuditLogs(token)
      .then(setEntries)
      .catch(() => setError("Could not load the audit log."));
  }, [token]);

  return (
    <div className="admin-main">
      <Link href="/admin" className="back-link">
        ← Administration
      </Link>
      <h1>Audit log</h1>
      {error ? <p role="alert">{error}</p> : null}
      {entries === null && !error ? <p>Loading…</p> : null}
      {entries ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Reason / note</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.createdAt).toLocaleString()}</td>
                <td>{e.action}</td>
                <td>
                  {e.entityType} <small>{e.entityId.slice(0, 8)}</small>
                </td>
                <td>{e.description ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

export default function AdminAuditPage() {
  return <AdminGate>{(token) => <AuditTable token={token} />}</AdminGate>;
}
