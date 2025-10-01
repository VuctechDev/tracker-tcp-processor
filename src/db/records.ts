import { sub } from "date-fns";
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

const getByIMEI = async (imei: string, interval = "3") => {
  const since = sub(new Date(), { days: +interval });
  const data = await prisma.records.findMany({
    where: { deviceId: imei, createdAt: { gte: since } },
    orderBy: {
      createdAt: "desc",
    },
  });
  if (data?.length) {
    return data;
  }

  const lastRecord = await getLastRecordByIMEI(imei);

  return lastRecord ? [lastRecord] : [];
};

export { get, getByIMEI, getLastRecordByIMEI, insert };
