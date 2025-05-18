import net from "net";
import { parseStatusPacket } from "./decoders/status";
import { parseGpsPacket } from "./decoders/gps";
import express from "express";
import cors from "cors";
import prisma from "./db/prizma";
import db from "./db";
import { parseConnectionPacket } from "./decoders/connect";
import { getLocation, updateDeviceInterval } from "./commands";

const HTTP_PORT = 2302;
const TCP_PORT = 5555;
const HOST = "0.0.0.0";

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.get("/status", async (req, res) => {
  const count = await prisma.records.count();
  res.json({ message: "Server is up", records: count });
});

app.get("/data/:imei", async (req, res) => {
  const { imei } = req.params;
  const data = await db.records.getByIMEI(imei);
  res.json({ data });
});

app.get("/devices", async (req, res) => {
  const data = await db.devices.get();
  res.json({ data });
});

app.patch("/devices/interval/:id", async (req, res) => {
  console.log(req.params, req.body);
  updateDeviceInterval(req.params.id, req.body.value, req.body.code);
  res.json({ data: 1 });
});
app.patch("/devices/command/:id", async (req, res) => {
  console.log(req.params, req.body);
  getLocation(req.params.id, req.body.value, req.body.code);
  res.json({ data: 1 });
});

function bufferToHex(buffer: Buffer) {
  return buffer.toString("hex").toUpperCase();
}

export function sendAck(
  socket: net.Socket,
  protocolNumber: string,
  timeHex = ""
) {
  const header = "7878";
  const length = "00";
  const footer = "0D0A";
  const ack = Buffer.from(
    header + length + protocolNumber + timeHex + footer,
    "hex"
  );
  socket.write(ack);
  console.log(
    `>> [SENT] Ack sent for protocol ${protocolNumber}, ${
      header + length + protocolNumber + timeHex + footer
    }`
  );
}

function getCurrentGMTTimeHex(): string {
  const now = new Date();
  const year = (now.getUTCFullYear() % 100).toString(16).padStart(2, "0");
  const month = (now.getUTCMonth() + 1).toString(16).padStart(2, "0");
  const day = now.getUTCDate().toString(16).padStart(2, "0");
  const hour = now.getUTCHours().toString(16).padStart(2, "0");
  const minute = now.getUTCMinutes().toString(16).padStart(2, "0");
  const second = now.getUTCSeconds().toString(16).padStart(2, "0");
  return year + month + day + hour + minute + second;
}

function decodeGpsCoordinate(coordHex: string): number {
  const raw = parseInt(coordHex, 16);
  return raw / 1800000;
}

const deviceSockets = new Map<string, net.Socket>();

export const getSocket = (imei: string) => deviceSockets.get(imei);

async function decodePacket(hexStr: string, socket: net.Socket) {
  const protocol = hexStr.substring(6, 8);
  console.log(`[INFO] Protocol: ${protocol}`);

  switch (protocol) {
    case "01": {
      const imei = parseConnectionPacket(hexStr, socket);
      if (imei) {
        const exists = await db.devices.getByIMEI(imei);
        if (!exists) {
          db.devices.create(imei);
        }
      }
      sendAck(socket, "01");
      break;
    }
    case "08":
      console.log("[HEARTBEAT] Heartbeat packet received.");
      db.devices.updateStatus((socket as any).imei, "static");
      sendAck(socket, "08");
      break;
    // case "10": {
    //   const data = parseGpsPacket(hexStr, socket);
    //   if (data && data.deviceId) {
    //     insert(data);
    //   }
    //   sendAck(socket, protocol, data?.dateTime);
    //   break;
    // }
    case "10":
    case "11": {
      const data = parseGpsPacket(hexStr, socket);
      if (data && data.imei) {
        db.records.insert(data);
        db.devices.updateStatus(data.imei, "dynamic");
      }
      sendAck(socket, protocol, data?.dateTime);
      break;
    }
    case "13": {
      const data = parseStatusPacket(hexStr, socket);
      if (data && data.imei) {
        db.devices.update(data);
      }
      sendAck(socket, "13");
      break;
    }

    case "17":
    case "69": {
      const time = hexStr.substring(10, 22);
      console.log(`[WIFI LBS] DateTime: ${time}`);
      sendAck(socket, protocol, time);
      break;
    }

    case "30": {
      console.log("[TIME SYNC] Device requests time sync.");
      const currentTime = getCurrentGMTTimeHex();
      const timeReply = Buffer.from("78780730" + currentTime + "0D0A", "hex");
      socket.write(timeReply);
      console.log(`[TIME SYNC] Time sync sent: ${currentTime}`);
      break;
    }

    case "80": {
      console.log(`[KEEPALIVE] Protocol 0x80 keep-alive received.`);
      db.devices.updateStatus((socket as any).imei, "static");
      sendAck(socket, "80");
      break;
    }
    case "97": {
      console.log(`[INTERVAL CHANGE] Protocol 0x97 received.`);
      // db.devices.updateStatus((socket as any).imei, "static");
      // sendAck(socket, "80");
      break;
    }
    case "1A": {
      console.log(`[1A] Protocol 0x1A received.`);

      // Extract 6 bytes (12 chars) starting after protocol byte
      const timeHex = hexStr.substring(8, 20); // 6 bytes = 12 hex chars

      if (timeHex.length !== 12) {
        console.error("Invalid time length in 0x1A packet");
        return;
      }

      const ack = Buffer.from("7878001A" + timeHex + "0D0A", "hex");

      socket.write(ack);
      console.log(
        `>> [SENT] Ack for 0x1A: ${ack.toString("hex").toUpperCase()}`
      );
      break;
    }

    case "1B": {
      const timestamp = hexStr.substring(8, 20);
      const gpsInfoByte = parseInt(hexStr.substring(20, 22), 16);
      const gpsFix = (gpsInfoByte & 0xf0) >> 4;
      const satellites = gpsInfoByte & 0x0f;

      const mcc = hexStr.substring(22, 26);
      const mnc = hexStr.substring(26, 28);
      const lac = hexStr.substring(28, 32);
      const cellId = hexStr.substring(32, 40);

      const latHex = hexStr.substring(40, 48);
      const lngHex = hexStr.substring(48, 56);
      const lat = decodeGpsCoordinate(latHex);
      const lng = decodeGpsCoordinate(lngHex);

      console.log(`[LBS+GPS] Time: ${timestamp}`);
      console.log(`  ▸ MCC: ${mcc}`);
      console.log(`  ▸ MNC: ${mnc}`);
      console.log(`  ▸ LAC: ${lac}`);
      console.log(`  ▸ Cell ID: ${cellId}`);
      console.log(`  ▸ GPS Fix: ${gpsFix === 0 ? "No fix" : `${gpsFix}D fix`}`);
      console.log(`  ▸ Satellites: ${satellites}`);
      console.log(
        `  ▸ Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`
      );

      sendAck(socket, "1B", timestamp);
      break;
    }

    default:
      console.log(
        `[UNKNOWN] Protocol ${protocol} received. Raw data: ${hexStr}`
      );
  }
}

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
      deviceSockets.delete(imei);
    }
    console.log(`Client disconnected: ${socket.remoteAddress} - ${imei}`);
  });

  socket.on("error", (err) => {
    console.error(`Socket Error: ${err.message}`);
  });
});

server.listen(TCP_PORT, HOST, () => {
  console.log(`TCP listening on ${HOST}:${TCP_PORT}`);
});
app.listen(HTTP_PORT, () => {
  console.log(`HTTP server running at http://localhost:${HTTP_PORT}`);
});

server.on("error", (err) => {
  console.error(`Server Error: ${err.message}`);
});
