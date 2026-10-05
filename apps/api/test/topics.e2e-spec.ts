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

describe("Topics (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let examVersionId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    adminToken = await registerAndLoginAsAdmin(app, "topics-admin@example.com");

    const exam = await request(app.getHttpServer())
      .post("/api/exams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ slug: "demo", title: "Demo" });

    const version = await request(app.getHttpServer())
      .post(`/api/exams/${exam.body.id}/versions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ versionLabel: "v1", config: CONFIG });

    examVersionId = version.body.id;
  });

  function createTopic(title: string, slug: string, parentId?: string, sortOrder = 0) {
    return request(app.getHttpServer())
      .post("/api/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ examVersionId, title, slug, parentId, sortOrder });
  }

  it("supports arbitrary nesting depth and returns a nested tree", async () => {
    const domain = await createTopic("Domain 1", "domain-1");
    const section = await createTopic("Section 1.1", "section-1-1", domain.body.id);
    const topic = await createTopic("Topic 1.1.1", "topic-1-1-1", section.body.id);
    const subtopic = await createTopic("Subtopic 1.1.1.1", "subtopic-1-1-1-1", topic.body.id);

    const tree = await request(app.getHttpServer()).get(`/api/exam-versions/${examVersionId}/topics`);

    expect(tree.status).toBe(200);
    expect(tree.body).toHaveLength(1);
    expect(tree.body[0].id).toBe(domain.body.id);
    expect(tree.body[0].children[0].id).toBe(section.body.id);
    expect(tree.body[0].children[0].children[0].id).toBe(topic.body.id);
    expect(tree.body[0].children[0].children[0].children[0].id).toBe(subtopic.body.id);
  });

  it("renames and reorders topics", async () => {
    const topic = await createTopic("Original title", "topic-a", undefined, 5);

    const renamed = await request(app.getHttpServer())
      .patch(`/api/topics/${topic.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "New title", sortOrder: 1 });

    expect(renamed.status).toBe(200);
    expect(renamed.body.title).toBe("New title");
    expect(renamed.body.sortOrder).toBe(1);
  });

  it("archives a topic: excluded by default, still fetchable with status=ARCHIVED", async () => {
    const topic = await createTopic("To archive", "to-archive");

    const archived = await request(app.getHttpServer())
      .post(`/api/topics/${topic.body.id}/archive`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(archived.status).toBe(201);
    expect(archived.body.status).toBe("ARCHIVED");

    const defaultTree = await request(app.getHttpServer()).get(
      `/api/exam-versions/${examVersionId}/topics`,
    );
    expect(defaultTree.body.map((n: any) => n.id)).not.toContain(topic.body.id);

    const fetched = await request(app.getHttpServer())
      .get(`/api/topics/${topic.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.status).toBe("ARCHIVED");
  });

  it("blocks hard-delete when referenced, allows it once orphaned", async () => {
    const topic = await createTopic("Referenced topic", "referenced-topic");

    const question = await request(app.getHttpServer())
      .post("/api/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        examId: (await prisma.examVersion.findUniqueOrThrow({ where: { id: examVersionId } })).examId,
        examVersionId,
        type: "SHORT_ANSWER",
        stem: { blocks: [{ type: "text", text: "stem" }] },
        answerSchema: { acceptedAnswers: ["x"], caseSensitive: false, matchType: "exact" },
      });

    await request(app.getHttpServer())
      .post(`/api/questions/${question.body.id}/topics`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId: topic.body.id, isPrimary: true });

    const blocked = await request(app.getHttpServer())
      .delete(`/api/topics/${topic.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(blocked.status).toBe(409);

    await request(app.getHttpServer())
      .delete(`/api/questions/${question.body.id}/topics/${topic.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const allowed = await request(app.getHttpServer())
      .delete(`/api/topics/${topic.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(allowed.status).toBe(200);
  });
});
