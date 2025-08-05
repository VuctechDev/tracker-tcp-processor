import prisma from "./prizma";
import { generateCode } from "../lib/utils/generateCode";
import { StatusPacket } from "../decoders/status";

export interface UserType {
  id: number;
  name: string;
  code: string;
  organizationId: number;
}

const get = async () => {
  return await prisma.users.findMany({
    include: { organization: true },
  });
};

const getByCode = async (code: string) => {
  return await prisma.users.findFirst({
    where: { code },
  });
};

const create = async (name: string, organizationId: number) => {
  const code = generateCode();
  await prisma.users.create({
    data: {
      name,
      code,
      organizationId,
    },
  });
  console.log(`[NEW USER] Created ${name} - ${code}`);
};

const update = async (data: { id: number; organizationId: number }) => {
  await prisma.users.update({
    where: { id: data.id },
    data: {
      organizationId: data.organizationId,
    },
  });
  console.log(`[UPDATED USER] Updated ${data.id}`);
};

export { get, getByCode, create, update };
