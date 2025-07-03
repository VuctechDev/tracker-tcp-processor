-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("imei") ON DELETE RESTRICT ON UPDATE CASCADE;
