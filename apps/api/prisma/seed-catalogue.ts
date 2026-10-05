import { ExamVersionStatus, PrismaClient, QuestionStatus } from "@prisma/client";
import { randomUUID } from "crypto";

// Original practice content written for this platform. It is NOT taken from,
// affiliated with, or endorsed by any exam body or vendor named below.
// Adding another exam is just another entry here (or the admin UI) - no code.

import { ExamSeed, mc, multi, num, tf } from "./seed-helpers";
import { JAMB_USE_OF_ENGLISH, JAMB_MATHEMATICS, JAMB_BIOLOGY } from "./bank-jamb-utme";
import { WASSCE_ENGLISH_LANGUAGE, WASSCE_CORE_MATHEMATICS, WASSCE_PHYSICS } from "./bank-waec-wassce";
import { SAT_READING_WRITING, SAT_ALGEBRA, SAT_PROBLEM_SOLVING_DATA_ANALYSIS } from "./bank-sat";
import { ALEVEL_ALGEBRA_FUNCTIONS, ALEVEL_CALCULUS, ALEVEL_STATISTICS } from "./bank-a-level-maths";
import { CLF_CLOUD_CONCEPTS, CLF_SECURITY_COMPLIANCE, CLF_CLOUD_TECHNOLOGY_SERVICES } from "./bank-aws-cloud-practitioner";
import { AZ900_CLOUD_CONCEPTS, AZ900_CORE_SERVICES, AZ900_IDENTITY_GOVERNANCE_COST } from "./bank-azure-fundamentals";
import { GENAI_BASICS, GENAI_PROMPTING, GENAI_RESPONSIBLE_AI } from "./bank-genai-fundamentals";
import { CCNA_NETWORK_FUNDAMENTALS, CCNA_IP_ADDRESSING, CCNA_SECURITY_FUNDAMENTALS } from "./bank-cisco-ccna";
import { SECPLUS_GENERAL_CONCEPTS, SECPLUS_THREATS_VULNERABILITIES, SECPLUS_SECURITY_OPERATIONS } from "./bank-comptia-security-plus";
import { CLOUD_EXAMS } from "./seed-cloud-exams";
import { AI_EXAMS } from "./seed-ai-exams";
import { GENERAL_EXAMS } from "./seed-general-exams";
import { IT_EXAMS } from "./seed-it-exams";
import { LANGUAGE_EXAMS } from "./seed-language-exams";

