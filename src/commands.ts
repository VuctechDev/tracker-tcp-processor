import db from "./db";
import net from "net";

export const updateDeviceInterval = (
  socket: net.Socket,
  value: string,
  imei: string
): string => {
  const intValue = parseInt(value, 10);
  if (isNaN(intValue)) {
    console.error("Invalid interval value");
    return "";
  }
  const payloadHex = intValue.toString(16).padStart(4, "0");
  const ack = `78780397${payloadHex}0d0a`;
  const buffer = Buffer.from(ack, "hex");
  socket.write(buffer);
  db.devices.updateInterval(imei, value);
  return ack;
};

export const getLocation = (socket: net.Socket) => {
  const ack = "787801800D0A";
  const buffer = Buffer.from(ack, "hex");
  socket.write(buffer);
  return ack;
};

export const restartDevice = (socket: net.Socket): string => {
  const ack = "78780248010D0A";
  const buffer = Buffer.from(ack, "hex");
  socket.write(buffer);
  return ack;
};

export const turnAlarmOnOff = (socket: net.Socket, value: string): string => {
  const ack = `78780249${value}0d0a`;
  const softReset = Buffer.from(ack, "hex");
  socket.write(softReset);
  return ack;
};
