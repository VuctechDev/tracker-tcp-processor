import { devices } from "./devices";
import net from "net";

export function sendCommand(
  socket: net.Socket,
  protocol: string, // e.g. "97"
  payloadHex: string = "" // full hex payload like "0014"
) {
  const header = "7878";
  const footer = "0D0A";

  // Calculate payload length: protocol + payload
  const length = ((protocol.length + payloadHex.length) / 2)
    .toString(16)
    .padStart(2, "0");

  const hexString = header + length + protocol + payloadHex + footer;
  const buffer = Buffer.from(hexString, "hex");

  socket.write(buffer);

  console.log(
    `>> [SENT] Command sent: ${hexString.toUpperCase()} (Protocol: ${protocol})`
  );
}

export const updateDeviceInterval = (
  imei: string,
  value: string,
  protocol: string // protocol code like "97"
) => {
  const socket = devices.get(imei);
  if (!socket) {
    console.warn(`Socket not found for device ${imei}`);
    return;
  }

  const intValue = parseInt(value, 10);
  if (isNaN(intValue)) {
    console.error("Invalid interval value");
    return;
  }

  const payloadHex = intValue.toString(16).padStart(4, "0"); // 2 bytes = 4 hex chars
  console.error(payloadHex);
  sendCommand(socket, protocol, payloadHex);
};
