-- CreateTable
CREATE TABLE "website_checks" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "checkedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedByName" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "passed" INTEGER NOT NULL,
    "warned" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,

    CONSTRAINT "website_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "website_checks_checkedAt_idx" ON "website_checks"("checkedAt");
