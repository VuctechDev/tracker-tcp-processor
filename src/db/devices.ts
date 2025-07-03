import prisma from "./prizma";
import { generateCode } from "../utils/generateCode";
import { StatusPacket } from "../decoders/status";

interface DeviceType {
  id: number;
  imei: string;
  code: string;
  battery: number;
  signal: number;
  version: number;
  status: "static" | "dynamic";
  createdAt: string;
  updatedAt: string;
}

const get = async () => {
  return await prisma.devices.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getByIMEI = async (imei: string) => {
  return await prisma.devices.findFirst({
    where: {
      imei,
    },
  });
};

const getUserDevices = async (user: { organizationId: number }) => {
  return await prisma.devices.findMany({
    where: {
      organizationId: user.organizationId,
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
      interval: "60",
      organization: {
        connect: { name: "default-root-organization" },
      },
      // name: "",
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

const updateStatus = async (
  imei: string,
  status: "static" | "dynamic" | "offline"
) => {
  await prisma.devices.update({
    where: { imei },
    data: { status: status ?? "static" },
  });
};

const setAllOffline = async () => {
  await prisma.devices.updateMany({
    data: { status: "offline" },
  });
};

const updateInterval = async (imei: string, interval: string) => {
  await prisma.devices.update({
    where: { imei },
    data: { interval: interval ?? "60" },
  });
};

export {
  get,
  getByIMEI,
  getUserDevices,
  create,
  update,
  updateStatus,
  updateInterval,
  setAllOffline,
};
