-- 1. Create organizations table
CREATE TABLE "organizations" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- 2. Insert Default organization (auto id)
INSERT INTO "organizations" ("name")
VALUES ('Default')
ON CONFLICT ("name") DO NOTHING;

-- 3. Alter devices: add organizationId as nullable
ALTER TABLE "devices"
ADD COLUMN "organizationId" INTEGER;

-- 4. Backfill existing devices with Default organization id

