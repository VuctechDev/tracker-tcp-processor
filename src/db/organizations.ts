import { StatusPacket } from "../tcp/decoders/status";
import prisma from "./prizma";

interface OrganizationType {
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
  return await prisma.organizations.findMany({
    include: { devices: true, users: true },
  });
};

const getById = async (organizationId: string) => {
  return await prisma.organizations.findUnique({
    where: { id: parseInt(organizationId) },
  });
};

const create = async (name: string) => {
  await prisma.organizations.create({
    data: {
      name,
    },
  });
  console.log(`[NEW ORGANIZATION] Created ${name}`);
};

const update = async (data: StatusPacket) => {};

export { get, getById, create, update };
