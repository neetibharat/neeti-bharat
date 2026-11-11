-- Policies, their versions and approvals, and which controls they cover.

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('draft', 'in_review', 'approved');

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "ownerRole" "JobRole" NOT NULL,
    "approverTitle" TEXT NOT NULL,
    "reviewEvery" TEXT NOT NULL DEFAULT 'annual',
    "legalReferences" TEXT[],
    "evidence" TEXT[],
    "status" "PolicyStatus" NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMPTZ(3),
    "approvedByName" TEXT,
    "content" JSONB,
    "contentEditedAt" TIMESTAMPTZ(3),
    "contentEditedByName" TEXT,
    "changelog" TEXT,
    "approverId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_policy_links" (
    "controlId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "control_policy_links_pkey" PRIMARY KEY ("controlId","policyId")
);

-- CreateTable
CREATE TABLE "policy_approvals" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "approvedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT NOT NULL,
    "approvedByName" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "changelog" TEXT,

    CONSTRAINT "policy_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "policies_approverId_idx" ON "policies"("approverId");

-- CreateIndex
CREATE UNIQUE INDEX "policies_frameworkId_templateId_key" ON "policies"("frameworkId", "templateId");

-- CreateIndex
CREATE INDEX "control_policy_links_policyId_idx" ON "control_policy_links"("policyId");

-- CreateIndex
CREATE INDEX "policy_approvals_policyId_approvedAt_idx" ON "policy_approvals"("policyId", "approvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "policy_approvals_policyId_version_key" ON "policy_approvals"("policyId", "version");

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_policy_links" ADD CONSTRAINT "control_policy_links_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_policy_links" ADD CONSTRAINT "control_policy_links_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_approvals" ADD CONSTRAINT "policy_approvals_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
