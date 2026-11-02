ALTER TABLE "User"
  ADD COLUMN "dodoCustomerId" TEXT,
  ADD COLUMN "dodoSubscriptionId" TEXT,
  ADD COLUMN "subscriptionStatus" TEXT;

CREATE UNIQUE INDEX "User_dodoCustomerId_key" ON "User"("dodoCustomerId");
CREATE UNIQUE INDEX "User_dodoSubscriptionId_key" ON "User"("dodoSubscriptionId");

CREATE TABLE "DodoWebhookEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DodoWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DodoWebhookEvent_type_processedAt_idx" ON "DodoWebhookEvent"("type", "processedAt");
