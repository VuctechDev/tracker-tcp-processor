import db from "../../db";
import { GpsPacket } from "../../decoders/gps";
import * as turf from "@turf/turf";

export const sendEmail = async (deviceId: string, direction: string) => {
  const device = await db.devices.getByIMEI(deviceId);
  if (!device?.organization?.email) {
    return;
  }
  return fetch(`https://emailer.pikado.net/emailer/send`, {
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.EMAILER_API_KEY ?? "",
    },
    method: "POST",
    body: JSON.stringify({
      from: "Geofence Incident <info@pikado.net>",
      to: device?.organization?.email,
      subject: `${device?.name} Device - Geofence Violation Detected`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #d32f2f;">Geofence Alert</h2>
          <p>
            The device <strong>${
              device?.name
            }</strong> has <strong>exited the defined geofence</strong>.
          </p>
          <p>
            <strong>Direction:</strong> ${
              direction.charAt(0).toUpperCase() + direction.slice(1)
            }<br />
            <strong>Time:</strong> ${new Date().toLocaleString("en-GB", {
              hour12: false,
              timeZone: "UTC",
            })} UTC
          </p>
          <p style="margin-top: 20px;">
            Please check the tracking dashboard to obtain more information.
          </p>
        </div>
      `,
    }),
  });
};

function getCompassDirection(bearing: number): string {
  const directions = [
    "north",
    "northeast",
    "east",
    "southeast",
    "south",
    "southwest",
    "west",
    "northwest",
  ];
  const index = Math.round(((bearing + 360) % 360) / 45) % 8;
  return directions[index];
}

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
      return { isInside: false };
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

    return { isInside: false, direction };
  } catch (error) {
    console.error("Geofence validation error:", error);
    return { isInside: false };
  }
};
