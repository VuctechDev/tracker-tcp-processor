-- CreateTable
CREATE TABLE "records" (
    "id" SERIAL NOT NULL,
    "deviceId" TEXT NOT NULL,
    "long" DECIMAL(65,30) NOT NULL,
    "lat" DECIMAL(65,30) NOT NULL,
    "speed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);
