-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "onboardedAt" TIMESTAMPTZ(3);

-- Organisations that already exist were set up by hand, so they are not sent through the set-up that follows creating one.
UPDATE "organizations" SET "onboardedAt" = CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "readiness_checks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "takenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "takenByName" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "readiness_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "readiness_checks_organizationId_takenAt_idx" ON "readiness_checks"("organizationId", "takenAt");

-- AddForeignKey
ALTER TABLE "readiness_checks" ADD CONSTRAINT "readiness_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
