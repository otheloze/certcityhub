"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "../../../components/admin-gate";
import { ExamSummary, Product, fetchExamCatalogue, formatPrice } from "../../../lib/api-client";
import {
  AdminAttempt,
  AdminUser,
  adminAdjust,
  adminCreateProduct,
  adminGrant,
  adminListProducts,
  adminRefund,
  adminSearchUsers,
  adminUpdateProduct,
  adminUserAttempts,
} from "../../../lib/admin-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

function CreditsAdmin({ token }: { token: string }) {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [attempts, setAttempts] = useState<AdminAttempt[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // grant form
  const [grantCredits, setGrantCredits] = useState(1);
  const [grantScope, setGrantScope] = useState<"GLOBAL" | "EXAM">("GLOBAL");
  const [grantExam, setGrantExam] = useState("");
  const [grantDays, setGrantDays] = useState("");
  const [grantReason, setGrantReason] = useState("");

  // per-lot adjustment + refund reasons
  const [adjust, setAdjust] = useState<Record<string, { amount: string; reason: string }>>({});
  const [refundReason, setRefundReason] = useState("");

  // new product form
  const [p, setP] = useState({
    code: "",
    name: "",
    scopeType: "GLOBAL" as "GLOBAL" | "EXAM",
    examId: "",
    credits: 5,
    price: "9.99",
    validityDays: "",
  });

  const loadProducts = useCallback(() => adminListProducts(token).then(setProducts), [token]);

  useEffect(() => {
    fetchExamCatalogue().then(setExams).catch(() => undefined);
    loadProducts().catch(() => setError("Could not load products."));
  }, [loadProducts]);

  async function runSearch(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    try {
      setUsers(await adminSearchUsers(token, search));
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function selectUser(user: AdminUser) {
    setSelected(user);
    setMessage(null);
    setError(null);
    try {
      setAttempts(await adminUserAttempts(token, user.id));
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function refreshSelected() {
    if (!selected) return;
    const fresh = (await adminSearchUsers(token, selected.email)).find((u) => u.id === selected.id);
    if (fresh) {
      setSelected(fresh);
      setUsers((prev) => prev.map((u) => (u.id === fresh.id ? fresh : u)));
    }
    setAttempts(await adminUserAttempts(token, selected.id));
  }

  async function act(fn: () => Promise<unknown>, success: string) {
    setError(null);
    setMessage(null);
    try {
      await fn();
      setMessage(success);
      await refreshSelected();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function submitGrant(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await act(
      () =>
        adminGrant(token, {
          userId: selected.id,
          credits: grantCredits,
          scopeType: grantScope,
          examId: grantScope === "EXAM" ? grantExam : undefined,
          validityDays: grantDays ? Number(grantDays) : undefined,
          reason: grantReason,
        }),
      `Granted ${grantCredits} attempt(s).`,
    );
    setGrantReason("");
  }

  async function submitProduct(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await adminCreateProduct(token, {
        code: p.code,
        name: p.name,
        scopeType: p.scopeType,
        examId: p.scopeType === "EXAM" ? p.examId : undefined,
        credits: p.credits,
        priceCents: Math.round(Number(p.price) * 100),
        validityDays: p.validityDays ? Number(p.validityDays) : undefined,
      });
      setMessage(`Product ${p.code} created.`);
      setP({ ...p, code: "", name: "" });
      await loadProducts();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function toggleProduct(product: Product) {
    setError(null);
    try {
      await adminUpdateProduct(token, product.id, { isActive: !product.isActive });
      await loadProducts();
    } catch (err) {
      setError(errorText(err));
    }
  }

  const examName = (id: string | null) => exams.find((x) => x.id === id)?.title ?? "—";

  return (
    <div className="admin-main">
      <Link href="/admin" className="back-link">
        ← Administration
      </Link>
      <h1>Credits &amp; pricing</h1>
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      <section className="question-card">
        <h2 style={{ marginTop: 0 }}>Find a user</h2>
        <form onSubmit={runSearch} className="inline-form">
          <label>
            Email contains
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="student@" />
          </label>
          <button type="submit">Search</button>
        </form>
        {users.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Attempts left</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.credits}</td>
                  <td>
                    <button type="button" className="small-button" onClick={() => selectUser(u)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      {selected ? (
        <section className="question-card">
          <h2 style={{ marginTop: 0 }}>
            {selected.email} — {selected.credits} attempts left
          </h2>

          <h3>Credit lots</h3>
          {selected.lots.length === 0 ? <p>No active credits.</p> : null}
          {selected.lots.map((lot) => {
            const draft = adjust[lot.id] ?? { amount: "", reason: "" };
            return (
              <form
                key={lot.id}
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  act(
                    () => adminAdjust(token, lot.id, Number(draft.amount), draft.reason),
                    "Adjustment recorded.",
                  );
                }}
              >
                <span style={{ minWidth: 190 }}>
                  {lot.scopeType === "EXAM" ? examName(lot.examId) : "All exams"} · <strong>{lot.remaining}</strong> left
                </span>
                <label>
                  Change (±)
                  <input
                    type="number"
                    value={draft.amount}
                    onChange={(e) => setAdjust({ ...adjust, [lot.id]: { ...draft, amount: e.target.value } })}
                    required
                  />
                </label>
                <label>
                  Reason
                  <input
                    value={draft.reason}
                    onChange={(e) => setAdjust({ ...adjust, [lot.id]: { ...draft, reason: e.target.value } })}
                    required
                    minLength={3}
                  />
                </label>
                <button type="submit" className="small-button">
                  Adjust
                </button>
              </form>
            );
          })}

          <h3>Grant credits</h3>
          <form onSubmit={submitGrant} className="inline-form">
            <label>
              Attempts
              <input type="number" min={1} value={grantCredits} onChange={(e) => setGrantCredits(Number(e.target.value))} />
            </label>
            <label>
              Applies to
              <select value={grantScope} onChange={(e) => setGrantScope(e.target.value as "GLOBAL" | "EXAM")}>
                <option value="GLOBAL">All exams</option>
                <option value="EXAM">One exam</option>
              </select>
            </label>
            {grantScope === "EXAM" ? (
              <label>
                Exam
                <select value={grantExam} onChange={(e) => setGrantExam(e.target.value)} required>
                  <option value="">Choose…</option>
                  {exams.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              Expires after (days)
              <input type="number" min={1} value={grantDays} onChange={(e) => setGrantDays(e.target.value)} placeholder="never" />
            </label>
            <label>
              Reason (required)
              <input value={grantReason} onChange={(e) => setGrantReason(e.target.value)} required minLength={3} />
            </label>
            <button type="submit">Grant</button>
          </form>

          <h3>Attempts &amp; refunds</h3>
          <label style={{ maxWidth: 360 }}>
            Refund reason
            <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="e.g. connection dropped" />
          </label>
          <table className="data-table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Exam</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Credit</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.startedAt).toLocaleString()}</td>
                  <td>
                    {a.examTitle} ({a.versionLabel})
                  </td>
                  <td>{a.mode}</td>
                  <td>{a.status}</td>
                  <td>{a.refunded ? "Refunded" : a.creditConsumed ? "Used 1" : "None"}</td>
                  <td>
                    {a.creditConsumed && !a.refunded ? (
                      <button
                        type="button"
                        className="small-button"
                        disabled={refundReason.trim().length < 3}
                        onClick={() => act(() => adminRefund(token, a.id, refundReason), "Attempt refunded.")}
                      >
                        Refund
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <h2>Attempt packs (prices are data)</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Applies to</th>
            <th>Attempts</th>
            <th>Price</th>
            <th>Valid</th>
            <th>Exam size</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {products.map((pr) => (
            <tr key={pr.id} style={{ opacity: pr.isActive ? 1 : 0.5 }}>
              <td>{pr.code}</td>
              <td>{pr.name}</td>
              <td>{pr.scopeType === "EXAM" ? examName(pr.examId) : "All exams"}</td>
              <td>{pr.credits}</td>
              <td>{formatPrice(pr.priceCents, pr.currency)}</td>
              <td>{pr.validityDays ? `${pr.validityDays} days` : "Never expires"}</td>
              <td>{pr.questionFraction < 1 ? `${Math.round(pr.questionFraction * 100)}%` : "Full"}</td>
              <td>
                {pr.code !== "FREE" ? (
                  <button type="button" className="small-button secondary-button" onClick={() => toggleProduct(pr)}>
                    {pr.isActive ? "Disable" : "Enable"}
                  </button>
                ) : (
                  <span className="mode-badge">Given at signup</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="question-card" style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginTop: 0 }}>New attempt pack</h3>
        <form onSubmit={submitProduct} className="inline-form">
          <label>
            Code
            <input value={p.code} onChange={(e) => setP({ ...p, code: e.target.value.toUpperCase() })} placeholder="PACK-10" required />
          </label>
          <label>
            Name
            <input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} required />
          </label>
          <label>
            Applies to
            <select value={p.scopeType} onChange={(e) => setP({ ...p, scopeType: e.target.value as "GLOBAL" | "EXAM" })}>
              <option value="GLOBAL">All exams</option>
              <option value="EXAM">One exam</option>
            </select>
          </label>
          {p.scopeType === "EXAM" ? (
            <label>
              Exam
              <select value={p.examId} onChange={(e) => setP({ ...p, examId: e.target.value })} required>
                <option value="">Choose…</option>
                {exams.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            Attempts
            <input type="number" min={1} value={p.credits} onChange={(e) => setP({ ...p, credits: Number(e.target.value) })} />
          </label>
          <label>
            Price (USD)
            <input type="number" min={0} step="0.01" value={p.price} onChange={(e) => setP({ ...p, price: e.target.value })} />
          </label>
          <label>
            Valid (days)
            <input type="number" min={1} value={p.validityDays} onChange={(e) => setP({ ...p, validityDays: e.target.value })} placeholder="never" />
          </label>
          <button type="submit">Create</button>
        </form>
      </section>
    </div>
  );
}

export default function AdminCreditsPage() {
  return <AdminGate>{(token) => <CreditsAdmin token={token} />}</AdminGate>;
}
