-- CreateEnum
CREATE TYPE "AttemptMode" AS ENUM ('SIMULATION', 'PRACTICE');

-- CreateEnum
CREATE TYPE "CreditScope" AS ENUM ('GLOBAL', 'EXAM');

-- CreateEnum
CREATE TYPE "CreditSource" AS ENUM ('PURCHASE', 'FREE_PLAN', 'ADMIN_GRANT');

-- CreateEnum
CREATE TYPE "CreditTxReason" AS ENUM ('GRANT', 'EXAM_STARTED', 'ADMIN_REFUND', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "attempts" ADD COLUMN     "mode" "AttemptMode" NOT NULL DEFAULT 'SIMULATION';

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopeType" "CreditScope" NOT NULL,
    "examId" TEXT,
    "credits" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "validityDays" INTEGER,
    "questionFraction" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlement_credits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopeType" "CreditScope" NOT NULL,
    "examId" TEXT,
    "granted" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "questionFraction" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "source" "CreditSource" NOT NULL,
    "purchaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entitlement_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" "CreditTxReason" NOT NULL,
    "attemptId" TEXT,
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE INDEX "purchases_userId_idx" ON "purchases"("userId");

-- CreateIndex
CREATE INDEX "entitlement_credits_userId_idx" ON "entitlement_credits"("userId");

-- CreateIndex
CREATE INDEX "credit_transactions_userId_idx" ON "credit_transactions"("userId");

-- CreateIndex
CREATE INDEX "credit_transactions_lotId_idx" ON "credit_transactions"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_transactions_attemptId_reason_key" ON "credit_transactions"("attemptId", "reason");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_credits" ADD CONSTRAINT "entitlement_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_credits" ADD CONSTRAINT "entitlement_credits_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "entitlement_credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
