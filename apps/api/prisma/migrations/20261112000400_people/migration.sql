-- People and who holds each role.

-- CreateEnum
CREATE TYPE "JobRole" AS ENUM ('DPO', 'PRIVACY_LEAD', 'SECURITY_LEAD', 'ENGINEERING_LEAD', 'PROCUREMENT_LEAD', 'HR_LEAD', 'AI_OWNER', 'LEGAL_COUNSEL', 'INTERNAL_AUDIT');

-- CreateEnum
CREATE TYPE "PersonStatus" AS ENUM ('active', 'left');

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT,
    "jobTitle" TEXT,
    "status" "PersonStatus" NOT NULL DEFAULT 'active',
    "leftAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_assignments" (
    "role" "JobRole" NOT NULL,
    "personId" TEXT NOT NULL,
    "since" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("role")
);

-- CreateIndex
CREATE UNIQUE INDEX "persons_email_key" ON "persons"("email");

-- CreateIndex
CREATE INDEX "role_assignments_personId_idx" ON "role_assignments"("personId");

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
