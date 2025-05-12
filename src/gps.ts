interface GpsPacket {
  dateTime: string; // Original hex
  dateTimeUTC: string; // ISO string
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  north: boolean;
  east: boolean;
  positioned: boolean;
}

function decodeGpsCoordinate(hex: string, isPositive: boolean): number {
  const raw = parseInt(hex, 16);
  const totalMinutes = raw / 30000;
  const degrees = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes - degrees * 60;
  const decimal = degrees + minutes / 60;
  const value = isPositive ? decimal : -decimal;
  return value;
}

function convertHexDateTimeToUTC(hex: string): string {
  const year = 2000 + parseInt(hex.substring(0, 2), 16);
  const month = parseInt(hex.substring(2, 4), 16);
  const day = parseInt(hex.substring(4, 6), 16);
  const hour = parseInt(hex.substring(6, 8), 16);
  const minute = parseInt(hex.substring(8, 10), 16);
  const second = parseInt(hex.substring(10, 12), 16);

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return date.toISOString(); // Format: YYYY-MM-DDTHH:mm:ss.sssZ
}

export function parseGpsPacket(hexStr: string): GpsPacket | null {
  try {
    if (!hexStr.startsWith("7878")) throw new Error("Invalid start bits");
    const protocol = hexStr.substring(6, 8);
    if (protocol !== "10") throw new Error("Not a GPS packet");

    const dateTimeHex = hexStr.substring(8, 20); // "19050C121210"
    const dateTimeUTC = convertHexDateTimeToUTC(dateTimeHex);

    const latHex = hexStr.substring(22, 30); // "04CC2B73"
    const lngHex = hexStr.substring(30, 38); // "01D781FC"
    const speedHex = hexStr.substring(38, 40); // "00"
    const statusHex = hexStr.substring(40, 44); // "34EC"

    const speed = parseInt(speedHex, 16);

    const status = parseInt(statusHex, 16);

    // Split into two bytes
    const byte1 = (status >> 8) & 0xff; // first byte (status flags)
    const byte2 = status & 0xff; // second byte (heading)

    const positioned = (byte1 & 0x20) !== 0; // Bit 5: GPS fix
    const east = (byte1 & 0x40) === 0; // Bit 6: 0 = East, 1 = West
    const north = (byte1 & 0x80) !== 0; // Bit 7: 1 = North, 0 = South
    const heading = byte2;
    const gpsSatByte = hexStr.substring(20, 22); // e.g. "9C"
    const satCount = parseInt(gpsSatByte, 16) & 0x0f; // mask lower nibble only

    const latitude = decodeGpsCoordinate(latHex, north);
    const longitude = decodeGpsCoordinate(lngHex, east);

    // ✅ Logging
    console.log(`[INFO] Protocol: ${protocol}`);
    console.log(`[GPS] DateTime: ${dateTimeHex}`);
    console.log(`[GPS] UTC Time: ${dateTimeUTC}`);
    console.log(
      `  ▸ Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`
    );
    console.log(`  ▸ Speed: ${speed} km/h`);
    console.log(`  ▸ Heading: ${heading}°`);
    console.log(
      `  ▸ Positioning: ${positioned ? "Yes" : "No"}, ${
        north ? "North" : "South"
      } latitude, ${east ? "East" : "West"} longitude`
    );
    console.log(`[GPS] Visible Satellites: ${satCount}`);

    return {
      dateTime: dateTimeHex,
      dateTimeUTC,
      latitude,
      longitude,
      speed,
      heading,
      north,
      east,
      positioned,
    };
  } catch (err) {
    console.error("Failed to parse GPS packet:", err);
    return null;
  }
}
