"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

// A live exam/practice session (/attempts/<id>) is deliberately chrome-free:
// no navigation, no distractions. Everything else gets the normal shell.
const FOCUS_MODE = /^\/attempts\/[^/]+\/?$/;

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (FOCUS_MODE.test(pathname)) {
    return <>{children}</>;
  }
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