const EXAMS: ExamSeed[] = [
  {
    slug: "jamb-utme",
    title: "JAMB UTME Practice",
    shortCode: "JAMB",
    provider: "Independent practice",
    level: "University entrance",
    category: "School & University",
    sortOrder: 1,
    durationMinutes: 20,
    description:
      "JAMB UTME-style practice across English, Mathematics and Biology. Independent content, not affiliated with or endorsed by JAMB.",
    blueprint: { questionCount: 135, randomize: true },
    topics: [
      { title: "Use of English", questions: JAMB_USE_OF_ENGLISH },
      { title: "Mathematics", questions: JAMB_MATHEMATICS },
      { title: "Biology", questions: JAMB_BIOLOGY },
    ],
  },
  {
    slug: "waec-wassce",
    title: "WAEC WASSCE Practice",
    shortCode: "WASSCE",
    provider: "Independent practice",
    level: "Secondary school",
    category: "School & University",
    sortOrder: 2,
    durationMinutes: 20,
    description:
      "WASSCE-style practice in English Language, Core Mathematics and Physics. Independent content, not affiliated with or endorsed by WAEC.",
    blueprint: { questionCount: 127, randomize: true },
    topics: [
      { title: "English Language", questions: WASSCE_ENGLISH_LANGUAGE },
      { title: "Core Mathematics", questions: WASSCE_CORE_MATHEMATICS },
      { title: "Physics", questions: WASSCE_PHYSICS },
    ],
  },
  {
    slug: "sat-practice",
    title: "SAT Practice",
    shortCode: "SAT",
    provider: "Independent practice",
    level: "College admissions",
    category: "School & University",
    sortOrder: 3,
    durationMinutes: 25,
    description:
      "SAT-style practice in Reading & Writing, Algebra and Data Analysis. Independent content, not affiliated with or endorsed by the College Board.",
    blueprint: { questionCount: 77, randomize: true },
    topics: [
      { title: "Reading & Writing", questions: SAT_READING_WRITING },
      { title: "Algebra", questions: SAT_ALGEBRA },
      { title: "Problem-Solving & Data Analysis", questions: SAT_PROBLEM_SOLVING_DATA_ANALYSIS },
    ],
  },
  {
    slug: "a-level-maths",
    title: "A-Level Mathematics Practice",
    shortCode: "A-LVL",
    provider: "Independent practice",
    level: "Pre-university",
    category: "School & University",
    sortOrder: 4,
    durationMinutes: 25,
    description:
      "A-Level Mathematics-style practice covering algebra, calculus and statistics. Independent content, not affiliated with any exam board.",
    blueprint: { questionCount: 70, randomize: true },
    topics: [
      { title: "Algebra & Functions", questions: ALEVEL_ALGEBRA_FUNCTIONS },
      { title: "Calculus", questions: ALEVEL_CALCULUS },
      { title: "Statistics", questions: ALEVEL_STATISTICS },
    ],
  },
  {
    slug: "aws-cloud-practitioner",
    title: "AWS Cloud Practitioner Practice",
    shortCode: "CLF-C02",
    provider: "Amazon Web Services (unofficial)",
    level: "Foundational",
    category: "Cloud",
    sortOrder: 5,
    durationMinutes: 20,
    description:
      "Practice questions in the style of AWS Certified Cloud Practitioner (CLF-C02). Independent content, not affiliated with or endorsed by Amazon Web Services.",
    blueprint: { questionCount: 64, randomize: true },
    topics: [
      { title: "Cloud Concepts", questions: CLF_CLOUD_CONCEPTS },
      { title: "Security & Compliance", questions: CLF_SECURITY_COMPLIANCE },
      { title: "Cloud Technology & Services", questions: CLF_CLOUD_TECHNOLOGY_SERVICES },
    ],
  },
  {
    slug: "azure-fundamentals",
    title: "Azure Fundamentals Practice",
    shortCode: "AZ-900",
    provider: "Microsoft Azure (unofficial)",
    level: "Foundational",
    category: "Cloud",
    sortOrder: 6,
    durationMinutes: 20,
    description:
      "Practice questions in the style of Microsoft Azure Fundamentals (AZ-900). Independent content, not affiliated with or endorsed by Microsoft.",
    blueprint: { questionCount: 50, randomize: true },
    topics: [
      { title: "Cloud Concepts", questions: AZ900_CLOUD_CONCEPTS },
      { title: "Azure Core Services", questions: AZ900_CORE_SERVICES },
      { title: "Identity, Governance & Cost", questions: AZ900_IDENTITY_GOVERNANCE_COST },
    ],
  },
  {
    slug: "generative-ai-fundamentals",
    title: "Claude & Generative AI Fundamentals",
    shortCode: "GENAI",
    provider: "Independent practice",
    level: "Foundational",
    category: "AI",
    sortOrder: 7,
    durationMinutes: 20,
    description:
      "Unofficial practice on generative AI fundamentals, prompting and responsible use. This is not an Anthropic certification and is not affiliated with or endorsed by Anthropic.",
    blueprint: { questionCount: 45, randomize: true },
    topics: [
      { title: "Generative AI Basics", questions: GENAI_BASICS },
      { title: "Prompting", questions: GENAI_PROMPTING },
      { title: "Responsible AI", questions: GENAI_RESPONSIBLE_AI },
    ],
  },
  {
    slug: "cisco-ccna",
    title: "Cisco CCNA Practice",
    shortCode: "200-301",
    provider: "Cisco (unofficial)",
    level: "Associate",
    category: "IT",
    sortOrder: 8,
    durationMinutes: 20,
    description:
      "Practice questions in the style of the Cisco CCNA (200-301). Independent content, not affiliated with or endorsed by Cisco.",
    blueprint: { questionCount: 80, randomize: true },
    topics: [
      {
        title: "Network Fundamentals",
        questions: CCNA_NETWORK_FUNDAMENTALS,
      },
      {
        title: "IP Addressing",
        questions: CCNA_IP_ADDRESSING,
      },
      {
        title: "Security Fundamentals",
        questions: CCNA_SECURITY_FUNDAMENTALS,
      },
    ],
  },
  {
    slug: "comptia-security-plus",
    title: "CompTIA Security+ Practice",
    shortCode: "SY0-701",
    provider: "CompTIA (unofficial)",
    level: "Core",
    category: "IT",
    sortOrder: 9,
    durationMinutes: 20,
    description:
      "Practice questions in the style of CompTIA Security+ (SY0-701). Independent content, not affiliated with or endorsed by CompTIA.",
    blueprint: { questionCount: 60, randomize: true },
    topics: [
      { title: "General Security Concepts", questions: SECPLUS_GENERAL_CONCEPTS },
      { title: "Threats & Vulnerabilities", questions: SECPLUS_THREATS_VULNERABILITIES },
      { title: "Security Operations", questions: SECPLUS_SECURITY_OPERATIONS },
    ],
  },
];

