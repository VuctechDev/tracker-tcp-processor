-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE
);

-- Insert Default organization (ensure id=1)
INSERT INTO "organizations" ("id", "name")
VALUES (1, 'Default')
ON CONFLICT ("id") DO NOTHING;

-- AlterTable: add organizationId with default 1 and NOT NULL
ALTER TABLE "devices"
ADD COLUMN "organizationId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "devices"
ADD CONSTRAINT "devices_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "organizations"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
