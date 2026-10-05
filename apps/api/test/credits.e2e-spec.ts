import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import {
  createTestApp,
  giveCredits,
  registerAndLogin,
  registerAndLoginAsAdmin,
  seedPublishedExam,
} from "./utils/test-app";
import { resetDatabase } from "./utils/db";

describe("Attempt credits (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  const studentEmail = "credits-student@example.com";

  const startAttempt = (token: string, examVersionId: string, body: Record<string, unknown> = {}) =>
    request(app.getHttpServer())
      .post("/api/attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ examVersionId, ...body });

  async function remainingFor(email: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const lots = await prisma.creditLot.findMany({ where: { userId: user.id } });
    const ledger = await prisma.creditTransaction.findMany({ where: { userId: user.id } });
    return {
      remaining: lots.reduce((sum, lot) => sum + lot.remaining, 0),
      ledgerSum: ledger.reduce((sum, tx) => sum + tx.amount, 0),
    };
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    adminToken = await registerAndLoginAsAdmin(app, "credits-admin@example.com");
    studentToken = await registerAndLogin(app, studentEmail);
  });

  it("charges one credit per simulation, none for practice, and keeps the ledger consistent", async () => {
    const { version } = await seedPublishedExam(prisma, "exam-a", 4);
    await giveCredits(prisma, studentEmail, 2);

    const practice = await startAttempt(studentToken, version.id, { mode: "PRACTICE", questionCount: 2 });
    expect(practice.status).toBe(201);
    expect(practice.body.mode).toBe("PRACTICE");
    expect((await remainingFor(studentEmail)).remaining).toBe(2);

    const simulation = await startAttempt(studentToken, version.id);
    expect(simulation.status).toBe(201);
    expect(simulation.body.mode).toBe("SIMULATION");

    const balance = await remainingFor(studentEmail);
    expect(balance.remaining).toBe(1);
    // The ledger is the audit truth: it must always add up to the balance.
    expect(balance.ledgerSum).toBe(balance.remaining);

    const wallet = await request(app.getHttpServer())
      .get("/api/users/me/credits")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(wallet.body.total).toBe(1);
  });

  it("never lets one credit start two attempts when two devices press Start at once", async () => {
    const { version } = await seedPublishedExam(prisma, "exam-race", 3);
    await giveCredits(prisma, studentEmail, 1);

    const [deviceA, deviceB] = await Promise.all([
      startAttempt(studentToken, version.id),
      startAttempt(studentToken, version.id),
    ]);

    expect([deviceA.status, deviceB.status].sort()).toEqual([201, 402]);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: studentEmail } });
    expect(await prisma.attempt.count({ where: { userId: user.id } })).toBe(1);
    const balance = await remainingFor(studentEmail);
    expect(balance.remaining).toBe(0);
    expect(balance.ledgerSum).toBe(0);
  });

  it("rejects a simulation with 402 when the user has no credits, but practice still works", async () => {
    const { version } = await seedPublishedExam(prisma, "exam-none", 3);

    const simulation = await startAttempt(studentToken, version.id);
    expect(simulation.status).toBe(402);

    const practice = await startAttempt(studentToken, version.id, { mode: "PRACTICE" });
    expect(practice.status).toBe(201);
  });

  it("limits a free-plan attempt to a fraction of the questions, using only product data", async () => {
    await prisma.product.create({
      data: { code: "FREE", name: "Free plan", scopeType: "GLOBAL", credits: 2, priceCents: 0, questionFraction: 0.25 },
    });
    const { version } = await seedPublishedExam(prisma, "exam-free", 8);

    // A newly registered user gets the free plan automatically.
    const freeToken = await registerAndLogin(app, "free-user@example.com");
    const wallet = await request(app.getHttpServer())
      .get("/api/users/me/credits")
      .set("Authorization", `Bearer ${freeToken}`);
    expect(wallet.body.total).toBe(2);
    expect(wallet.body.lots[0].questionFraction).toBe(0.25);

    const started = await startAttempt(freeToken, version.id);
    expect(started.status).toBe(201);

    const questions = await request(app.getHttpServer())
      .get(`/api/attempts/${started.body.id}/questions`)
      .set("Authorization", `Bearer ${freeToken}`);
    expect(questions.body).toHaveLength(2); // ceil(8 * 0.25)
  });

  it("sells a product through the payment provider and credits the buyer", async () => {
    const { exam } = await seedPublishedExam(prisma, "exam-shop", 3);
    const product = await prisma.product.create({
      data: {
        code: "SHOP-5",
        name: "Five attempts",
        scopeType: "EXAM",
        examId: exam.id,
        credits: 5,
        priceCents: 999,
      },
    });

    const purchase = await request(app.getHttpServer())
      .post("/api/credits/purchase")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ productId: product.id });
    expect(purchase.status).toBe(201);
    expect(purchase.body.purchase.status).toBe("COMPLETED");

    const balance = await remainingFor(studentEmail);
    expect(balance.remaining).toBe(5);
    expect(balance.ledgerSum).toBe(5);
  });

  it("refunds a consumed attempt exactly once, and refuses adjustments below zero", async () => {
    const { version } = await seedPublishedExam(prisma, "exam-refund", 3);
    const lot = await giveCredits(prisma, studentEmail, 1);

    const started = await startAttempt(studentToken, version.id);
    expect(started.status).toBe(201);
    expect((await remainingFor(studentEmail)).remaining).toBe(0);

    const refund = () =>
      request(app.getHttpServer())
        .post("/api/admin/credits/refund-attempt")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ attemptId: started.body.id, reason: "Connection dropped during exam" });

    expect((await refund()).status).toBe(201);
    expect((await remainingFor(studentEmail)).remaining).toBe(1);
    expect((await refund()).status).toBe(409);

    const tooMuch = await request(app.getHttpServer())
      .post("/api/admin/credits/adjust")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ lotId: lot.id, amount: -5, reason: "Testing floor at zero" });
    expect(tooMuch.status).toBe(400);

    const balance = await remainingFor(studentEmail);
    expect(balance.remaining).toBe(1);
    expect(balance.ledgerSum).toBe(1);
  });

  it("does not let students call admin credit endpoints or refund practice attempts", async () => {
    const { version } = await seedPublishedExam(prisma, "exam-guard", 3);
    const practice = await startAttempt(studentToken, version.id, { mode: "PRACTICE" });

    const asStudent = await request(app.getHttpServer())
      .post("/api/admin/credits/grant")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(asStudent.status).toBe(403);

    const refundPractice = await request(app.getHttpServer())
      .post("/api/admin/credits/refund-attempt")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ attemptId: practice.body.id, reason: "Should not be possible" });
    expect(refundPractice.status).toBe(404);
  });
});
