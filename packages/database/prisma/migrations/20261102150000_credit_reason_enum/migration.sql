DO $$
BEGIN
  CREATE TYPE "CreditReason" AS ENUM (
    'SYSTEM_GRANTED',
    'SIGNUP_BONUS',
    'PURCHASE_ONE_SHOT',
    'PURCHASE_INTERVIEW_READY',
    'PURCHASE_OFFER_READY',
    'INTERVIEW_USAGE',
    'INTERVIEW_REFUND',
    'EXPIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CreditTransaction"
  ALTER COLUMN "credit_reason" DROP DEFAULT,
  ALTER COLUMN "credit_reason" TYPE "CreditReason"
    USING CASE "credit_reason"
      WHEN 'signup_bonus' THEN 'SIGNUP_BONUS'::"CreditReason"
      WHEN 'admin_gift' THEN 'SYSTEM_GRANTED'::"CreditReason"
      WHEN 'admin_adjustment' THEN 'SYSTEM_GRANTED'::"CreditReason"
      WHEN 'dodo_purchase' THEN 'SYSTEM_GRANTED'::"CreditReason"
      WHEN 'one_shot' THEN 'PURCHASE_ONE_SHOT'::"CreditReason"
      WHEN 'interview_ready' THEN 'PURCHASE_INTERVIEW_READY'::"CreditReason"
      WHEN 'offer_ready' THEN 'PURCHASE_OFFER_READY'::"CreditReason"
      WHEN 'interview_usage' THEN 'INTERVIEW_USAGE'::"CreditReason"
      WHEN 'interview_refund' THEN 'INTERVIEW_REFUND'::"CreditReason"
      WHEN 'expired' THEN 'EXPIRED'::"CreditReason"
      ELSE 'SYSTEM_GRANTED'::"CreditReason"
    END,
  ALTER COLUMN "credit_reason" SET DEFAULT 'SYSTEM_GRANTED',
  ALTER COLUMN "credit_reason" SET NOT NULL;
