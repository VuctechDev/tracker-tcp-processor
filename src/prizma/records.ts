import { Prisma } from "@prisma/client";
import prisma from ".";
import { GpsPacket } from "../gps";

export const insert = async (data: GpsPacket) => {
  await prisma.records.create({
    data: {
      deviceId: "0861261021070616",
      lat: new Prisma.Decimal(`${data?.latitude}`),
      long: new Prisma.Decimal(`${data?.longitude}`),
      speed: data?.speed,
      createdAt: data?.dateTimeUTC ? new Date(data?.dateTimeUTC) : undefined,
    },
  });
};
