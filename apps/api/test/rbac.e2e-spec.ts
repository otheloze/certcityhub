import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp, registerAndLogin } from "./utils/test-app";
import { resetDatabase } from "./utils/db";

describe("RBAC guard sweep (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let studentToken: string;

  const adminRoutes: { method: "get" | "post" | "patch" | "delete"; path: string }[] = [
    { method: "post", path: "/api/exams" },
    { method: "patch", path: "/api/exams/00000000-0000-0000-0000-000000000000" },
    { method: "post", path: "/api/exams/00000000-0000-0000-0000-000000000000/archive" },
    { method: "post", path: "/api/exams/00000000-0000-0000-0000-000000000000/versions" },
    { method: "patch", path: "/api/exam-versions/00000000-0000-0000-0000-000000000000" },
    { method: "post", path: "/api/exam-versions/00000000-0000-0000-0000-000000000000/publish" },
    { method: "post", path: "/api/topics" },
    { method: "patch", path: "/api/topics/00000000-0000-0000-0000-000000000000" },
    { method: "post", path: "/api/topics/00000000-0000-0000-0000-000000000000/archive" },
    { method: "delete", path: "/api/topics/00000000-0000-0000-0000-000000000000" },
    { method: "get", path: "/api/questions" },
    { method: "post", path: "/api/questions" },
    { method: "post", path: "/api/questions/00000000-0000-0000-0000-000000000000/status" },
    { method: "get", path: "/api/audit-logs" },
  ];

  const publicRoutes: { method: "get"; path: string }[] = [{ method: "get", path: "/api/exams" }];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    studentToken = await registerAndLogin(app, "rbac-student@example.com");
  });

  it.each(adminRoutes)("blocks a student from %s %s with 403", async ({ method, path }) => {
    const response = await (request(app.getHttpServer()) as any)[method](path)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(response.status).toBe(403);
  });

  it.each(adminRoutes)("blocks an unauthenticated request to %s %s with 401", async ({ method, path }) => {
    const response = await (request(app.getHttpServer()) as any)[method](path).send({});
    expect(response.status).toBe(401);
  });

  it.each(publicRoutes)("allows an unauthenticated request to %s %s", async ({ method, path }) => {
    const response = await (request(app.getHttpServer()) as any)[method](path);
    expect(response.status).toBe(200);
  });
});
