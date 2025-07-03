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

const create = async (name: string) => {
  const code = generateCode();
  await prisma.users.create({
    data: {
      name,
      code,
      organization: {
        connect: { name: "default-root-organization" },
      },
    },
  });
  console.log(`[NEW USER] Created ${name} - ${code}`);
};

const update = async (data: StatusPacket) => {};

export { create, update };
