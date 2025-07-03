-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_organizationId_fkey";

-- AlterTable
ALTER TABLE "devices" ALTER COLUMN "organizationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
