-- CreateTable
CREATE TABLE "trainings" (
    "organizationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT,
    "url" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_completions" (
    "organizationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "completedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "training_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trainings_organizationId_name_key" ON "trainings"("organizationId", "name");

-- CreateIndex
CREATE INDEX "training_completions_personId_idx" ON "training_completions"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "training_completions_trainingId_personId_key" ON "training_completions"("trainingId", "personId");

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "trainings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
