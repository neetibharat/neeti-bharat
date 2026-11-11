-- Frameworks, their rules and the controls under them.

-- CreateEnum
CREATE TYPE "RequirementCondition" AS ENUM ('always', 'children', 'abroad', 'sdf');

-- CreateTable
CREATE TABLE "frameworks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "seal" TEXT NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "templateId" TEXT,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "appliesWhen" "RequirementCondition" NOT NULL DEFAULT 'always',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controls" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "templateId" TEXT,
    "requirementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerRole" "JobRole",
    "assigneeId" TEXT,
    "reviewDate" TIMESTAMPTZ(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "controls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "requirements_frameworkId_sortOrder_idx" ON "requirements"("frameworkId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "requirements_frameworkId_templateId_key" ON "requirements"("frameworkId", "templateId");

-- CreateIndex
CREATE INDEX "controls_frameworkId_requirementId_idx" ON "controls"("frameworkId", "requirementId");

-- CreateIndex
CREATE INDEX "controls_requirementId_idx" ON "controls"("requirementId");

-- CreateIndex
CREATE INDEX "controls_assigneeId_idx" ON "controls"("assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "controls_frameworkId_templateId_key" ON "controls"("frameworkId", "templateId");

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
