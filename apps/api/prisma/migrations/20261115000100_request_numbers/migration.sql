-- A short number for each request, shown as REQ-<number>. Requests already logged are numbered in the order they were received.
CREATE SEQUENCE "data_requests_number_seq";

ALTER TABLE "data_requests" ADD COLUMN "number" INTEGER;

UPDATE "data_requests"
SET "number" = numbered."rank"
FROM (
    SELECT "id", row_number() OVER (ORDER BY "receivedAt", "createdAt", "id") AS "rank"
    FROM "data_requests"
) AS numbered
WHERE "data_requests"."id" = numbered."id";

SELECT setval(
    '"data_requests_number_seq"',
    COALESCE((SELECT max("number") FROM "data_requests"), 1),
    (SELECT max("number") FROM "data_requests") IS NOT NULL
);

ALTER TABLE "data_requests" ALTER COLUMN "number" SET NOT NULL;
ALTER TABLE "data_requests" ALTER COLUMN "number" SET DEFAULT nextval('"data_requests_number_seq"');
ALTER SEQUENCE "data_requests_number_seq" OWNED BY "data_requests"."number";

-- CreateIndex
CREATE UNIQUE INDEX "data_requests_number_key" ON "data_requests"("number");
