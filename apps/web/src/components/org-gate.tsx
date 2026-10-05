"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";

// Client-side convenience only: every organization API endpoint enforces
// ORG_ADMIN membership on the server, so hiding these pages is a courtesy,
// not the security. Mirrors AdminGate.
export function OrgGate({ children }: { children: (token: string) => ReactNode }) {
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
  if (user.role !== "ORG_ADMIN") {
    return (
      <div className="admin-main">
        <p role="alert">This area is for organization administrators only.</p>
        <p className="page-nav">
          <Link href="/">Back to catalogue</Link>
        </p>
      </div>
    );
  }
  return <>{children(token)}</>;
}
