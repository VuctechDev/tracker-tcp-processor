import prisma from ".";
import { Prisma } from "../generated/prisma";

export const insert = async () => {
  await prisma.records.create({
    data: {
      deviceId: "12345AASS",
      lat: new Prisma.Decimal(`${Math.random() * 100}`),
      long: new Prisma.Decimal(`${Math.random() * 100}`),
      speed: 45,
      createdAt: new Date("2025-05-13 23:33:46.771"),
    },
  });
};
