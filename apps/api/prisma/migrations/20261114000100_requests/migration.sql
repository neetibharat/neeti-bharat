-- People's requests about their data, and the tasks done for each.
-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('access', 'correction', 'erasure', 'nomination', 'complaint');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('new', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "RequestSource" AS ENUM ('email', 'website', 'manual');

-- CreateEnum
CREATE TYPE "TaskOutcome" AS ENUM ('todo', 'done', 'erased', 'kept_by_law');

-- CreateTable
CREATE TABLE "data_requests" (
    "id" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "source" "RequestSource" NOT NULL DEFAULT 'manual',
    "status" "RequestStatus" NOT NULL DEFAULT 'new',
    "personName" TEXT NOT NULL,
    "personEmail" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "identityVerifiedAt" TIMESTAMPTZ(3),
    "identityVerifiedByName" TEXT,
    "identityNote" TEXT,
    "replyNote" TEXT,
    "closedAt" TIMESTAMPTZ(3),
    "closedByName" TEXT,
    "loggedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_request_tasks" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "outcome" "TaskOutcome" NOT NULL DEFAULT 'todo',
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "data_request_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_requests_status_dueAt_idx" ON "data_requests"("status", "dueAt");

-- CreateIndex
CREATE INDEX "data_request_tasks_requestId_idx" ON "data_request_tasks"("requestId");

-- AddForeignKey
ALTER TABLE "data_request_tasks" ADD CONSTRAINT "data_request_tasks_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "data_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

