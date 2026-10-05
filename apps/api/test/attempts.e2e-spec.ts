import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp, giveCredits, registerAndLogin, registerAndLoginAsAdmin } from "./utils/test-app";
import { resetDatabase } from "./utils/db";

function config(durationSeconds: number, allowAnswerChanges = true) {
  return {
    durationSeconds,
    navigation: { allowBackNavigation: true, allowAnswerChanges, allowMarkForReview: true },
    scoringStrategy: { type: "RAW" },
  };
}

describe("Attempts (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  let examId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    adminToken = await registerAndLoginAsAdmin(app, "attempts-admin@example.com");
    studentToken = await registerAndLogin(app, "attempts-student@example.com");
    await giveCredits(prisma, "attempts-student@example.com", 20);

    const exam = await request(app.getHttpServer())
      .post("/api/exams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ slug: "demo", title: "Demo" });
    examId = exam.body.id;
  });

  async function publishedVersionWithQuestions(versionConfig: ReturnType<typeof config>, count = 2) {
    const version = await request(app.getHttpServer())
      .post(`/api/exams/${examId}/versions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ versionLabel: "v1", config: versionConfig });
    const examVersionId = version.body.id;

    const questionIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const question = await request(app.getHttpServer())
        .post("/api/questions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          examId,
          examVersionId,
          type: "SINGLE_CHOICE",
          stem: { blocks: [{ type: "text", text: `Question ${i}` }] },
          answerSchema: { allowPartialCredit: false },
          explanation: { blocks: [{ type: "text", text: "secret reasoning" }] },
          options: [
            { label: "A", content: { blocks: [{ type: "text", text: "A" }] }, isCorrect: i === 0 },
            { label: "B", content: { blocks: [{ type: "text", text: "B" }] }, isCorrect: i !== 0 },
          ],
        });
      questionIds.push(question.body.id);

      for (const targetStatus of ["IN_REVIEW", "APPROVED", "PUBLISHED"]) {
        await request(app.getHttpServer())
          .post(`/api/questions/${question.body.id}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ targetStatus });
      }
    }

    await request(app.getHttpServer())
      .post(`/api/exam-versions/${examVersionId}/publish`)
      .set("Authorization", `Bearer ${adminToken}`);

    return { examVersionId, questionIds };
  }

  it("starts an attempt and hides answer keys/explanations from the questions view", async () => {
    const { examVersionId } = await publishedVersionWithQuestions(config(3600));

    const started = await request(app.getHttpServer())
      .post("/api/attempts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ examVersionId });
    expect(started.status).toBe(201);
    expect(started.body.status).toBe("IN_PROGRESS");

    const questions = await request(app.getHttpServer())
      .get(`/api/attempts/${started.body.id}/questions`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(questions.status).toBe(200);
    expect(questions.body).toHaveLength(2);
    for (const q of questions.body) {
      expect(q).not.toHaveProperty("explanation");
      for (const option of q.options) {
        expect(option).not.toHaveProperty("isCorrect");
      }
    }
  });

  it("saves an answer, and blocks changing it when allowAnswerChanges is false", async () => {
    const { examVersionId, questionIds } = await publishedVersionWithQuestions(config(3600, false));

    const started = await request(app.getHttpServer())
      .post("/api/attempts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ examVersionId });

    const firstAnswer = await request(app.getHttpServer())
      .put(`/api/attempts/${started.body.id}/answers/${questionIds[0]}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ responseData: { optionLabel: "A" } });
    expect(firstAnswer.status).toBe(200);

    const secondAttempt = await request(app.getHttpServer())
      .put(`/api/attempts/${started.body.id}/answers/${questionIds[0]}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ responseData: { optionLabel: "B" } });
    expect(secondAttempt.status).toBe(409);
  });

  it("blocks a non-owner from reading or answering someone else's attempt", async () => {
    const { examVersionId, questionIds } = await publishedVersionWithQuestions(config(3600));
    const otherStudentToken = await registerAndLogin(app, "other-student@example.com");

    const started = await request(app.getHttpServer())
      .post("/api/attempts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ examVersionId });

    const readAttempt = await request(app.getHttpServer())
      .get(`/api/attempts/${started.body.id}`)
      .set("Authorization", `Bearer ${otherStudentToken}`);
    expect(readAttempt.status).toBe(403);

    const answerAttempt = await request(app.getHttpServer())
      .put(`/api/attempts/${started.body.id}/answers/${questionIds[0]}`)
      .set("Authorization", `Bearer ${otherStudentToken}`)
      .send({ responseData: { optionLabel: "A" } });
    expect(answerAttempt.status).toBe(403);
  });

  it("is idempotent on repeated submit calls", async () => {
    const { examVersionId } = await publishedVersionWithQuestions(config(3600));

    const started = await request(app.getHttpServer())
      .post("/api/attempts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ examVersionId });

    const firstSubmit = await request(app.getHttpServer())
      .post(`/api/attempts/${started.body.id}/submit`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(firstSubmit.status).toBe(201);
    expect(firstSubmit.body.status).toBe("SUBMITTED");

    const secondSubmit = await request(app.getHttpServer())
      .post(`/api/attempts/${started.body.id}/submit`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(secondSubmit.status).toBe(201);
    expect(secondSubmit.body.status).toBe("SUBMITTED");
    expect(secondSubmit.body.submittedAt).toBe(firstSubmit.body.submittedAt);
  });

  it("expires an attempt server-side once its duration elapses, and rejects further answers", async () => {
    const { examVersionId, questionIds } = await publishedVersionWithQuestions(config(1));

    const started = await request(app.getHttpServer())
      .post("/api/attempts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ examVersionId });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const fetched = await request(app.getHttpServer())
      .get(`/api/attempts/${started.body.id}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(fetched.body.status).toBe("EXPIRED");

    const answerAfterExpiry = await request(app.getHttpServer())
      .put(`/api/attempts/${started.body.id}/answers/${questionIds[0]}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ responseData: { optionLabel: "A" } });
    expect(answerAfterExpiry.status).toBe(409);
  });
});
