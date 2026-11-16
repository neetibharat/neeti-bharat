-- The activity log, which can only be added to.

-- CreateTable
CREATE TABLE "activity_events" (
    "id" TEXT NOT NULL,
    "seq" BIGSERIAL NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subjectType" TEXT,
    "subjectId" TEXT,
    "details" JSONB,
    "before" JSONB,
    "after" JSONB,
    "prevHash" TEXT,
    "hash" TEXT NOT NULL,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- The newest event of the chain, so a chain with events removed from its end can be told from a whole one.
CREATE TABLE "activity_anchor" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastSeq" BIGINT NOT NULL,
    "lastHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_anchor_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "activity_anchor_single_row" CHECK ("id" = 1)
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_events_seq_key" ON "activity_events"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "activity_events_hash_key" ON "activity_events"("hash");

-- CreateIndex
CREATE INDEX "activity_events_action_seq_idx" ON "activity_events"("action", "seq");

-- CreateIndex
CREATE INDEX "activity_events_occurredAt_idx" ON "activity_events"("occurredAt");

-- Append-only. Updates are never allowed. Deletes are allowed only inside a transaction that has set
-- app.log_purge = 'on', which only the retention job does, after the legal keep-for period.
CREATE FUNCTION activity_events_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND current_setting('app.log_purge', true) = 'on' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'activity_events is append-only (% refused)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_events_no_change
  BEFORE UPDATE OR DELETE ON activity_events
  FOR EACH ROW EXECUTE FUNCTION activity_events_guard();

CREATE TRIGGER activity_events_no_truncate
  BEFORE TRUNCATE ON activity_events
  FOR EACH STATEMENT EXECUTE FUNCTION activity_events_guard();

-- Start the anchor at the current newest event, if the log already has any.
INSERT INTO "activity_anchor" ("id", "lastSeq", "lastHash")
SELECT 1, "seq", "hash" FROM "activity_events" ORDER BY "seq" DESC LIMIT 1;
