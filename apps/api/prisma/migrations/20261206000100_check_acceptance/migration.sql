-- CreateTable
CREATE TABLE "check_acceptances" (
    "organizationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL,
    "acceptedByName" TEXT NOT NULL,
    "acceptedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "check_acceptances_connectionId_checkId_resourceName_key" ON "check_acceptances"("connectionId", "checkId", "resourceName");

-- AddForeignKey
ALTER TABLE "check_acceptances" ADD CONSTRAINT "check_acceptances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_acceptances" ADD CONSTRAINT "check_acceptances_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
