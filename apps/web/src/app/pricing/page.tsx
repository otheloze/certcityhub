import Link from "next/link";
import { fetchExamCatalogue, fetchProducts, formatPrice } from "../../lib/api-client";

export const metadata = { title: "Pricing" };

const FAQ = [
  { q: "Is there a subscription?", a: "No. Every plan is a one-off purchase (Basic is free). There is no monthly fee and nothing renews automatically." },
  { q: "What uses an attempt?", a: "Starting a full, timed exam simulation uses one attempt. Practice sessions, results, answer reviews and browsing never do." },
  { q: "Do attempts expire?", a: "Every plan's attempts are valid for 90 days from purchase (or from signup, for Basic)." },
  { q: "What if my connection drops mid-exam?", a: "The attempt keeps running against the server clock. If something went wrong, contact an administrator, who can refund the attempt and record the reason." },
  { q: "What is the Basic plan?", a: "Every new account gets 1 free attempt automatically at signup, valid for 90 days. It's limited to about a quarter of the exam's questions so you can try the format before buying a full-length plan." },
];

export default async function PricingPage() {
  const [products, exams] = await Promise.all([fetchProducts().catch(() => []), fetchExamCatalogue().catch(() => [])]);
  const examTitle = (id: string | null) => exams.find((e) => e.id === id)?.title ?? "One exam";
  const sorted = [...products].sort((a, b) => a.priceCents - b.priceCents);
  // Best-value is a per-attempt-price race - a $0 plan trivially "wins" it,
  // and an unlimited plan's large placeholder credit count trivially wins it
  // too, so both are excluded from the comparison.
  const paidOnly = sorted.filter((p) => p.priceCents > 0 && !p.unlimited);
  const bestValue = paidOnly.length ? [...paidOnly].sort((a, b) => a.priceCents / a.credits - b.priceCents / b.credits)[0] : null;

  return (
    <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
      <div className="section-head" style={{ margin: "0 auto 2rem", textAlign: "center" }}>
        <span className="eyebrow">Pricing</span>
        <h1>Free to start. Pay per exam attempt.</h1>
        <p className="lead">No subscription. Choose the plan that fits how much you want to practise.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "2.5rem" }}>
        {sorted.map((p) => {
          const isFree = p.priceCents === 0;
          const isBest = bestValue?.id === p.id;
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
                {formatPrice(p.priceCents, p.currency)}
                <small>{isFree ? " forever" : " one-off"}</small>
              </div>
              {!p.unlimited ? (
                <p style={{ margin: 0, fontSize: "0.88rem" }}>{formatPrice(Math.round(p.priceCents / p.credits), p.currency)} per attempt</p>
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

      <div className="container-narrow faq" id="faq" style={{ padding: 0 }}>
        <h2>Pricing questions</h2>
        {FAQ.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
