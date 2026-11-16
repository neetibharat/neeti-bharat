-- Postgres cannot use a new enum value in the transaction that adds it, so the columns and the check come next.
ALTER TYPE "EvidenceKind" ADD VALUE 'file';
