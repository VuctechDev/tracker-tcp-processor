/*
  Warnings:

  - You are about to alter the column `long` on the `records` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(9,6)`.
  - You are about to alter the column `lat` on the `records` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(9,6)`.

*/
-- AlterTable
ALTER TABLE "records" ALTER COLUMN "long" SET DATA TYPE DECIMAL(9,6),
ALTER COLUMN "lat" SET DATA TYPE DECIMAL(9,6);
