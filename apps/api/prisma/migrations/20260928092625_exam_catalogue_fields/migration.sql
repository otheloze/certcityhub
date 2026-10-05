-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "level" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "shortCode" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
