import prisma from "./prizma";
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

const create = async (name: string) => {
  await prisma.organizations.create({
    data: {
      name,
    },
  });
  console.log(`[NEW ORGANIZATION] Created ${name}`);
};

const update = async (data: StatusPacket) => {};

export { create, update };
