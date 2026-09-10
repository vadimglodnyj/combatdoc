-- AlterTable
ALTER TABLE "consultations" ADD COLUMN "diagnosis" TEXT;

-- Backfill from the parent episode when a consultation has no diagnosis of its own.
UPDATE "consultations" AS c
SET "diagnosis" = e."diagnosis"
FROM "episodes" AS e
WHERE c."episodeId" = e."id"
  AND (c."diagnosis" IS NULL OR c."diagnosis" = '');
