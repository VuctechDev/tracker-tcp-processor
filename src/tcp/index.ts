import net from "net";
import db from "../db";
import { devices } from "../devices";
import { handleHCS048Data } from "./protocols/HCS048";
import { handle7878Data } from "./protocols/7878";

const server = net.createServer((socket) => {
  console.log(
    `[TCP] Client connected from ${socket.remoteAddress}:${socket.remotePort}`
  );
  socket.on("data", async (data) => {
    await handleHCS048Data(socket, data);
    await handle7878Data(socket, data);
  });

  socket.on("close", () => {
    const imei = (socket as any).imei;
    if (imei) {
      devices.delete(imei);
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
