-- AlterTable
ALTER TABLE "connection_runs" ADD COLUMN     "rechecked" TEXT[] DEFAULT ARRAY[]::TEXT[];
