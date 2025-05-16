-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "imei" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "battery" INTEGER NOT NULL,
    "signal" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_imei_key" ON "devices"("imei");

-- CreateIndex
CREATE UNIQUE INDEX "devices_code_key" ON "devices"("code");
