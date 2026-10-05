-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('ORG_ADMIN', 'ORG_MEMBER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "AccessCodeStatus" AS ENUM ('UNUSED', 'USED', 'REVOKED');

-- AlterEnum
ALTER TYPE "CreditSource" ADD VALUE 'ORG_GRANT';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ORG_ADMIN';

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "missionStatement" TEXT,
    "logoUrl" TEXT,
    "allowedExamSlugs" TEXT[] DEFAULT ARRAY['jamb-utme', 'waec-wassce']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgRole" "OrgRole" NOT NULL DEFAULT 'ORG_MEMBER',
    "displayName" TEXT,
    "externalRef" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_exam_access_codes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "creditLotId" TEXT NOT NULL,
    "status" "AccessCodeStatus" NOT NULL DEFAULT 'UNUSED',
    "attemptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "organization_exam_access_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_userId_key" ON "organization_members"("userId");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_idx" ON "organization_members"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_exam_access_codes_creditLotId_key" ON "organization_exam_access_codes"("creditLotId");

-- CreateIndex
CREATE INDEX "organization_exam_access_codes_memberId_examId_status_idx" ON "organization_exam_access_codes"("memberId", "examId", "status");

-- CreateIndex
CREATE INDEX "exams_organizationId_idx" ON "exams"("organizationId");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_exam_access_codes" ADD CONSTRAINT "organization_exam_access_codes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_exam_access_codes" ADD CONSTRAINT "organization_exam_access_codes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "organization_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_exam_access_codes" ADD CONSTRAINT "organization_exam_access_codes_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_exam_access_codes" ADD CONSTRAINT "organization_exam_access_codes_creditLotId_fkey" FOREIGN KEY ("creditLotId") REFERENCES "entitlement_credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
