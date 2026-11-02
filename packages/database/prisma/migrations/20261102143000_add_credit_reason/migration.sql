ALTER TABLE "CreditTransaction" ADD COLUMN IF NOT EXISTS "credit_reason" TEXT;

UPDATE "CreditTransaction"
SET "credit_reason" = CASE "type"
  WHEN 'SIGNUP_BONUS' THEN 'signup_bonus'
  WHEN 'GIFTED' THEN 'admin_gift'
  WHEN 'PURCHASED' THEN 'dodo_purchase'
  WHEN 'DEDUCTED' THEN 'interview_usage'
  WHEN 'REFUNDED' THEN 'interview_refund'
  WHEN 'EXPIRED' THEN 'expired'
  WHEN 'ADMIN_ADJUSTMENT' THEN 'admin_adjustment'
  ELSE LOWER("type"::text)
END
WHERE "credit_reason" IS NULL;
