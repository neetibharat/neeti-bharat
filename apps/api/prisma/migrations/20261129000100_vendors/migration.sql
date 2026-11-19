-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM ('cloud', 'payments', 'communications', 'hr', 'support', 'analytics', 'other');

-- CreateEnum
CREATE TYPE "VendorLocation" AS ENUM ('india', 'abroad', 'both');

-- CreateEnum
CREATE TYPE "VendorAgreementStatus" AS ENUM ('none', 'requested', 'signed');

-- CreateEnum
CREATE TYPE "VendorReviewStatus" AS ENUM ('not_reviewed', 'reviewed', 'issues');

-- CreateTable
CREATE TABLE "vendors" (
    "organizationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "service" TEXT NOT NULL,
    "category" "VendorCategory" NOT NULL,
    "dataKinds" TEXT[],
    "location" "VendorLocation",
    "agreementStatus" "VendorAgreementStatus" NOT NULL DEFAULT 'none',
    "agreementSignedOn" TIMESTAMPTZ(3),
    "agreementRenewsOn" TIMESTAMPTZ(3),
    "agreementUrl" TEXT,
    "reviewStatus" "VendorReviewStatus" NOT NULL DEFAULT 'not_reviewed',
    "lastReviewedOn" TIMESTAMPTZ(3),
    "nextReviewOn" TIMESTAMPTZ(3),
    "ownerId" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_ownerId_idx" ON "vendors"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_organizationId_name_key" ON "vendors"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "activity_events_organizationId_subjectType_subjectId_seq_idx" ON "activity_events"("organizationId", "subjectType", "subjectId", "seq");

-- AlterEnum
ALTER TYPE "NotificationKind" ADD VALUE 'vendor';
