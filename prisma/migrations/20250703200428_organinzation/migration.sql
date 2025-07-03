-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE
);

-- Insert Default organization if not exists
INSERT INTO "organizations" ("name")
VALUES ('Default')
ON CONFLICT ("name") DO NOTHING;

-- AlterTable: add organizationId as nullable first
ALTER TABLE "devices"
ADD COLUMN "organizationId" INTEGER;

-- Backfill existing devices with Default org id
UPDATE "devices"
SET "organizationId" = (
    SELECT "id" FROM "organizations" WHERE "name" = 'Default'
)
WHERE "organizationId" IS NULL;

-- AlterTable: set organizationId as NOT NULL
ALTER TABLE "devices"
ALTER COLUMN "organizationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "devices"
ADD CONSTRAINT "devices_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "organizations"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
