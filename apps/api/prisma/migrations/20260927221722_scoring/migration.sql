-- AlterTable
ALTER TABLE "attempt_questions" ADD COLUMN     "markedForReview" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scores_attemptId_key" ON "scores"("attemptId");

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
