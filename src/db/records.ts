import prisma from "./prizma";
import { insertInDB } from "../baza";
import { GpsPacket } from "../decoders/gps";
import { Decimal } from "decimal.js";

const insert = async (data: GpsPacket) => {
  insertInDB(data);
  await prisma.records.create({
    data: {
      deviceId: data.imei,
      lat: new Decimal(`${data?.latitude}`),
      long: new Decimal(`${data?.longitude}`),
      speed: data?.speed,
      createdAt: data?.dateTimeUTC ? new Date(data?.dateTimeUTC) : undefined,
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

const getByIMEI = async (imei: string) => {
  return await prisma.records.findMany({
    take: 200,
    where: { deviceId: imei },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export { get, getByIMEI, insert };