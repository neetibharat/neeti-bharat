-- AlterTable
ALTER TABLE "breaches" ADD COLUMN     "assigneeId" TEXT;

-- AlterTable
ALTER TABLE "data_requests" ADD COLUMN     "assigneeId" TEXT;

-- CreateIndex
CREATE INDEX "breaches_assigneeId_idx" ON "breaches"("assigneeId");

-- CreateIndex
CREATE INDEX "data_requests_assigneeId_idx" ON "data_requests"("assigneeId");

-- AddForeignKey
ALTER TABLE "breaches" ADD CONSTRAINT "breaches_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

