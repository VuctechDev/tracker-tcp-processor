-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lang" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "geofences" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "coordinates" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "geofences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "geofences_deviceId_key" ON "geofences"("deviceId");

-- AddForeignKey
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
