import net from "net";

import { addLog, removeSocket, sendAck } from "..";
import { handleMultiLbsWifi } from "./decoders/handleMultiLbsWifi";
import { parseConnectionPacket } from "./decoders/connect";
import db from "../db";
import { parseGpsPacket } from "./decoders/gps";
import { parseStatusPacket } from "./decoders/status";
import { getCurrentGMTTimeHex } from "../lib/utils/getCurrentGMTTimeHex";
import { handleNewLocation } from "../lib/handlers/handleNewLocation";
import { handleUnknown, protocolHandlers } from "./handlers";

const bufferToHex = (buffer: Buffer) => buffer.toString("hex").toUpperCase();

const decodePacket = async (hexStr: string, socket: net.Socket) => {
  try {
    const protocol = hexStr.substring(6, 8).toUpperCase();
    const imei = (socket as any).imei || "UNKNOWN";

    console.log(`[INFO] Protocol: ${protocol}, IMEI: ${imei}`);

    const handler = protocolHandlers[protocol] || handleUnknown;
    await handler(hexStr, socket);
  } catch (err) {
    console.error("[ERROR] Failed to decode packet:", err);
  }
};

const server = net.createServer((socket) => {
  console.log(
    `Client connected from ${socket.remoteAddress}:${socket.remotePort}`
  );

  socket.on("data", (data) => {
    const hexStr = bufferToHex(data);
    console.log(`[RECEIVED] ${hexStr} - IMEI: ${(socket as any).imei}`);

    if (data.length < 5 || data[0] !== 0x78 || data[1] !== 0x78) {
      console.log("Invalid connection. Destroyed.");
      socket.destroy();
      return;
    }

    decodePacket(hexStr, socket);
  });

  socket.on("close", () => {
    const imei = (socket as any).imei;
    if (imei) {
      removeSocket(imei);
      db.devices.updateStatus(imei, "offline");
    }
    console.log(`Client disconnected: ${socket.remoteAddress} - ${imei}`);
  });

  socket.on("error", (err) => {
    console.error(`Socket Error: ${err.message}`);
  });
});

server.on("error", (err) => {
  console.error(`Server Error: ${err.message}`);
});

export const tcpInit = (TCP_PORT: string, HOST: string) => {
  server.listen(parseInt(TCP_PORT), HOST, () => {
    console.log(`TCP app running on PORT: ${TCP_PORT}`);
  });
};
