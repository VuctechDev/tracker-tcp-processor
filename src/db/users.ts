import prisma from "./prizma";
import { generateCode } from "../utils/generateCode";
import { StatusPacket } from "../decoders/status";

export interface UserType {
  id: number;
  name: string;
  code: string;
  organizationId: number;
}

const getByCode = async (code: string) => {
  return await prisma.users.findFirst({
    where: { code },
  });
};

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

export { getByCode, create, update };