// Retired by the 4-tier pricing structure (Basic/Silver/Gold/Premium,
// seeded in seed.ts) - deactivated below, not deleted, so historical
// Purchase/CreditLot rows keep their FK intact.
const RETIRED_PRODUCT_CODES = ["ALL-5", "ALL-10"];

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function seedCatalogue(prisma: PrismaClient, adminId: string) {
  let questionTotal = 0;

  const allExams = [...EXAMS, ...CLOUD_EXAMS, ...AI_EXAMS, ...GENERAL_EXAMS, ...IT_EXAMS, ...LANGUAGE_EXAMS];
  for (const spec of allExams) {
    const exam = await prisma.exam.upsert({
      where: { slug: spec.slug },
      update: {
        title: spec.title,
        description: spec.description,
        category: spec.category,
        shortCode: spec.shortCode,
        provider: spec.provider,
        level: spec.level,
        sortOrder: spec.sortOrder,
      },
      create: {
        slug: spec.slug,
        title: spec.title,
        description: spec.description,
        category: spec.category,
        shortCode: spec.shortCode,
        provider: spec.provider,
        level: spec.level,
        sortOrder: spec.sortOrder,
      },
    });

    let version = await prisma.examVersion.findUnique({
      where: { examId_versionLabel: { examId: exam.id, versionLabel: "2026-v1" } },
    });
    if (!version) {
      version = await prisma.examVersion.create({
        data: {
          examId: exam.id,
          versionLabel: "2026-v1",
          status: ExamVersionStatus.PUBLISHED,
          publishedAt: new Date(),
          config: {
            durationSeconds: spec.durationMinutes * 60,
            navigation: { allowBackNavigation: true, allowAnswerChanges: true, allowMarkForReview: true },
            scoringStrategy: { type: "PERCENTAGE" },
            ...(spec.blueprint ? { blueprint: spec.blueprint } : {}),
          },
        },
      });
    } else if (spec.blueprint) {
      // Seed-level content migration: large banks need a sampled blueprint and a longer clock.
      const current = (version.config ?? {}) as Record<string, unknown>;
      await prisma.examVersion.update({
        where: { id: version.id },
        data: {
          config: { ...current, durationSeconds: spec.durationMinutes * 60, blueprint: spec.blueprint } as any,
        },
      });
    }

    for (const [topicIndex, topicSpec] of spec.topics.entries()) {
      const slug = topicSpec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      let topic = await prisma.topic.findFirst({
        where: { examVersionId: version.id, parentId: null, slug },
      });
      if (!topic) {
        topic = await prisma.topic.create({
          data: { examVersionId: version.id, parentId: null, title: topicSpec.title, slug, sortOrder: topicIndex },
        });
      }

      const existingTitles = new Set(
        (
          await prisma.question.findMany({
            where: { examVersionId: version.id, questionTopics: { some: { topicId: topic.id } } },
            select: { title: true },
          })
        ).map((r) => r.title),
      );

      const questionRows: any[] = [];
      const optionRows: any[] = [];
      const linkRows: any[] = [];

      for (const [n, q] of topicSpec.questions.entries()) {
        const title = `${spec.shortCode} - ${topicSpec.title} #${n + 1}`;
        questionTotal += 1;
        if (existingTitles.has(title)) continue;

        const id = randomUUID();
        const stemBlocks: { type: string; text: string }[] = [];
        if (q.passage) stemBlocks.push({ type: "passage", text: q.passage });
        stemBlocks.push({ type: "text", text: q.stem });

        questionRows.push({
          id,
          examId: exam.id,
          examVersionId: version.id,
          type: q.type,
          title,
          stem: { blocks: stemBlocks },
          answerSchema: q.answerSchema as any,
          explanation: { blocks: [{ type: "text", text: q.explanation }] },
          difficulty: q.difficulty,
          estimatedTimeSeconds: 60,
          tags: ["catalogue-seed"],
          status: QuestionStatus.PUBLISHED,
          createdById: adminId,
          updatedById: adminId,
        });
        (q.options ?? []).forEach((o, i) =>
          optionRows.push({
            questionId: id,
            label: o.label,
            content: { blocks: [{ type: "text", text: o.text }] },
            isCorrect: o.isCorrect,
            sortOrder: i,
          }),
        );
        linkRows.push({ questionId: id, topicId: topic.id, isPrimary: true });
      }

      // Batched inserts: a handful of round trips per topic instead of several per question.
      for (const rows of chunk(questionRows, 50)) await prisma.question.createMany({ data: rows });
      for (const rows of chunk(optionRows, 200)) await prisma.questionOption.createMany({ data: rows });
      for (const rows of chunk(linkRows, 200)) await prisma.questionTopic.createMany({ data: rows });
    }
  }

  // updateMany (not upsert) so this safely no-ops on a fresh database that
  // never had these rows to begin with.
  await prisma.product.updateMany({ where: { code: { in: RETIRED_PRODUCT_CODES } }, data: { isActive: false } });

  return { exams: allExams.length, questions: questionTotal };
}
