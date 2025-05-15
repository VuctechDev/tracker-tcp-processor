import { Prisma } from "@prisma/client";
import prisma from ".";
import { GpsPacket } from "../decoders/gps";

export const insert = async (data: GpsPacket) => {
  await prisma.records.create({
    data: {
      deviceId: data.deviceId,
      lat: new Prisma.Decimal(`${data?.latitude}`),
      long: new Prisma.Decimal(`${data?.longitude}`),
      speed: data?.speed,
      createdAt: data?.dateTimeUTC ? new Date(data?.dateTimeUTC) : undefined,
    },
  });
};
