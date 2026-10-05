"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/exams?q=${encodeURIComponent(query.trim())}` : "/exams");
  }

  return (
    <form onSubmit={submit} className="search-box" role="search">
      <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What are you preparing for? e.g. SAT, AWS, JAMB…"
        aria-label="Search for your exam"
      />
    </form>
  );
}
