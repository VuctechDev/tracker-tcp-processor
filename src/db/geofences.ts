import prisma from "./prizma";

export interface LogCreateType {
  imei: string;
  protocol: string;
  received: string;
  ack: string;
}

const insert = async (data: { deviceId: string; coordinates: number[] }) => {
  return await prisma.geofences.create({
    data: {
      deviceId: data.deviceId,
      coordinates: data.coordinates,
      active: true,
    },
  });
};

const updateCoordinates = async (data: {
  deviceId: string;
  coordinates: number[];
}) => {
  return await prisma.geofences.update({
    where: { deviceId: data.deviceId },
    data: {
      coordinates: data.coordinates,
    },
  });
};

const getById = async (deviceId: string) => {
  return await prisma.geofences.findFirst({
    where: { deviceId },
  });
};

export { getById, insert, updateCoordinates };
