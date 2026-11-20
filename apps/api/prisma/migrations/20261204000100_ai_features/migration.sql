-- AlterTable
ALTER TABLE "ai_settings" ADD COLUMN     "disabledFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];
