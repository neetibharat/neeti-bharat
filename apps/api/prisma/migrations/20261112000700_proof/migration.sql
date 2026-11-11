-- Proof: what each control needs and what was given.

-- CreateEnum
CREATE TYPE "ProofFrequency" AS ENUM ('once', 'monthly', 'quarterly', 'yearly');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('link', 'note');

-- CreateTable
CREATE TABLE "proof_requirements" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "frequency" "ProofFrequency" NOT NULL DEFAULT 'yearly',
    "assigneeId" TEXT,
    "dueDate" TIMESTAMPTZ(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "proof_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "note" TEXT,
    "proofRequirementId" TEXT,
    "addedById" TEXT NOT NULL,
    "addedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proof_requirements_controlId_idx" ON "proof_requirements"("controlId");

-- CreateIndex
CREATE INDEX "proof_requirements_assigneeId_idx" ON "proof_requirements"("assigneeId");

-- CreateIndex
CREATE INDEX "evidence_controlId_createdAt_idx" ON "evidence"("controlId", "createdAt");

-- CreateIndex
CREATE INDEX "evidence_proofRequirementId_createdAt_idx" ON "evidence"("proofRequirementId", "createdAt");

-- Proof carries what its kind needs: a link has its address, a note has its text.
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_kind_payload" CHECK (("kind" = 'link' AND "url" IS NOT NULL) OR ("kind" = 'note' AND "note" IS NOT NULL));

-- AddForeignKey
ALTER TABLE "proof_requirements" ADD CONSTRAINT "proof_requirements_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_requirements" ADD CONSTRAINT "proof_requirements_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_proofRequirementId_fkey" FOREIGN KEY ("proofRequirementId") REFERENCES "proof_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
