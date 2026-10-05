import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp, registerAndLoginAsAdmin } from "./utils/test-app";
import { resetDatabase } from "./utils/db";

const CONFIG = {
  durationSeconds: 3600,
  navigation: { allowBackNavigation: true, allowAnswerChanges: true, allowMarkForReview: true },
  scoringStrategy: { type: "RAW" },
};

describe("Questions (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let examId: string;
  let examVersionId: string;
  let topicAId: string;
  let topicBId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    adminToken = await registerAndLoginAsAdmin(app, "questions-admin@example.com");

    const exam = await request(app.getHttpServer())
      .post("/api/exams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ slug: "demo", title: "Demo" });
    examId = exam.body.id;

    const version = await request(app.getHttpServer())
      .post(`/api/exams/${examId}/versions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ versionLabel: "v1", config: CONFIG });
    examVersionId = version.body.id;

    const topicA = await request(app.getHttpServer())
      .post("/api/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ examVersionId, title: "Topic A", slug: "topic-a" });
    topicAId = topicA.body.id;

    const topicB = await request(app.getHttpServer())
      .post("/api/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ examVersionId, title: "Topic B", slug: "topic-b" });
    topicBId = topicB.body.id;
  });

  function createQuestion() {
    return request(app.getHttpServer())
      .post("/api/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        examId,
        examVersionId,
        type: "SINGLE_CHOICE",
        stem: { blocks: [{ type: "text", text: "Pick one" }] },
        answerSchema: { allowPartialCredit: false },
        options: [
          { label: "A", content: { blocks: [{ type: "text", text: "A" }] }, isCorrect: true },
          { label: "B", content: { blocks: [{ type: "text", text: "B" }] }, isCorrect: false },
        ],
      });
  }

  it("creates a question with options and maps it to two topics", async () => {
    const question = await createQuestion();
    expect(question.status).toBe(201);
    expect(question.body.options).toHaveLength(2);

    await request(app.getHttpServer())
      .post(`/api/questions/${question.body.id}/topics`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId: topicAId, isPrimary: true });

    await request(app.getHttpServer())
      .post(`/api/questions/${question.body.id}/topics`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId: topicBId, isPrimary: false });

    const mappings = await request(app.getHttpServer())
      .get(`/api/questions/${question.body.id}/topics`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(mappings.body).toHaveLength(2);
  });

  it("rejects a duplicate topic mapping with 409", async () => {
    const question = await createQuestion();

    await request(app.getHttpServer())
      .post(`/api/questions/${question.body.id}/topics`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId: topicAId, isPrimary: true });

    const duplicate = await request(app.getHttpServer())
      .post(`/api/questions/${question.body.id}/topics`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId: topicAId, isPrimary: false });

    expect(duplicate.status).toBe(409);
  });

  it("unmapping a topic leaves the topic and question rows untouched", async () => {
    const question = await createQuestion();
    await request(app.getHttpServer())
      .post(`/api/questions/${question.body.id}/topics`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId: topicAId, isPrimary: true });

    await request(app.getHttpServer())
      .delete(`/api/questions/${question.body.id}/topics/${topicAId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const topicStillExists = await prisma.topic.findUnique({ where: { id: topicAId } });
    const questionStillExists = await prisma.question.findUnique({ where: { id: question.body.id } });
    expect(topicStillExists).not.toBeNull();
    expect(questionStillExists).not.toBeNull();

    const mappings = await prisma.questionTopic.findMany({ where: { questionId: question.body.id } });
    expect(mappings).toHaveLength(0);
  });

  it("walks the full status chain and rejects an illegal jump", async () => {
    const question = await createQuestion();
    const id = question.body.id;

    const illegalJump = await request(app.getHttpServer())
      .post(`/api/questions/${id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ targetStatus: "PUBLISHED" });
    expect(illegalJump.status).toBe(400);

    for (const targetStatus of ["IN_REVIEW", "APPROVED", "PUBLISHED", "RETIRED"]) {
      const response = await request(app.getHttpServer())
        .post(`/api/questions/${id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ targetStatus });
      expect(response.status).toBe(201);
      expect(response.body.status).toBe(targetStatus);
    }
  });

  it("bumps the version and writes an audit entry when editing a published question", async () => {
    const question = await createQuestion();
    const id = question.body.id;

    for (const targetStatus of ["IN_REVIEW", "APPROVED", "PUBLISHED"]) {
      await request(app.getHttpServer())
        .post(`/api/questions/${id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ targetStatus });
    }

    const edited = await request(app.getHttpServer())
      .patch(`/api/questions/${id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Edited after publish" });

    expect(edited.status).toBe(200);
    expect(edited.body.version).toBe(2);

    const auditLogs = await request(app.getHttpServer())
      .get(`/api/audit-logs?entityType=Question&entityId=${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(auditLogs.body.some((entry: any) => entry.action === "question.updated_published")).toBe(true);
  });
});
