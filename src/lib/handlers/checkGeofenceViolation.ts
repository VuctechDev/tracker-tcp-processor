import db from "../../db";
import * as turf from "@turf/turf";
import { GpsPacket } from "../../tcp/decoders/gps";

export type GeofenceViolationReturnType = {
  isInside: boolean;
  bearing?: number;
};

export const checkGeofenceViolation = async (
  deviceId: string,
  data: GpsPacket
): Promise<GeofenceViolationReturnType> => {
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

    const centroid = turf.centroid(polygon);
    const bearing = turf.bearing(centroid, point);

    console.log("isInside: ", deviceId, isInside, bearing);
    return { isInside: false, bearing };
  } catch (error) {
    console.error("Geofence validation error:", error);
    return { isInside: true };
  }
};
