"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, registerOrganization, registerTutor, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

type AccountType = "individual" | "organization" | "teacher";

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [organizationName, setOrganizationName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (accountType === "organization") {
        const response = await registerOrganization(organizationName, email, password);
        setSession(response.accessToken, response.user);
        router.push("/org");
      } else if (accountType === "teacher") {
        const response = await registerTutor(displayName, email, password);
        setSession(response.accessToken, response.user);
        router.push("/tutor");
      } else {
        const response = await register(email, password);
        setSession(response.accessToken, response.user);
        router.push("/exams");
      }
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 409) {
        setError("That email is already registered. Try logging in instead.");
      } else if (err instanceof ApiError && err.status === 0) {
        setError("Could not reach the server. Please try again in a moment.");
      } else {
        setError("Could not create your account. Check your details and try again.");
      }
    }
  }

  return (
    <div className="container auth-wrap">
      <div>
        <span className="eyebrow">Free to start</span>
        <h1>Create your account</h1>
        <p className="lead">
          {accountType === "organization"
            ? "Set up your organization, then provision member accounts and grant them exam access from your own dashboard."
            : accountType === "teacher"
              ? "Build a verified tutor profile, and get suggested to students whose exam results show they need help in your subject."
              : "Free-plan attempts are included, and practice is unlimited. No card needed."}
        </p>
        <ul className="check-list" style={{ marginTop: "1.25rem" }}>
          {accountType === "organization" ? (
            <>
              <li>A dashboard to manage your members and their exam access</li>
              <li>Unlimited attempts on JAMB and WAEC for members you grant access to</li>
              <li>Upload your logo and write a mission statement</li>
              <li>Build your own private, custom exams over time</li>
            </>
          ) : accountType === "teacher" ? (
            <>
              <li>A public profile with your photo, resume and specializations</li>
              <li>Reviewed by our team before you go live, for students' trust</li>
              <li>Suggested to students automatically when your subject matches their weak topics</li>
              <li>No booking or payment handled here — students contact you directly</li>
            </>
          ) : (
            <>
              <li>Unlimited practice with instant feedback</li>
              <li>Free-plan exam simulation attempts</li>
              <li>Topic-level progress and a next-step recommendation</li>
              <li>Buy attempts only if you want more full simulations</li>
            </>
          )}
        </ul>
      </div>

      <div className="card auth-card">
        <h2>Sign up</h2>
        <div className="chip-row" style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            className={"chip" + (accountType === "individual" ? " chip-active" : "")}
            onClick={() => setAccountType("individual")}
          >
            Individual
          </button>
          <button
            type="button"
            className={"chip" + (accountType === "organization" ? " chip-active" : "")}
            onClick={() => setAccountType("organization")}
          >
            Organization
          </button>
          <button
            type="button"
            className={"chip" + (accountType === "teacher" ? " chip-active" : "")}
            onClick={() => setAccountType("teacher")}
          >
            Teacher
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {accountType === "organization" ? (
            <label>
              Organization name
              <input
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                autoComplete="organization"
                required
                minLength={2}
              />
            </label>
          ) : null}
          {accountType === "teacher" ? (
            <label>
              Your name
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                required
                minLength={2}
              />
              <span className="field-note">Shown on your public tutor profile once approved.</span>
            </label>
          ) : null}
          <label>
            {accountType === "organization" ? "Administrator email" : "Email"}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <span className="field-note">At least 8 characters.</span>
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy
              ? "Creating account…"
              : accountType === "organization"
                ? "Create organization account"
                : accountType === "teacher"
                  ? "Create tutor account"
                  : "Create free account"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", marginBottom: 0, fontSize: "0.92rem" }}>
          Already registered? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
