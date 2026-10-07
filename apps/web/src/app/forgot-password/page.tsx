"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { requestPasswordReset, ApiError } from "../../lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setError("Could not reach the server. Please try again in a moment.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container auth-wrap">
      <div>
        <span className="eyebrow">Account recovery</span>
        <h1>Forgot your password?</h1>
        <p className="lead">Enter the email you signed up with and we&apos;ll send you a reset code.</p>
      </div>

      <div className="card auth-card">
        <h2>Forgot password</h2>
        {sent ? (
          <>
            <p className="notice">If an account exists for that email, a reset code has been sent.</p>
            <p style={{ marginTop: "1rem", marginBottom: 0, fontSize: "0.92rem" }}>
              <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>I have my code →</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            {error ? <p role="alert">{error}</p> : null}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Sending…" : "Send reset code"}
            </button>
          </form>
        )}
        <p style={{ marginTop: "1rem", marginBottom: 0, fontSize: "0.92rem" }}>
          <Link href="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
