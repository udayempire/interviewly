ALTER TYPE "InterviewStatus" ADD VALUE IF NOT EXISTS 'RECONNECTING';
ALTER TYPE "InterviewStatus" ADD VALUE IF NOT EXISTS 'TIMED_OUT';

ALTER TABLE "Interview"
  ADD COLUMN "reconnectUntil" TIMESTAMP(3),
  ADD COLUMN "connectionId" TEXT,
  ADD COLUMN "connectionLeaseUntil" TIMESTAMP(3),
  ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "inactivityWarningCount" INTEGER NOT NULL DEFAULT 0;

CREATE TYPE "InterviewReportStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'NOT_ELIGIBLE', 'FAILED');

ALTER TABLE "InterviewReport"
  ADD COLUMN "status" "InterviewReportStatus" NOT NULL DEFAULT 'READY',
  ADD COLUMN "isPartial" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "eligibilityReason" TEXT,
  ADD COLUMN "generationError" TEXT,
  ADD COLUMN "generationStartedAt" TIMESTAMP(3),
  ALTER COLUMN "strengths" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "improvements" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "detailedFeedback" DROP NOT NULL,
  ALTER COLUMN "aiSummary" DROP NOT NULL;

CREATE TYPE "InterviewEventType" AS ENUM (
  'SOCKET_CONNECTED',
  'SOCKET_DISCONNECTED',
  'RECONNECT_WINDOW_STARTED',
  'RECONNECTED',
  'CANDIDATE_ACTIVITY',
  'INACTIVITY_WARNING',
  'INTERVIEW_COMPLETED',
  'INTERVIEW_TIMED_OUT',
  'REPORT_GENERATION_STARTED',
  'REPORT_GENERATION_SUCCEEDED',
  'REPORT_GENERATION_FAILED',
  'REPORT_NOT_ELIGIBLE'
);

CREATE TABLE "InterviewEvent" (
  "id" TEXT NOT NULL,
  "interviewId" TEXT NOT NULL,
  "type" "InterviewEventType" NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InterviewEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InterviewEvent_interviewId_fkey"
    FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "InterviewEvent_interviewId_createdAt_idx" ON "InterviewEvent"("interviewId", "createdAt");
CREATE INDEX "InterviewEvent_type_createdAt_idx" ON "InterviewEvent"("type", "createdAt");
