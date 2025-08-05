-- DropForeignKey
ALTER TABLE "geofences" DROP CONSTRAINT "geofences_deviceId_fkey";

-- AlterTable
ALTER TABLE "geofences" ALTER COLUMN "deviceId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("imei") ON DELETE CASCADE ON UPDATE CASCADE;
