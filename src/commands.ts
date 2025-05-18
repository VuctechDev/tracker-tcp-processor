import { devices } from "./devices";
import net from "net";

export function sendCommand(
  socket: net.Socket,
  protocol: string,
  payloadHex: string = ""
) {
  const header = "7878";
  const footer = "0D0A";

  // Calculate payload length: protocol + payload
  const length = ((protocol.length + payloadHex.length) / 2)
    .toString(16)
    .padStart(2, "0");

  const hexString = header + length + protocol + payloadHex + footer;
  const buffer = Buffer.from(hexString, "hex");
  console.log(hexString);

  //   socket.write(buffer);

  console.log(
    `>> [SENT] Command sent: ${hexString.toUpperCase()} (Protocol: ${protocol})`
  );
}

export const updateDeviceInterval = (
  imei: string,
  value: string,
  protocol: string
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

  const payloadHex = intValue.toString(16).padStart(4, "0");
  sendCommand(socket, protocol, payloadHex);
};

export const getLocation = (imei: string, value: string, protocol: string) => {
  const socket = devices.get(imei);
  if (!socket) {
    console.warn(`Socket not found for device ${imei}`);
    return;
  }
  sendCommand(socket, protocol, value);
};

export const restartDevice = (imei: string) => {
  const socket = devices.get(imei);
  if (!socket) {
    console.warn(`Socket not found for device ${imei}`);
    return;
  }
  const ack = "78780248010D0A";
  const softReset = Buffer.from(ack, "hex");
  socket.write(softReset);
  console.log(
    `>> [SENT] Soft reset command (restart - 0x48) - IMEI: ${imei}, CODE: ${ack}`
  );
};

export const turnAlarmOn = (imei: string, value: string) => {
  const socket = devices.get(imei);
  if (!socket) {
    console.warn(`Socket not found for device ${imei}`);
    return;
  }
  const ack = `78780249${value}0D0A`;
  const softReset = Buffer.from(ack, "hex");
  socket.write(softReset);
  console.log(
    `>> [SENT] Sound ON/OFF (restart - 0x49) - IMEI: ${imei}, CODE: ${ack}`
  );
};
