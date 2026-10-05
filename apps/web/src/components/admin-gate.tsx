"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";

// Client-side convenience only: every admin API endpoint enforces the ADMIN
// role on the server, so hiding these pages is a courtesy, not the security.
export function AdminGate({ children }: { children: (token: string) => ReactNode }) {
  const router = useRouter();
  const { ready, token, user } = useAuth();

  useEffect(() => {
    if (ready && !token) router.push("/login");
  }, [ready, token, router]);

  if (!ready || !token || !user) {
    return (
      <div className="admin-main">
        <p>Loading…</p>
      </div>
    );
  }
  if (user.role !== "ADMIN") {
    return (
      <div className="admin-main">
        <p role="alert">This area is for administrators only.</p>
        <p className="page-nav">
          <Link href="/">Back to catalogue</Link>
        </p>
      </div>
    );
  }
  return <>{children(token)}</>;
}
