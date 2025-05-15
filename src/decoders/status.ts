interface StatusPacket {
  protocol: string;
  battery: number;
  version: number;
  timezone: number;
  interval: number;
  signalStrength?: number;
}

export function parseStatusPacket(hexStr: string): StatusPacket | null {
  try {
    if (!hexStr.startsWith("7878"))
      throw new Error("[ERROR] Invalid start bits");
    const length = parseInt(hexStr.substring(4, 6), 16);
    const protocol = hexStr.substring(6, 8);
    if (protocol !== "13") throw new Error("[ERROR] Not a status packet");

    const battery = parseInt(hexStr.substring(8, 10), 16);
    const version = parseInt(hexStr.substring(10, 12), 16);
    const timezone = parseInt(hexStr.substring(12, 14), 16);
    const interval = parseInt(hexStr.substring(14, 16), 16);

    let signalStrength: number | undefined;
    if (length === 7) {
      signalStrength = parseInt(hexStr.substring(16, 18), 16);
    }

    console.log(`[STATUS] Battery: ${battery}%`);
    console.log(`[STATUS] Version: ${version}`);
    console.log(`[STATUS] TZ: ${timezone}`);
    console.log(`[STATUS] Interval: ${interval} min`);
    console.log(`[STATUS] Signal Strength: ${signalStrength}`);

    return {
      protocol,
      battery,
      version,
      timezone,
      interval,
      ...(signalStrength !== undefined && { signalStrength }),
    };
  } catch (err) {
    console.error("Failed to parse status packet:", err);
    return null;
  }
}
