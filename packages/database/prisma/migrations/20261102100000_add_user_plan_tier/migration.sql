CREATE TYPE "UserPlanTier" AS ENUM ('FREE', 'PREMIUM');

ALTER TABLE "User"
ADD COLUMN "planTier" "UserPlanTier" NOT NULL DEFAULT 'FREE';

ALTER TABLE "Interview"
ADD COLUMN "planTierAtStart" "UserPlanTier" NOT NULL DEFAULT 'FREE';
