-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requestCounter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AppRole" NOT NULL DEFAULT 'member',
    "disabledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memberships_userId_idx" ON "memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organizationId_userId_key" ON "memberships"("organizationId", "userId");

-- The organisation that holds everything recorded so far. A fresh install has no data, so it gets none: the first person
-- to sign in creates theirs.
INSERT INTO "organizations" ("id", "name", "requestCounter", "updatedAt")
SELECT '01a1cb00-0000-7000-8000-000000000001',
       COALESCE((SELECT "value" FROM "profile_entries" WHERE "key" = 'companyName' AND "value" <> '' LIMIT 1), 'My organisation'),
       COALESCE((SELECT MAX("number") FROM "data_requests"), 0),
       CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "users")
   OR EXISTS (SELECT 1 FROM "persons")
   OR EXISTS (SELECT 1 FROM "frameworks")
   OR EXISTS (SELECT 1 FROM "activity_events");

-- Everyone who had an account is a member of it, with the role and the switched-off state they had.
INSERT INTO "memberships" ("id", "organizationId", "userId", "role", "disabledAt", "updatedAt")
SELECT gen_random_uuid()::text, '01a1cb00-0000-7000-8000-000000000001', "id", "role", "disabledAt", CURRENT_TIMESTAMP
FROM "users"
WHERE EXISTS (SELECT 1 FROM "organizations");

-- DropForeignKey
ALTER TABLE "requirements" DROP CONSTRAINT "requirements_frameworkId_fkey";

-- DropForeignKey
ALTER TABLE "controls" DROP CONSTRAINT "controls_frameworkId_fkey";

-- DropForeignKey
ALTER TABLE "controls" DROP CONSTRAINT "controls_requirementId_fkey";

-- DropForeignKey
ALTER TABLE "proof_requirements" DROP CONSTRAINT "proof_requirements_controlId_fkey";

-- DropForeignKey
ALTER TABLE "evidence" DROP CONSTRAINT "evidence_controlId_fkey";

-- DropForeignKey
ALTER TABLE "evidence" DROP CONSTRAINT "evidence_proofRequirementId_fkey";

-- DropForeignKey
ALTER TABLE "policies" DROP CONSTRAINT "policies_frameworkId_fkey";

-- DropForeignKey
ALTER TABLE "control_policy_links" DROP CONSTRAINT "control_policy_links_controlId_fkey";

-- DropForeignKey
ALTER TABLE "control_policy_links" DROP CONSTRAINT "control_policy_links_policyId_fkey";

-- DropForeignKey
ALTER TABLE "policy_approvals" DROP CONSTRAINT "policy_approvals_policyId_fkey";

-- DropIndex
DROP INDEX "activity_events_action_seq_idx";

-- DropIndex
DROP INDEX "profile_entries_key_key";

-- DropIndex
DROP INDEX "requirements_frameworkId_templateId_key";

-- DropIndex
DROP INDEX "controls_frameworkId_templateId_key";

-- DropIndex
DROP INDEX "policies_frameworkId_templateId_key";

-- DropIndex
DROP INDEX "policy_approvals_policyId_version_key";

-- DropIndex
DROP INDEX "persons_email_key";

-- DropIndex
DROP INDEX "data_requests_number_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "disabledAt",
DROP COLUMN "role";

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001';

-- AlterTable
ALTER TABLE "activity_events" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001';

-- AlterTable
ALTER TABLE "activity_anchor" DROP CONSTRAINT "activity_anchor_pkey",
DROP COLUMN "id",
ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001',
ADD CONSTRAINT "activity_anchor_pkey" PRIMARY KEY ("organizationId");

-- AlterTable
ALTER TABLE "profile_entries" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001';

-- AlterTable
ALTER TABLE "frameworks" DROP CONSTRAINT "frameworks_pkey",
ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001',
ADD CONSTRAINT "frameworks_pkey" PRIMARY KEY ("organizationId", "id");

-- AlterTable
ALTER TABLE "requirements" DROP CONSTRAINT "requirements_pkey",
ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001',
ADD CONSTRAINT "requirements_pkey" PRIMARY KEY ("organizationId", "id");

-- AlterTable
ALTER TABLE "controls" DROP CONSTRAINT "controls_pkey",
ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001',
ADD CONSTRAINT "controls_pkey" PRIMARY KEY ("organizationId", "id");

-- AlterTable
ALTER TABLE "proof_requirements" DROP CONSTRAINT "proof_requirements_pkey",
ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001',
ADD CONSTRAINT "proof_requirements_pkey" PRIMARY KEY ("organizationId", "id");

-- AlterTable
ALTER TABLE "evidence" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001';

-- AlterTable
ALTER TABLE "policies" DROP CONSTRAINT "policies_pkey",
ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001',
ADD CONSTRAINT "policies_pkey" PRIMARY KEY ("organizationId", "id");

