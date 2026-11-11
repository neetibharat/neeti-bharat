-- AlterTable
ALTER TABLE "evidence" ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSha256" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileType" TEXT;

-- A file needs all its file columns; the other kinds are unchanged.
ALTER TABLE "evidence" DROP CONSTRAINT "evidence_kind_payload";
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_kind_payload" CHECK (("kind" = 'link' AND "url" IS NOT NULL) OR ("kind" = 'note' AND "note" IS NOT NULL) OR ("kind" = 'file' AND "fileKey" IS NOT NULL AND "fileName" IS NOT NULL AND "fileSize" IS NOT NULL AND "fileType" IS NOT NULL AND "fileSha256" IS NOT NULL));
