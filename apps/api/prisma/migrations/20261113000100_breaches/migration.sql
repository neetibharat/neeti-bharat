-- Breaches and the steps taken on each.

-- CreateEnum
CREATE TYPE "BreachStep" AS ENUM ('found', 'assess', 'tell_board', 'tell_people', 'close');

-- CreateTable
CREATE TABLE "breaches" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "foundAt" TIMESTAMPTZ(3) NOT NULL,
    "affectedSystems" TEXT NOT NULL,
    "affectedData" TEXT NOT NULL,
    "peopleAffected" INTEGER,
    "reportedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "breaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breach_steps" (
    "id" TEXT NOT NULL,
    "breachId" TEXT NOT NULL,
    "step" "BreachStep" NOT NULL,
    "completedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedByName" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "breach_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "breach_steps_breachId_idx" ON "breach_steps"("breachId");

-- CreateIndex
CREATE UNIQUE INDEX "breach_steps_breachId_step_key" ON "breach_steps"("breachId", "step");

-- AddForeignKey
ALTER TABLE "breach_steps" ADD CONSTRAINT "breach_steps_breachId_fkey" FOREIGN KEY ("breachId") REFERENCES "breaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

