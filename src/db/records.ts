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
// [RECEIVED] 787815111905101108289F04CC35BA01D7793B2734A300AC000D0A
// 2025-05-16T17:08:55.416717013Z [INFO] Protocol: 11/10
// 2025-05-16T17:08:55.417159613Z [INFO] Protocol: 11/10
// 2025-05-16T17:08:55.418334548Z [GPS] DateTime: 190510110828
// 2025-05-16T17:08:55.418369021Z [GPS] UTC Time: 2025-05-16T17:08:40.000Z
// 2025-05-16T17:08:55.418382403Z   ▸ Latitude: 44.717757, Longitude: 17.165828
// 2025-05-16T17:08:55.418429568Z   ▸ Speed: 39 km/h
// 2025-05-16T17:08:55.418442538Z   ▸ Heading: 163°
// 2025-05-16T17:08:55.418454852Z   ▸ Positioning: Yes, North latitude, East longitude
// 2025-05-16T17:08:55.418467008Z [GPS] Visible Satellites: 15
// 2025-05-16T17:08:55.419775128Z >> [SENT] Ack sent for protocol 11, 787800111905101108280D0A
