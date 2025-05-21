-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "interval" TEXT NOT NULL DEFAULT '60',
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'DeviceX';

-- CreateTable
CREATE TABLE "logs" (
    "id" SERIAL NOT NULL,
    "imei" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "received" TEXT NOT NULL,
    "ack" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);
