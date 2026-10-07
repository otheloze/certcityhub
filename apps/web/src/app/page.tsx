import Link from "next/link";
import { fetchCatalogue, fetchProducts, formatPrice, rethrowIfDynamicServerUsage } from "../lib/api-client";
import { ExamCatalogue } from "../components/exam-catalogue";
import { HeroSearch } from "../components/hero-search";
import { SampleQuestion } from "../components/sample-question";

const STEPS = [
  { title: "Learn", text: "Work through questions by topic with instant feedback and clear explanations." },
  { title: "Practice", text: "Build custom sessions by topic, difficulty and length. Free and unlimited." },
  { title: "Simulate", text: "Sit a full, timed exam in a distraction-free environment. The server keeps the clock." },
  { title: "Score", text: "Get a scored result with a per-topic breakdown and a full answer review." },
  { title: "Improve", text: "See your weakest topics and jump straight into a targeted practice session." },
];

const FEATURES = [
  {
    icon: "⏱",
    title: "Exam-realistic simulation",
    text: "Timed attempts with question navigation, mark-for-review, no hints and automatic submission when time is up. The rules come from each exam's own configuration.",
  },
  {
    icon: "◎",
    title: "Know exactly what to fix",
    text: "Every attempt updates your topic-level accuracy. Your dashboard shows weak areas and recommends the next practice session, using clear rules rather than guesswork.",
  },
  {
    icon: "◈",
    title: "Pay per attempt, not per month",
    text: "Practice is free. Full simulations use attempt credits you buy once. No subscription, no auto-renewal, and unused attempts stay yours.",
  },
];

const FAQ = [
  {
    q: "Do I need to pay to start?",
    a: "No. Creating an account gives you free-plan attempts, and Practice mode is free and unlimited. You only buy attempts when you want more full-length simulations.",
  },
  {
    q: "Is this a subscription?",
    a: "No. You buy attempt packs once. There is no monthly charge or auto-renewal. Some packs can expire, and the expiry is shown before you buy.",
  },
  {
    q: "Are these real exam questions?",
    a: "No. All questions are original practice questions written to reflect each exam's topics and style. We do not reproduce real exam papers.",
  },
  {
    q: "What counts as an attempt?",
    a: "Starting a full exam simulation uses one attempt. Practice sessions, viewing results, reviewing answers and browsing are always free.",
  },
];

export default async function HomePage({ searchParams }: { searchParams?: { q?: string } }) {
  const [exams, products] = await Promise.all([
    fetchCatalogue().catch((error) => {
      rethrowIfDynamicServerUsage(error);
      return [];
    }),
    fetchProducts().catch((error) => {
      rethrowIfDynamicServerUsage(error);
      return [];
    }),
  ]);

  const questionTotal = exams.reduce((sum, e) => sum + (e.version?.questionCount ?? 0), 0);
  const topicTotal = exams.reduce((sum, e) => sum + (e.version?.topicCount ?? 0), 0);
  const categoryTotal = new Set(exams.map((e) => e.category)).size;
  // Excludes the $0 Basic plan and unlimited plans - both would trivially
  // "win" the per-attempt price race (the $0 plan on price, the unlimited
  // plan on its large placeholder credit count), which is misleading for a
  // "from $X per attempt" CTA.
  const paidProducts = products.filter((p) => p.priceCents > 0 && !p.unlimited);
  const cheapest = paidProducts.length ? [...paidProducts].sort((a, b) => a.priceCents / a.credits - b.priceCents / b.credits)[0] : null;

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Exam practice &amp; simulation</span>
            <h1>
              Practise like it&rsquo;s <span className="accent">exam day</span>.
            </h1>
            <p className="lead" style={{ maxWidth: 560, marginBottom: "1.5rem" }}>
              Learn, practise and sit timed simulations for JAMB, WAEC, SAT, A-Level, AWS, Azure, Cisco, CompTIA and more &mdash; with
              instant feedback, real scoring and a clear plan for what to improve next.
            </p>
            <HeroSearch />
            <div className="trust-row">
              <span>Free practice, no card needed</span>
              <span>No subscription</span>
              <span>Server-timed simulations</span>
            </div>
          </div>
          <SampleQuestion />
        </div>
      </section>

      <section className="container" style={{ marginTop: "-0.5rem" }}>
        <div className="stats-strip" aria-label="Platform at a glance">
          <div className="stat">
            <div className="stat-value">{exams.length}</div>
            <div className="stat-label">Exams to practise</div>
          </div>
          <div className="stat">
            <div className="stat-value">{categoryTotal}</div>
            <div className="stat-label">Exam categories</div>
          </div>
          <div className="stat">
            <div className="stat-value">{questionTotal}</div>
            <div className="stat-label">Practice questions</div>
          </div>
          <div className="stat">
            <div className="stat-value">{topicTotal}</div>
            <div className="stat-label">Topics tracked</div>
          </div>
        </div>
      </section>

      <section className="section" id="exams">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Choose your exam</span>
            <h2>What are you preparing for?</h2>
            <p>Every exam has its own topics, timing and scoring rules. Pick one to practise for free or sit a full simulation.</p>
          </div>
          <ExamCatalogue exams={exams} initialQuery={searchParams?.q ?? ""} />
        </div>
      </section>

      <section className="section" id="how-it-works" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Learn, practise, simulate, score, improve</h2>
            <p>One loop that gets tighter every time you go round it.</p>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.title} className="step">
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <div className="feature-icon" aria-hidden="true">
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="card spread" style={{ padding: "1.75rem" }}>
            <div style={{ maxWidth: 620 }}>
              <span className="eyebrow">Simple pricing</span>
              <h2 style={{ marginBottom: "0.4rem" }}>Free to practise. Pay only for full simulations.</h2>
              <p style={{ margin: 0 }}>
                {cheapest
                  ? `Attempt packs from ${formatPrice(Math.round(cheapest.priceCents / cheapest.credits), cheapest.currency)} per attempt.`
                  : "Attempt packs are priced by the administrator."}{" "}
                One-off purchase, no subscription.
              </p>
            </div>
            <Link href="/pricing" className="btn btn-primary btn-lg">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-narrow faq">
          <h2>Common questions</h2>
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="card next-step spread" style={{ padding: "2rem" }}>
            <div>
              <h2 style={{ marginBottom: "0.3rem" }}>Ready to find out where you stand?</h2>
              <p style={{ margin: 0 }}>Create a free account and take your first practice session in under a minute.</p>
            </div>
            <Link href="/register" className="btn btn-primary btn-lg">
              Get started free
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
