import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp, registerAndLogin, registerAndLoginAsAdmin } from "./utils/test-app";
import { resetDatabase } from "./utils/db";

describe("Exams & ExamVersions (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  it("lets an admin create an exam and a student cannot", async () => {
    const adminToken = await registerAndLoginAsAdmin(app, "admin1@example.com");
    const studentToken = await registerAndLogin(app, "student1@example.com");

    const forbidden = await request(app.getHttpServer())
      .post("/api/exams")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ slug: "demo", title: "Demo" });
    expect(forbidden.status).toBe(403);

    const created = await request(app.getHttpServer())
      .post("/api/exams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ slug: "demo", title: "Demo" });
    expect(created.status).toBe(201);
    expect(created.body.slug).toBe("demo");
  });

  it("excludes archived exams from the public catalogue", async () => {
    const adminToken = await registerAndLoginAsAdmin(app, "admin2@example.com");

    const created = await request(app.getHttpServer())
      .post("/api/exams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ slug: "demo", title: "Demo" });

    let catalogue = await request(app.getHttpServer()).get("/api/exams");
    expect(catalogue.body.map((e: any) => e.slug)).toContain("demo");

    await request(app.getHttpServer())
      .post(`/api/exams/${created.body.id}/archive`)
      .set("Authorization", `Bearer ${adminToken}`);

    catalogue = await request(app.getHttpServer()).get("/api/exams");
    expect(catalogue.body.map((e: any) => e.slug)).not.toContain("demo");
  });

  it("locks an exam version's config once published", async () => {
    const adminToken = await registerAndLoginAsAdmin(app, "admin3@example.com");

    const exam = await request(app.getHttpServer())
      .post("/api/exams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ slug: "demo", title: "Demo" });

    const config = {
      durationSeconds: 3600,
      navigation: { allowBackNavigation: true, allowAnswerChanges: true, allowMarkForReview: true },
      scoringStrategy: { type: "RAW" },
    };

    const version = await request(app.getHttpServer())
      .post(`/api/exams/${exam.body.id}/versions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ versionLabel: "v1", config });
    expect(version.status).toBe(201);

    const published = await request(app.getHttpServer())
      .post(`/api/exam-versions/${version.body.id}/publish`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(published.status).toBe(201);
    expect(published.body.status).toBe("PUBLISHED");

    const editAfterPublish = await request(app.getHttpServer())
      .patch(`/api/exam-versions/${version.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ versionLabel: "v1-edited" });
    expect(editAfterPublish.status).toBe(409);
  });
});
