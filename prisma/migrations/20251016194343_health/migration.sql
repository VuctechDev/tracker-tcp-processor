-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "charging" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "temp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "health" (
    "id" SERIAL NOT NULL,
    "deviceId" TEXT NOT NULL,
    "temp" INTEGER NOT NULL,
    "heartRate" INTEGER NOT NULL,
    "steps" INTEGER NOT NULL,
    "activity" INTEGER NOT NULL,

    CONSTRAINT "health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "health_deviceId_key" ON "health"("deviceId");

-- CreateIndex
CREATE INDEX "health_deviceId_idx" ON "health"("deviceId");

-- AddForeignKey
ALTER TABLE "health" ADD CONSTRAINT "health_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("imei") ON DELETE CASCADE ON UPDATE CASCADE;
