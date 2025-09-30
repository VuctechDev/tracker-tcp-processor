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
    // where: {
    //   createdAt: {
    //     gt: date, // "greater than" DATE format
    //   },
    // },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// const get = async (date: Date) => {
//   const records = await prisma.records.findMany({
//     where: {
//       createdAt: {
//         gt: date,
//       },
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });

//   if (records.length === 0) {
//     const lastRecord = await prisma.records.findFirst({
//       orderBy: {
//         createdAt: "desc",
//       },
//     });
//     return lastRecord ? [lastRecord] : [];
//   }

//   return records;
// };

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
  return await prisma.records.findMany({
    where: { deviceId: imei, createdAt: { gte: since } },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export { get, getByIMEI, getLastRecordByIMEI, insert };
