-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "lastAttemptAt" TIMESTAMPTZ(3),
ADD COLUMN     "schedule" TEXT NOT NULL DEFAULT 'off',
ADD COLUMN     "scheduleFailedAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "connection_runs" ADD COLUMN     "bySchedule" BOOLEAN NOT NULL DEFAULT false;
