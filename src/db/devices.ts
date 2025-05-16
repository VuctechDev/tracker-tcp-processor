import prisma from "./prizma";
import { generateCode } from "../utils/generateCode";
import { StatusPacket } from "../decoders/status";

interface DeviceType {
  imei: string;
  code: string;
  battery: number;
  signal: number;
  version: number;
  status: "static" | "dynamic";
}

const get = async () => {
  return await prisma.devices.findMany();
};

const getByIMEI = async (imei: string) => {
  return await prisma.devices.findFirst({
    where: {
      imei,
    },
  });
};

const create = async (imei: string) => {
  await prisma.devices.create({
    data: {
      imei,
      code: generateCode(),
      battery: 0,
      signal: 0,
      version: 1,
      status: "static",
    },
  });
  console.log(`[NEW DEVICE] Created ${imei}`);
};

const update = async (data: StatusPacket) => {
  await prisma.devices.update({
    where: { imei: data.imei },
    data: {
      battery: data.battery ?? 0,
      signal: data.signal ?? 0,
      version: data.version ?? 1,
    },
  });
};

const updateStatus = async (imei: string, status: "static" | "dynamic") => {
  await prisma.devices.update({
    where: { imei },
    data: { status: status ?? "static" },
  });
};

export { get, getByIMEI, create, update, updateStatus };
