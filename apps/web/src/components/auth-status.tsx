"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth-context";

export function AuthStatus() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <p className="page-nav">
        <Link href="/login">Log in</Link> · <Link href="/register">Register</Link>
      </p>
    );
  }

  return (
    <p className="page-nav">
      Signed in as {user.email} ({user.role.toLowerCase()}) · <Link href="/wallet">Wallet</Link>
      {user.role === "ADMIN" ? (
        <>
          {" "}
          · <Link href="/admin">Admin</Link>
        </>
      ) : null}{" "}
      ·{" "}
      <button type="button" onClick={logout} className="link-button">
        Log out
      </button>
    </p>
  );
}
