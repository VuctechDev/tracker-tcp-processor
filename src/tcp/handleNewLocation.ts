import db from "../db";
import { checkGeofenceViolation } from "../lib/handlers/checkGeofenceViolation";
import { haversineDistance } from "../lib/utils/haversineDistance";
import { GpsPacket } from "./decoders/gps";
import { shouldSendNotification } from "../lib/services/geofence-notification/shouldSendNotification";
import { redisMethodes } from "../redis";

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

  if (distance < 15) return;

  db.records.insert(data, distance);
  db.devices.updateStatus(deviceId, "dynamic");
  const { isInside, bearing } = await checkGeofenceViolation(deviceId, data);

  if (!isInside) {
    await shouldSendNotification(deviceId, bearing);
  }

  await redisMethodes.distance.insert(deviceId, distance);
};
