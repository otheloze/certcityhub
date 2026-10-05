"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { fetchWallet } from "../lib/api-client";
import { BrandName } from "./brand-mark";

type Theme = "system" | "light" | "dark";
const THEME_KEY = "prepdeck.theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, token, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsUnlimited, setCreditsUnlimited] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY) as Theme | null;
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        applyTheme(saved);
      }
    } catch {
      // storage unavailable: keep following the OS
    }
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!ready || !token) {
      setCredits(null);
      return;
    }
    let cancelled = false;
    fetchWallet(token)
      .then((w) => {
        if (cancelled) return;
        setCredits(w.total);
        setCreditsUnlimited(w.unlimited);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [ready, token, pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function cycleTheme() {
    const next: Theme = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
    setTheme(next);
    applyTheme(next);
    try {
      if (next === "system") window.localStorage.removeItem(THEME_KEY);
      else window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore
    }
  }

  const link = (href: string, label: string) => (
    <Link href={href} aria-current={pathname === href || (href !== "/" && pathname.startsWith(href)) ? "page" : undefined}>
      {label}
    </Link>
  );

  return (
    <header className={"site-header" + (open ? " open" : "")}>
      <div className="container site-header-inner">
        <Link href="/" className="brand" aria-label="Home">
          <BrandName />
        </Link>

        <nav className="nav" aria-label="Main">
          {link("/exams", "Exams")}
          {link("/pricing", "Pricing")}
          {user ? link("/dashboard", "Dashboard") : null}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={cycleTheme}
            aria-label={`Theme: ${theme}. Click to change.`}
            title={`Theme: ${theme}`}
          >
            {theme === "dark" ? "☾ Dark" : theme === "light" ? "☀ Light" : "◐ Auto"}
          </button>
          {ready && user ? (
            <>
              <Link href="/wallet" className="credit-pill" title="Exam attempts remaining">
                {credits === null ? "…" : creditsUnlimited ? "Unlimited" : credits} attempt
                {creditsUnlimited || credits === 1 ? "" : "s"}
              </Link>
              <div className="menu-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="avatar"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Account menu"
                >
                  {user.email.charAt(0).toUpperCase()}
                </button>
                {menuOpen ? (
                  <div className="menu" role="menu">
                    <div className="menu-email">{user.email}</div>
                    <Link href="/dashboard">Dashboard</Link>
                    <Link href="/wallet">Wallet &amp; attempts</Link>
                    {user.role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
                    {user.role === "ORG_ADMIN" ? <Link href="/org">Organization</Link> : null}
                    {user.role === "TUTOR" ? <Link href="/tutor">Tutor profile</Link> : null}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        router.push("/");
                      }}
                    >
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : ready ? (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Get started free
              </Link>
            </>
          ) : null}
        </div>

        <button type="button" className="menu-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "✕" : "☰"}
        </button>
      </div>
    </header>
  );
}
