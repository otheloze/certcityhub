import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp, giveCredits, registerAndLogin, registerAndLoginAsAdmin } from "./utils/test-app";
import { resetDatabase } from "./utils/db";

const CONFIG = {
  durationSeconds: 3600,
  navigation: { allowBackNavigation: true, allowAnswerChanges: true, allowMarkForReview: true },
  scoringStrategy: { type: "RAW" },
};

describe("Scoring & review flags (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    adminToken = await registerAndLoginAsAdmin(app, "scoring-admin@example.com");
    studentToken = await registerAndLogin(app, "scoring-student@example.com");
    await giveCredits(prisma, "scoring-student@example.com", 20);
  });

  it("grades an attempt on submit, with a per-topic breakdown, and blocks fetching the result early", async () => {
    const exam = await request(app.getHttpServer())
      .post("/api/exams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ slug: "demo", title: "Demo" });

    const version = await request(app.getHttpServer())
      .post(`/api/exams/${exam.body.id}/versions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ versionLabel: "v1", config: CONFIG });
    const examVersionId = version.body.id;

    const topic = await request(app.getHttpServer())
      .post("/api/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ examVersionId, title: "Topic A", slug: "topic-a" });

    const questionIds: string[] = [];
    for (let i = 0; i < 2; i++) {
      const question = await request(app.getHttpServer())
        .post("/api/questions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          examId: exam.body.id,
          examVersionId,
          type: "SINGLE_CHOICE",
          stem: { blocks: [{ type: "text", text: `Question ${i}` }] },
          answerSchema: { allowPartialCredit: false },
          options: [
            { label: "A", content: { blocks: [{ type: "text", text: "A" }] }, isCorrect: true },
            { label: "B", content: { blocks: [{ type: "text", text: "B" }] }, isCorrect: false },
          ],
        });
      questionIds.push(question.body.id);

      await request(app.getHttpServer())
        .post(`/api/questions/${question.body.id}/topics`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ topicId: topic.body.id, isPrimary: true });

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

    const started = await request(app.getHttpServer())
      .post("/api/attempts")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ examVersionId });
    const attemptId = started.body.id;

    const earlyResult = await request(app.getHttpServer())
      .get(`/api/attempts/${attemptId}/result`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(earlyResult.status).toBe(409);

    await request(app.getHttpServer())
      .put(`/api/attempts/${attemptId}/review/${questionIds[0]}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ marked: true });

    // Correct answer on question 0, wrong answer on question 1.
    await request(app.getHttpServer())
      .put(`/api/attempts/${attemptId}/answers/${questionIds[0]}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ responseData: { optionLabel: "A" } });
    await request(app.getHttpServer())
      .put(`/api/attempts/${attemptId}/answers/${questionIds[1]}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ responseData: { optionLabel: "B" } });

    const questionsBeforeSubmit = await request(app.getHttpServer())
      .get(`/api/attempts/${attemptId}/questions`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(questionsBeforeSubmit.body.find((q: any) => q.questionId === questionIds[0]).markedForReview).toBe(
      true,
    );

    const submitted = await request(app.getHttpServer())
      .post(`/api/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(submitted.body.status).toBe("SUBMITTED");

    const result = await request(app.getHttpServer())
      .get(`/api/attempts/${attemptId}/result`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(result.status).toBe(200);
    expect(result.body.rawScore).toBe(1);
    expect(result.body.maxScore).toBe(2);
    expect(result.body.percentage).toBeCloseTo(50);

    const topicBreakdown = result.body.breakdown.topics.find((t: any) => t.topicId === topic.body.id);
    expect(topicBreakdown).toBeDefined();
    expect(topicBreakdown.correct).toBe(1);
    expect(topicBreakdown.total).toBe(2);
  });
});
