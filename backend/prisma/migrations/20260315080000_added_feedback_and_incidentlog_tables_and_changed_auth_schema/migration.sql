-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('rating', 'report');

-- CreateEnum
CREATE TYPE "IncidentAction" AS ENUM ('warning_issued', 'user_suspended', 'user_banned', 'case_dismissed', 'under_review', 'escalated', 'resolved');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('open', 'in_progress', 'closed');

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ALTER COLUMN "role" SET DEFAULT 'passenger';

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "tripId" TEXT,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_log" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT,
    "sosAlertId" TEXT,
    "sosReason" TEXT,
    "action" "IncidentAction" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_fromUserId_idx" ON "feedback"("fromUserId");

-- CreateIndex
CREATE INDEX "feedback_toUserId_idx" ON "feedback"("toUserId");

-- CreateIndex
CREATE INDEX "feedback_type_idx" ON "feedback"("type");

-- CreateIndex
CREATE INDEX "feedback_tripId_idx" ON "feedback"("tripId");

-- CreateIndex
CREATE INDEX "incident_log_feedbackId_idx" ON "incident_log"("feedbackId");

-- CreateIndex
CREATE INDEX "incident_log_sosAlertId_idx" ON "incident_log"("sosAlertId");

-- CreateIndex
CREATE INDEX "incident_log_adminId_idx" ON "incident_log"("adminId");

-- CreateIndex
CREATE INDEX "incident_log_targetUserId_idx" ON "incident_log"("targetUserId");

-- CreateIndex
CREATE INDEX "incident_log_status_idx" ON "incident_log"("status");

-- CreateIndex
CREATE INDEX "incident_log_action_idx" ON "incident_log"("action");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_log" ADD CONSTRAINT "incident_log_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_log" ADD CONSTRAINT "incident_log_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_log" ADD CONSTRAINT "incident_log_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
