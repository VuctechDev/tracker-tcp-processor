import db from "../../db";
import { redis } from "..";
import { checkGeofenceViolation } from "./checkGeofenceViolation";
import { haversineDistance } from "../utils/haversineDistance";
import { maybeSendNotification } from "../services/maybeSendNotification";
import { GpsPacket } from "../../tcp/decoders/gps";

export const handleNewLocation = async (data: GpsPacket) => {
  const deviceId = data.imei;
  const lastLoc = await db.records.getLastRecordByIMEI(deviceId);

  if (!lastLoc) {
    db.records.insert(data);
    db.devices.updateStatus(deviceId, "dynamic");

    // const isInside = await checkGeofenceViolation(deviceId, data);
    // if (!isInside) {
    //   await maybeSendNotification(deviceId);
    // }
    return;
  }

  const distance = haversineDistance(
    lastLoc.lat?.toNumber(),
    lastLoc.long?.toNumber(),
    data.latitude,
    data.longitude
  );

  if (distance < 15) return;

  db.records.insert(data);
  db.devices.updateStatus(deviceId, "dynamic");
  const { isInside, direction } = await checkGeofenceViolation(deviceId, data);

  if (!isInside) {
    await maybeSendNotification(deviceId, direction);
  }

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
