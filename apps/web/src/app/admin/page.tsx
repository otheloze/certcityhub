"use client";

import Link from "next/link";
import { AdminGate } from "../../components/admin-gate";
import { API_ORIGIN } from "../../lib/api-client";

export default function AdminHomePage() {
  return (
    <AdminGate>
      {() => (
        <div className="admin-main">
          <Link href="/" className="back-link">
            ← Back to catalogue
          </Link>
          <h1>Administration</h1>
          <div className="admin-grid">
            <Link href="/admin/exams" className="admin-card">
              <strong>Exams &amp; content</strong>
              <span>Create exams and versions, build topic trees, write and publish questions.</span>
            </Link>
            <Link href="/admin/credits" className="admin-card">
              <strong>Credits &amp; pricing</strong>
              <span>Attempt packs and prices, grant or adjust user credits, refund attempts.</span>
            </Link>
            <Link href="/admin/audit" className="admin-card">
              <strong>Audit log</strong>
              <span>Every content and credit change, with who made it and why.</span>
            </Link>
            <Link href="/admin/tutors" className="admin-card">
              <strong>Tutors</strong>
              <span>Review submitted tutor profiles before they go live and are suggested to students.</span>
            </Link>
            <a href={`${API_ORIGIN}/api/docs`} className="admin-card" target="_blank" rel="noreferrer">
              <strong>API reference</strong>
              <span>Full Swagger documentation of every endpoint.</span>
            </a>
          </div>
        </div>
      )}
    </AdminGate>
  );
}
