// Structural validator for the seeded question banks. Run: npx ts-node prisma/validate-banks.ts
import { LANGUAGE_EXAMS } from "./seed-language-exams";
import { CLOUD_EXAMS } from "./seed-cloud-exams";

let problems = 0;
const fail = (msg: string) => {
  problems += 1;
  console.log("  PROBLEM:", msg);
};

// Real objective question counts per sitting, used for the "at least 2x" requirement.
const REAL_COUNTS: Record<string, number> = {
  "toefl-ibt-practice": 48,
  "ielts-academic-practice": 80,
  "act-practice": 171,
  "cambridge-c1-advanced": 86,
  "cambridge-c2-proficiency": 83,
};

for (const exam of [...LANGUAGE_EXAMS, ...CLOUD_EXAMS.filter((e) => e.slug === "aws-solutions-architect-associate")]) {
  const all = exam.topics.flatMap((t) => t.questions.map((q) => ({ topic: t.title, q })));
  console.log(`${exam.slug}: ${all.length} questions`);
  const real = REAL_COUNTS[exam.slug];
  if (real && all.length < real * 2) fail(`only ${all.length} questions, need >= ${real * 2}`);
  if (exam.blueprint && exam.blueprint.questionCount > all.length) fail("blueprint larger than bank");

  const seen = new Set<string>();
  for (const { topic, q } of all) {
    const id = `[${topic}] ${(q.passage ?? "").slice(0, 30)} | ${q.stem.slice(0, 70)}`;
    const key = `${q.passage ?? ""}||${q.stem}`;
    if (seen.has(key)) fail(`duplicate question: ${id}`);
    seen.add(key);

    if (q.type === "SINGLE_CHOICE" || q.type === "TRUE_FALSE") {
      const correct = (q.options ?? []).filter((o) => o.isCorrect).length;
      if (correct !== 1) fail(`${correct} correct options: ${id}`);
    } else if (q.type === "MULTIPLE_CHOICE") {
      const correct = (q.options ?? []).filter((o) => o.isCorrect).length;
      if (correct < 2) fail(`multi-select with ${correct} correct: ${id}`);
    } else if (q.type === "SHORT_ANSWER") {
      const acc = (q.answerSchema as { acceptedAnswers?: string[] }).acceptedAnswers;
      if (!acc || acc.length === 0 || acc.some((a) => !a.trim())) fail(`bad accepted answers: ${id}`);
    }
    if (q.options) {
      const texts = q.options.map((o) => o.text.trim().toLowerCase());
      if (new Set(texts).size !== texts.length) fail(`duplicate option text: ${id}`);
      if (texts.some((t) => !t)) fail(`empty option: ${id}`);
      if (q.options.length < 2 || q.options.length > 6) fail(`option count ${q.options.length}: ${id}`);
    }
    if (!q.explanation.trim()) fail(`missing explanation: ${id}`);
  }
}

console.log(problems === 0 ? "\nAll checks passed." : `\n${problems} problem(s) found.`);
process.exit(problems === 0 ? 0 : 1);
