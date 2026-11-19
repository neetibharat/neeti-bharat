-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('not_assessed', 'in_progress', 'assessed');

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "agreementRenewsOn",
DROP COLUMN "agreementSignedOn",
DROP COLUMN "agreementStatus",
DROP COLUMN "lastReviewedOn",
DROP COLUMN "reviewStatus",
ADD COLUMN     "inherentImpact" INTEGER,
ADD COLUMN     "inherentLikelihood" INTEGER,
ADD COLUMN     "residualImpact" INTEGER,
ADD COLUMN     "residualLikelihood" INTEGER,
ADD COLUMN     "status" "VendorStatus" NOT NULL DEFAULT 'not_assessed';

-- DropEnum
DROP TYPE "VendorAgreementStatus";

-- DropEnum
DROP TYPE "VendorReviewStatus";
