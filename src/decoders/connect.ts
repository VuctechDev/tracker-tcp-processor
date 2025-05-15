import net from "net";
import { devices } from "../devices";

export function parseConnectionPacket(
  hexStr: string,
  socket: net.Socket
): string | null {
  try {
    if (!hexStr.startsWith("7878"))
      throw new Error("[ERROR] Invalid start bits");
    const protocol = hexStr.substring(6, 8);
    if (protocol !== "01") throw new Error("[ERROR] Not a connect packet");

    const imeiBytes = hexStr.substring(8, 24).match(/.{1,2}/g) || [];
    const imei = imeiBytes
      .map((b) => parseInt(b, 16).toString(16).padStart(2, "0"))
      .join("");
    console.log(`[LOGIN] IMEI: ${imei}`);
    (socket as any).imei = imei;
    devices.set(imei, socket);

    return imei;
  } catch (err) {
    console.error("Failed to parse status packet:", err);
    return null;
  }
}
