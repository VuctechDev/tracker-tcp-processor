import prisma from "./prizma";
import { generateCode } from "../lib/utils/generateCode";
import { StatusPacket } from "../tcp/decoders/status";

export interface DeviceType {
  name: string;
  id: number;
  createdAt: Date;
  imei: string;
  code: string;
  battery: number;
  signal: number;
  version: number;
  status: string;
  interval: string;
  updatedAt: Date;
  organizationId: number | null;
}

const get = async () => {
  return await prisma.devices.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: { organization: true },
  });
};

const getByIMEI = async (imei: string) => {
  return await prisma.devices.findFirst({
    where: {
      imei,
    },
    include: { organization: true },
  });
};

const getOrganizationDevices = async (organizationId: string) => {
  return await prisma.devices.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      organizationId: parseInt(organizationId),
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
    },
  });
  console.log(`[NEW DEVICE] Created ${imei}`);
};

const createTest = async (imei: string) => {
  const last = imei.slice(-6);
  await prisma.devices.create({
    data: {
      imei,
      code: generateCode(),
      battery: 0,
      signal: 0,
      version: 1,
      status: "static",
      interval: "60",
      organizationId: 6,
      name: `NewDevice${last}`,
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

const updateFromBO = async (data: {
  name: string;
  id: number;
  organizationId: number;
}) => {
  await prisma.devices.update({
    where: { id: data.id },
    data: { name: data.name, organizationId: data.organizationId },
  });
};

export {
  get,
  getByIMEI,
  getOrganizationDevices,
  create,
  createTest,
  update,
  updateStatus,
  updateInterval,
  updateFromBO,
  setAllOffline,
};
