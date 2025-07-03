/*
  Warnings:

  - You are about to drop the column `organizationId` on the `devices` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_organizationId_fkey";

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "organizationId";
