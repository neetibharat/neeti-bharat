-- CreateTable
CREATE TABLE "connections" (
    "organizationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifiers" JSONB NOT NULL,
    "credentials" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMPTZ(3),

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_runs" (
    "organizationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "ranAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ranByName" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "passed" INTEGER NOT NULL,
    "warned" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,

    CONSTRAINT "connection_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "connections_organizationId_createdAt_idx" ON "connections"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "connection_runs_connectionId_ranAt_idx" ON "connection_runs"("connectionId", "ranAt");

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_runs" ADD CONSTRAINT "connection_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_runs" ADD CONSTRAINT "connection_runs_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
