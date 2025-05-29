/*
  Warnings:

  - Added the required column `updatedAt` to the `devices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "devices" ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW();
