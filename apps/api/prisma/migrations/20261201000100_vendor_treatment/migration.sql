-- CreateEnum
CREATE TYPE "VendorTreatment" AS ENUM ('mitigate', 'transfer', 'accept', 'avoid');

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "treatment" "VendorTreatment",
ADD COLUMN     "treatmentNote" TEXT;
