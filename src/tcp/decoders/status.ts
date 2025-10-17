import net from "net";

export type StatusPacket = {
  imei: string;
  protocol: string;
  battery: number;
  version: number;
  timezone: number;
  interval: number;
  signal: number;
  charging: boolean;
  temp: number;
  heartRate: number;
  steps: number;
  activity: number;
  timestamp: string | null;
};

function parseBCDDateYYMMDDhhmmss(bytes: number[]): string | null {
  if (bytes.length < 6) return null;
  const bcd = (n: number) => ((n >> 4) & 0xf) * 10 + (n & 0xf);
  const year = 2000 + bcd(bytes[0]);
  const month = bcd(bytes[1]) || 1;
  const day = bcd(bytes[2]) || 1;
  const hour = bcd(bytes[3]) || 0;
  const minute = bcd(bytes[4]) || 0;
  const second = bcd(bytes[5]) || 0;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}T${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )}:${String(second).padStart(2, "0")}Z`;
}

export function parseStatusPacket(
  hexStr: string,
  socket: net.Socket
): StatusPacket | null {
  try {
    if (!hexStr.startsWith("7878"))
      throw new Error("[ERROR] Invalid start bits");

    let i = 4; // after 7878

    const readByte = () => parseInt(hexStr.slice(i, (i += 2)), 16);
    const readU16 = () => (readByte() << 8) | readByte();
    const readI16 = () => {
      const val = readU16();
      return val & 0x8000 ? val - 0x10000 : val;
    };
    const readU32 = () =>
      (readByte() << 24) | (readByte() << 16) | (readByte() << 8) | readByte();

    const length = readByte();
    const protocol = hexStr.slice(i, i + 2);
    i += 2;
    if (protocol !== "13") throw new Error("[ERROR] Not a status packet");

    const start = i;
    const end = start + length * 2 - 2;
    const stopIndex = Math.min(end, hexStr.length - 4);

    const battery = readByte() || 0;
    const version = readByte() || 0;
    const timezone = readByte() || 0;
    const interval = readByte() || 0;

    let signal = 0,
      charging = false,
      temp = 0,
      heartRate = 0,
      steps = 0,
      activity = 0,
      timestamp: string | null = null;

    if (i < stopIndex) signal = readByte();
    if (i < stopIndex) charging = readByte() === 1;
    if (i + 4 <= stopIndex) temp = readI16() / 10;
    if (i < stopIndex) heartRate = readByte();
    if (i + 8 <= stopIndex) steps = readU32();
    if (i + 4 <= stopIndex) activity = readU16();
    if (i + 12 <= stopIndex) {
      const dateBytes = [
        readByte(),
        readByte(),
        readByte(),
        readByte(),
        readByte(),
        readByte(),
      ];
      timestamp = parseBCDDateYYMMDDhhmmss(dateBytes);
    }

    const packet: StatusPacket = {
      imei: (socket as any).imei || "unknown",
      protocol,
      battery,
      version,
      timezone,
      interval,
      signal,
      charging,
      temp,
      heartRate,
      steps,
      activity,
      timestamp,
    };

    console.log(
      `[STATUS] Battery:${battery}% | Ver:${version} | TZ:${timezone} | Int:${interval} | Sig:${signal} | Charging:${charging} | Temp:${temp}°C | HR:${heartRate} | Steps:${steps} | Act:${activity} | TS:${timestamp}`
    );

    return packet;
  } catch (err) {
    console.error("Failed to parse status packet:", err);
    return null;
  }
}
