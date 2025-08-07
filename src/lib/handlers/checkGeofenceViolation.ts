import db from "../../db";
import * as turf from "@turf/turf";
import { getCompassDirection } from "../utils/getCompassDirection";
import { GpsPacket } from "../../tcp/decoders/gps";

export const checkGeofenceViolation = async (
  deviceId: string,
  data: GpsPacket
): Promise<{
  isInside: boolean;
  direction?: string;
}> => {
  try {
    const geofence = (await db.geofences.getById(deviceId)) as {
      coordinates: number[][];
      active: boolean;
    };

    if (!geofence || !geofence?.coordinates?.length || !geofence.active) {
      return { isInside: true };
    }

    const turfPolygonCoords = geofence.coordinates.map(([lat, lng]) => [
      lng,
      lat,
    ]);
    const first = turfPolygonCoords[0];
    turfPolygonCoords.push([...first]);

    const polygon = turf.polygon([turfPolygonCoords]);
    const point = turf.point([data.longitude, data.latitude]);
    const isInside = turf.booleanPointInPolygon(point, polygon);

    if (isInside) {
      return { isInside: true };
    }

    // Calculate direction of violation
    const centroid = turf.centroid(polygon);
    const bearing = turf.bearing(centroid, point); // degrees from north

    const direction = getCompassDirection(bearing);
    console.log("isInside: ", deviceId, isInside, direction);
    return { isInside: false, direction };
  } catch (error) {
    console.error("Geofence validation error:", error);
    return { isInside: true };
  }
};
