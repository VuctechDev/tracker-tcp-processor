import net from "net";
import db from "../db";
import { devices } from "../devices";
import { handleHCS048Data } from "./protocols/HCS048";
import { handle7878Data } from "./protocols/7878";

const validateConnection = (data: Buffer) => {
  const str = data.toString("utf8").trim();
  const raw = str.slice(str.lastIndexOf("S168#")).trim();

  const a = data.length < 5 || data[0] !== 0x78 || data[1] !== 0x78;
  const b = !raw.startsWith("S168#") || !raw.endsWith("$");

  return {
    black: a,
    HCS048: b,
  };
};

const server = net.createServer((socket) => {
  console.log(
    `[TCP] Client connected from ${socket.remoteAddress}:${socket.remotePort}`
  );
  socket.on("data", async (data) => {
    const { black, HCS048 } = validateConnection(data);

    if (!black && !HCS048) {
      console.log(`[TCP] Invalid connection - Socket destroyed!`);
      socket.destroy();
      return;
    }

    if (black) {
      await handle7878Data(socket, data);
    } else if (HCS048) {
      await handleHCS048Data(socket, data);
    }
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
