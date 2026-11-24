-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "groupsOff" TEXT[] DEFAULT ARRAY[]::TEXT[];
