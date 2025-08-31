import { GpsPacket } from "../tcp/decoders/gps";
import prisma from "./prizma";
import { Decimal } from "decimal.js";

const insert = async (data: GpsPacket, distance?: number) => {
  await prisma.records.create({
    data: {
      deviceId: data.imei,
      lat: new Decimal(`${data?.latitude}`),
      long: new Decimal(`${data?.longitude}`),
      speed: data?.speed,
      createdAt: data?.dateTimeUTC ? new Date(data?.dateTimeUTC) : undefined,
      distance,
    },
  });
};

const get = async () => {
  return await prisma.records.findMany({
    take: 200,
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getLastRecordByIMEI = async (imei: string) => {
  return await prisma.records.findFirst({
    where: { deviceId: imei },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getByIMEI = async (imei: string) => {
  return await prisma.records.findMany({
    take: 200,
    where: { deviceId: imei },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export { get, getByIMEI, getLastRecordByIMEI, insert };
