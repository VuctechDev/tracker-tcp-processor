import prisma from ".";
import { GpsPacket } from "../decoders/gps";
import { Decimal } from "decimal.js";

export const insert = async (data: GpsPacket) => {
  await prisma.records.create({
    data: {
      deviceId: data.deviceId,
      lat: new Decimal(`${data?.latitude}`),
      long: new Decimal(`${data?.longitude}`),
      speed: data?.speed,
      createdAt: data?.dateTimeUTC ? new Date(data?.dateTimeUTC) : undefined,
    },
  });
};
