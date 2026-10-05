import { PrismaClient } from "@prisma/client";

// One statement, relying on CASCADE, so FK ordering never needs manual upkeep
// as new tables are added in later sprints.
export async function resetDatabase(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      audit_logs,
      credit_transactions,
      entitlement_credits,
      purchases,
      products,
      answers,
      attempt_questions,
      attempt_snapshots,
      scores,
      attempts,
      question_topics,
      question_options,
      questions,
      topics,
      exam_versions,
      exams,
      users
    RESTART IDENTITY CASCADE;
  `);
}
