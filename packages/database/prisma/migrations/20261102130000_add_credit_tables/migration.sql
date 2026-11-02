DO $$
BEGIN
  CREATE TYPE "CreditTransactionType" AS ENUM ('SIGNUP_BONUS', 'GIFTED', 'PURCHASED', 'DEDUCTED', 'REFUNDED', 'EXPIRED', 'ADMIN_ADJUSTMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "UserCredit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserCredit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserCredit_userId_key" UNIQUE ("userId"),
  CONSTRAINT "UserCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CreditTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "type" "CreditTransactionType" NOT NULL,
  "note" TEXT,
  "interviewId" TEXT,
  "grantedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");
CREATE INDEX IF NOT EXISTS "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");
CREATE INDEX IF NOT EXISTS "CreditTransaction_interviewId_idx" ON "CreditTransaction"("interviewId");
