import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.init();
  return app;
}

export async function registerAndLogin(app: INestApplication, email: string, password = "Password123!") {
  await request(app.getHttpServer()).post("/api/auth/register").send({ email, password });
  const response = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return response.body.accessToken as string;
}

// /auth/register always creates a STUDENT; to get an admin token in tests we
// promote the row directly (never exposed as an API - only Prisma) and log
// in again so the JWT claims reflect the new role.
export async function registerAndLoginAsAdmin(app: INestApplication, email: string, password = "Password123!") {
  await registerAndLogin(app, email, password);
  const prisma = app.get(PrismaService);
  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
  const response = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email, password });
  return response.body.accessToken as string;
}

interface GiveCreditsOptions {
  scopeType?: "GLOBAL" | "EXAM";
  examId?: string;
  questionFraction?: number;
  expiresAt?: Date;
}

// Test shortcut: put credits straight into the ledger (lot + GRANT row), the
// same shape the real grant/purchase paths produce.
export async function giveCredits(prisma: PrismaService, email: string, credits = 5, options: GiveCreditsOptions = {}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const lot = await prisma.creditLot.create({
    data: {
      userId: user.id,
      scopeType: options.scopeType ?? "GLOBAL",
      examId: options.examId ?? null,
      granted: credits,
      remaining: credits,
      questionFraction: options.questionFraction ?? 1,
      expiresAt: options.expiresAt ?? null,
      source: "ADMIN_GRANT",
    },
  });
  await prisma.creditTransaction.create({
    data: { userId: user.id, lotId: lot.id, amount: credits, reason: "GRANT", note: "test grant" },
  });
  return lot;
}

// Fast setup: a published exam version with N published single-choice
// questions, inserted directly rather than through ~4 API calls per question.
export async function seedPublishedExam(prisma: PrismaService, slug: string, questionCount: number) {
  const exam = await prisma.exam.create({ data: { slug, title: slug } });
  const version = await prisma.examVersion.create({
    data: {
      examId: exam.id,
      versionLabel: "v1",
      status: "PUBLISHED",
      publishedAt: new Date(),
      config: {
        durationSeconds: 3600,
        navigation: { allowBackNavigation: true, allowAnswerChanges: true, allowMarkForReview: true },
        scoringStrategy: { type: "RAW" },
      },
    },
  });
  for (let i = 0; i < questionCount; i++) {
    await prisma.question.create({
      data: {
        examId: exam.id,
        examVersionId: version.id,
        type: "SINGLE_CHOICE",
        title: `Q${i}`,
        stem: { blocks: [{ type: "text", text: `Question ${i}` }] },
        answerSchema: { allowPartialCredit: false },
        status: "PUBLISHED",
        options: {
          create: [
            { label: "A", content: { blocks: [{ type: "text", text: "A" }] }, isCorrect: true, sortOrder: 0 },
            { label: "B", content: { blocks: [{ type: "text", text: "B" }] }, isCorrect: false, sortOrder: 1 },
          ],
        },
      },
    });
  }
  return { exam, version };
}
