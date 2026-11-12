-- CreateTable
CREATE TABLE "company_logo" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileSha256" TEXT NOT NULL,
    "updatedByName" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "company_logo_pkey" PRIMARY KEY ("id")
);
