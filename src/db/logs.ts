import prisma from "./prizma";
import { generateCode } from "../utils/generateCode";
import { StatusPacket } from "../decoders/status";

interface LogType {
  id: number;
  imei: string;
  protocol: string;
  received: string;
  ack: string;
  createdAt: string;
}

export interface LogCreateType {
  imei: string;
  protocol: string;
  received: string;
  ack: string;
}

const insert = async (data: LogCreateType) => {
  await prisma.logs.create({
    data,
  });
};

const get = async () => {
  return await prisma.logs.findMany({
    take: 500,
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getByIMEI = async (imei: string) => {
  return await prisma.logs.findMany({
    take: 500,
    where: { imei },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export { get, getByIMEI, insert };
