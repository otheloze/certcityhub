"use client";

import { useState } from "react";
import Link from "next/link";
import { ExamSummary, Product, formatPrice } from "../lib/api-client";

type Currency = "USD" | "NGN" | "KES";

// Fixed display amounts (not a live FX conversion), stored as pseudo-cents
// to mirror priceCents' unit convention so the same ÷credits per-attempt
// math used for USD works unmodified for these two currencies.
const ALT_PRICES: Record<string, { ngnCents: number; kesCents: number }> = {
  FREE: { ngnCents: 0, kesCents: 0 },
  SILVER: { ngnCents: 350000, kesCents: 30000 },
  GOLD: { ngnCents: 600000, kesCents: 70000 },
  PREMIUM: { ngnCents: 1800000, kesCents: 150000 },
};

function formatAltCurrency(cents: number, currency: "NGN" | "KES"): string {
  const symbol = currency === "NGN" ? "₦" : "Ksh ";
  if (cents === 0) return `${symbol}0.00`;
  return `${symbol}${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function displayPrice(credits: number | null, currency: Currency, code: string, usdFallback: string): string {
  if (currency === "USD") return usdFallback;
  const key = currency === "NGN" ? "ngnCents" : "kesCents";
  const amount = ALT_PRICES[code]?.[key];
  if (amount === undefined) return usdFallback;
  return formatAltCurrency(credits === null ? amount : Math.round(amount / credits), currency);
}

export function PricingCards({
  products,
  exams,
  bestValueId,
}: {
  products: Product[];
  exams: ExamSummary[];
  bestValueId: string | null;
}) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const examTitle = (id: string | null) => exams.find((e) => e.id === id)?.title ?? "One exam";

  return (
    <>
      <label
        style={{
          display: "inline-flex",
          flexDirection: "column",
          gap: "0.35rem",
          maxWidth: 220,
          margin: "0.75rem auto 0",
          textAlign: "left",
          fontWeight: 700,
        }}
      >
        Change currency
        <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
          <option value="USD">USD ($)</option>
          <option value="NGN">NGN (₦)</option>
          <option value="KES">KES (Ksh)</option>
        </select>
      </label>

      <div className="grid grid-3" style={{ marginBottom: "2.5rem", marginTop: "1.5rem" }}>
        {products.map((p) => {
          const isFree = p.priceCents === 0;
          const isBest = bestValueId === p.id;
          return (
            <div key={p.id} className={"card price-card" + (isBest ? " featured" : "")}>
              {isFree ? (
                <span className="badge badge-good" style={{ alignSelf: "flex-start" }}>
                  Included at signup
                </span>
              ) : isBest ? (
                <span className="badge badge-primary" style={{ alignSelf: "flex-start" }}>
                  Best value
                </span>
              ) : (
                <span className="badge" style={{ alignSelf: "flex-start" }}>
                  {p.scopeType === "EXAM" ? examTitle(p.examId) : "All exams"}
                </span>
              )}
              <h2 style={{ margin: 0 }}>{p.name}</h2>
              <div className="price">
                {displayPrice(null, currency, p.code, formatPrice(p.priceCents, p.currency))}
                <small>{isFree ? " forever" : " one-off"}</small>
              </div>
              {!p.unlimited ? (
                <p style={{ margin: 0, fontSize: "0.88rem" }}>
                  {displayPrice(p.credits, currency, p.code, formatPrice(Math.round(p.priceCents / p.credits), p.currency))} per
                  attempt
                </p>
              ) : null}
              <ul className="check-list">
                <li>{p.unlimited ? "Unlimited attempts" : `${p.credits} attempt${p.credits === 1 ? "" : "s"}`}</li>
                <li>{p.questionFraction < 1 ? `About ${Math.round(p.questionFraction * 100)}% of the exam's questions` : "Full exam questions"}</li>
                <li>{p.scopeType === "EXAM" ? `For ${examTitle(p.examId)}` : "Use on any exam"}</li>
                <li>{p.validityDays ? `Valid for ${p.validityDays} days` : "Never expires"}</li>
              </ul>
              <Link
                href={isFree ? "/register" : "/wallet"}
                className={"btn btn-block " + (isBest ? "btn-primary" : "btn-secondary")}
                style={{ marginTop: "auto" }}
              >
                {isFree ? "Create free account" : `Get ${p.name.length > 24 ? "this pack" : p.name}`}
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
