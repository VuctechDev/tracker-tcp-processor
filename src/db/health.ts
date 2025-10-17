import { StatusPacket } from "../tcp/decoders/status";
import { DeviceType } from "./devices";
import prisma from "./prizma";

export interface HealthType {
  id: number;
  deviceId: string;
  temp: number;
  heartRate: number;
  steps: number;
  activity: number;
  device?: DeviceType[];
}

const insert = async (data: StatusPacket) => {
  return await prisma.health.create({
    data: {
      deviceId: data.imei,
      temp: data.temp,
      heartRate: data.heartRate,
      steps: data.steps,
      activity: data.activity,
    },
  });
};

const getById = async (deviceId: string) => {
  return await prisma.health.findMany({
    take: 500,
    where: { deviceId },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export { getById, insert };