-- AlterTable
ALTER TABLE "control_policy_links" DROP CONSTRAINT "control_policy_links_pkey",
ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001',
ADD CONSTRAINT "control_policy_links_pkey" PRIMARY KEY ("organizationId", "controlId", "policyId");

-- AlterTable
ALTER TABLE "policy_approvals" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001';

-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001';

-- AlterTable
ALTER TABLE "role_assignments" DROP CONSTRAINT "role_assignments_pkey",
ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001',
ADD CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("organizationId", "role");

-- AlterTable
ALTER TABLE "breaches" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001';

-- AlterTable
ALTER TABLE "breach_steps" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001';

-- AlterTable
ALTER TABLE "data_requests" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001',
ALTER COLUMN "number" DROP DEFAULT;

-- AlterTable
ALTER TABLE "data_request_tasks" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001';

-- AlterTable
ALTER TABLE "website_checks" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001';

-- AlterTable
ALTER TABLE "company_logo" DROP CONSTRAINT "company_logo_pkey",
DROP COLUMN "id",
ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '01a1cb00-0000-7000-8000-000000000001',
ADD CONSTRAINT "company_logo_pkey" PRIMARY KEY ("organizationId");

-- CreateIndex
CREATE INDEX "activity_events_organizationId_seq_idx" ON "activity_events"("organizationId", "seq");

-- CreateIndex
CREATE INDEX "activity_events_organizationId_action_seq_idx" ON "activity_events"("organizationId", "action", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "profile_entries_organizationId_key_key" ON "profile_entries"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "requirements_organizationId_frameworkId_templateId_key" ON "requirements"("organizationId", "frameworkId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "controls_organizationId_frameworkId_templateId_key" ON "controls"("organizationId", "frameworkId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "policies_organizationId_frameworkId_templateId_key" ON "policies"("organizationId", "frameworkId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "policy_approvals_organizationId_policyId_version_key" ON "policy_approvals"("organizationId", "policyId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "persons_organizationId_email_key" ON "persons"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "data_requests_organizationId_number_key" ON "data_requests"("organizationId", "number");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_anchor" ADD CONSTRAINT "activity_anchor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_entries" ADD CONSTRAINT "profile_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frameworks" ADD CONSTRAINT "frameworks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_organizationId_frameworkId_fkey" FOREIGN KEY ("organizationId", "frameworkId") REFERENCES "frameworks"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_organizationId_frameworkId_fkey" FOREIGN KEY ("organizationId", "frameworkId") REFERENCES "frameworks"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_organizationId_requirementId_fkey" FOREIGN KEY ("organizationId", "requirementId") REFERENCES "requirements"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_requirements" ADD CONSTRAINT "proof_requirements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_requirements" ADD CONSTRAINT "proof_requirements_organizationId_controlId_fkey" FOREIGN KEY ("organizationId", "controlId") REFERENCES "controls"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_organizationId_controlId_fkey" FOREIGN KEY ("organizationId", "controlId") REFERENCES "controls"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_organizationId_proofRequirementId_fkey" FOREIGN KEY ("organizationId", "proofRequirementId") REFERENCES "proof_requirements"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_organizationId_frameworkId_fkey" FOREIGN KEY ("organizationId", "frameworkId") REFERENCES "frameworks"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_policy_links" ADD CONSTRAINT "control_policy_links_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_policy_links" ADD CONSTRAINT "control_policy_links_organizationId_controlId_fkey" FOREIGN KEY ("organizationId", "controlId") REFERENCES "controls"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_policy_links" ADD CONSTRAINT "control_policy_links_organizationId_policyId_fkey" FOREIGN KEY ("organizationId", "policyId") REFERENCES "policies"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_approvals" ADD CONSTRAINT "policy_approvals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_approvals" ADD CONSTRAINT "policy_approvals_organizationId_policyId_fkey" FOREIGN KEY ("organizationId", "policyId") REFERENCES "policies"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breaches" ADD CONSTRAINT "breaches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breach_steps" ADD CONSTRAINT "breach_steps_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_request_tasks" ADD CONSTRAINT "data_request_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_checks" ADD CONSTRAINT "website_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_logo" ADD CONSTRAINT "company_logo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropDefault
ALTER TABLE "invitations" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "activity_events" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "activity_anchor" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "profile_entries" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "frameworks" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "requirements" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "controls" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "proof_requirements" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "evidence" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "policies" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "control_policy_links" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "policy_approvals" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "persons" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "role_assignments" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "breaches" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "breach_steps" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "data_requests" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "data_request_tasks" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "website_checks" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DropDefault
ALTER TABLE "company_logo" ALTER COLUMN "organizationId" DROP DEFAULT;
