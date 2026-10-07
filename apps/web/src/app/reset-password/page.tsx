"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { confirmPasswordReset, ApiError } from "../../lib/api-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("email");
    if (fromQuery) setEmail(fromQuery);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await confirmPasswordReset(email, code, newPassword);
      router.push("/login?reset=success");
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 0) {
        setError("Could not reach the server. Please try again in a moment.");
      } else {
        setError("Invalid or expired code. Please try again or request a new code.");
      }
    }
  }

  return (
    <div className="container auth-wrap">
      <div>
        <span className="eyebrow">Account recovery</span>
        <h1>Reset your password</h1>
        <p className="lead">Enter the 6-digit code we emailed you, along with your new password.</p>
      </div>

      <div className="card auth-card">
        <h2>Reset password</h2>
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
          <label>
            Reset code
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoComplete="one-time-code"
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Resetting…" : "Reset password"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", marginBottom: 0, fontSize: "0.92rem" }}>
          <Link href="/forgot-password">Request a new code</Link>
        </p>
      </div>
    </div>
  );
}
