import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exam = await prisma.exam.findUnique({ where: { slug: "demo-cert" } });
  if (!exam) {
    console.log("No demo-cert exam found - nothing to do.");
    return;
  }

  const versions = await prisma.examVersion.findMany({ where: { examId: exam.id } });
  const versionIds = versions.map((v) => v.id);

  const attempts = await prisma.attempt.findMany({ where: { examVersionId: { in: versionIds } } });
  const attemptIds = attempts.map((a) => a.id);

  await prisma.$transaction([
    prisma.score.deleteMany({ where: { attemptId: { in: attemptIds } } }),
    prisma.answer.deleteMany({ where: { attemptId: { in: attemptIds } } }),
    prisma.attemptQuestion.deleteMany({ where: { attemptId: { in: attemptIds } } }),
    prisma.attemptSnapshot.deleteMany({ where: { attemptId: { in: attemptIds } } }),
    prisma.attempt.deleteMany({ where: { id: { in: attemptIds } } }),
    prisma.tutorSpecialization.deleteMany({ where: { examId: exam.id } }),
    prisma.organizationExamAccessCode.deleteMany({ where: { examId: exam.id } }),
    prisma.product.updateMany({ where: { examId: exam.id }, data: { examId: null, isActive: false } }),
    prisma.question.deleteMany({ where: { examId: exam.id } }),
    prisma.topic.deleteMany({ where: { examVersionId: { in: versionIds } } }),
    prisma.examVersion.deleteMany({ where: { examId: exam.id } }),
    prisma.exam.delete({ where: { id: exam.id } }),
  ]);

  console.log("Removed demo-cert exam:", {
    attempts: attemptIds.length,
    versions: versionIds.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
