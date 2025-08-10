import net from "net";
import { handleUnknown, protocolHandlers } from "./handlers";

export const bufferToHex = (buffer: Buffer) =>
  buffer.toString("hex").toUpperCase();

const decodePacket = async (hexStr: string, socket: net.Socket) => {
  try {
    const protocol = hexStr.substring(6, 8).toUpperCase();
    const imei = (socket as any).imei || "UNKNOWN";

    console.log(`[INFO 7878] Protocol: ${protocol}, IMEI: ${imei}`);

    const handler = protocolHandlers[protocol] || handleUnknown;
    await handler(hexStr, socket);
  } catch (err) {
    console.error("[ERROR - 7878] Failed to decode packet:", err);
  }
};

export const handle7878Data = async (
  socket: net.Socket,
  data: Buffer
): Promise<boolean> => {
  const hexStr = bufferToHex(data);
  console.log(`[RECEIVED - 7878] ${hexStr} - IMEI: ${(socket as any).imei}`);

  if (data.length < 5 || data[0] !== 0x78 || data[1] !== 0x78) {
    console.log("[RECEIVED - 7878] Invalid connection. Destroyed.");
    socket.destroy();
    return false;
  }

  decodePacket(hexStr, socket);
  return true;
};
