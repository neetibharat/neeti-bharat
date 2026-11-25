-- AlterEnum
ALTER TYPE "NotificationKind" ADD VALUE 'training';

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN "repeatsYearly" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "policy_acceptances" (
    "organizationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "policy_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "policy_acceptances_personId_idx" ON "policy_acceptances"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "policy_acceptances_policyId_personId_key" ON "policy_acceptances"("policyId", "personId");

-- AddForeignKey
ALTER TABLE "policy_acceptances" ADD CONSTRAINT "policy_acceptances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_acceptances" ADD CONSTRAINT "policy_acceptances_organizationId_policyId_fkey" FOREIGN KEY ("organizationId", "policyId") REFERENCES "policies"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_acceptances" ADD CONSTRAINT "policy_acceptances_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
