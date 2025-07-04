/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/

UPDATE "devices"
SET "organizationId" = (
  SELECT "id" FROM "organizations" WHERE "name" = 'Default'
)
WHERE "organizationId" IS NULL;

-- 5. Alter devices: set organizationId to NOT NULL
ALTER TABLE "devices"
ALTER COLUMN "organizationId" SET NOT NULL;

-- 6. Create users table
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL
);

-- 7. Create unique index on users.code
CREATE UNIQUE INDEX "users_code_key" ON "users"("code");

-- 8. Add foreign key constraint on devices.organizationId
ALTER TABLE "devices"
ADD CONSTRAINT "devices_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "organizations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Add foreign key constraint on users.organizationId
ALTER TABLE "users"
ADD CONSTRAINT "users_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "organizations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");
