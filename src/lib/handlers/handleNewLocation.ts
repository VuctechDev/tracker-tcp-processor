import db from "../../db";
import { redis } from "..";
import { GpsPacket } from "../../decoders/gps";

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // in meters
}

export const handleNewLocation = async (data: GpsPacket) => {
  const deviceId = data.imei;
  const lastLoc = await db.records.getLastRecordByIMEI(deviceId);

  if (!lastLoc) {
    db.records.insert(data);
    db.devices.updateStatus(deviceId, "dynamic");
    return;
  }

  const distance = haversineDistance(
    lastLoc.lat?.toNumber(),
    lastLoc.long?.toNumber(),
    data.latitude,
    data.longitude
  );
  console.log("distance: ", distance);

  if (distance < 10) return;
  db.records.insert(data);
  db.devices.updateStatus(deviceId, "dynamic");

  const timestamp = new Date().getTime();

  try {
    const zKey = `device:${deviceId}:distances`;
    await redis.zAdd(zKey, [{ score: timestamp, value: distance.toString() }]);
    await redis.expire(zKey, 60 * 60 * 24 + 60);

    const listKey = `device:${deviceId}:buffer`;
    await redis.rPush(listKey, JSON.stringify({ distance, timestamp }));

    await redis.lTrim(listKey, -120, -1);
    console.log(`[✅ REDIS] Wrote distance ${distance} for ${deviceId}`);
  } catch (err) {
    console.error(`[❌ REDIS ERROR] Failed to write for ${deviceId}:`, err);
  }
};
