"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await login(email, password);
      setSession(response.accessToken, response.user);
      router.push(
        response.user.role === "ORG_ADMIN" ? "/org" : response.user.role === "TUTOR" ? "/tutor" : "/dashboard",
      );
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Could not reach the server. Please try again in a moment.");
      }
    }
  }

  return (
    <div className="container auth-wrap">
      <div>
        <span className="eyebrow">Welcome back</span>
        <h1>Pick up where you left off</h1>
        <p className="lead">Your scores, weak topics and attempt credits are waiting.</p>
        <ul className="check-list" style={{ marginTop: "1.25rem" }}>
          <li>Continue with a recommended practice session</li>
          <li>Review the answers from your last exam</li>
          <li>See how your readiness is trending</li>
        </ul>
      </div>

      <div className="card auth-card">
        <h2>Log in</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", marginBottom: 0, fontSize: "0.92rem" }}>
          New here? <Link href="/register">Create a free account</Link>
        </p>
      </div>
    </div>
  );
}
