import net from "net";
import { parseStatusPacket } from "./decoders/status";
import { parseGpsPacket } from "./decoders/gps";
import express from "express";
import cors from "cors";
import prisma from "./db/prizma";
import db from "./db";
import { parseConnectionPacket } from "./decoders/connect";
import {
  getLocation,
  restartDevice,
  turnAlarmOnOff,
  updateDeviceInterval,
} from "./commands";
import { devices } from "./devices";
import { getCurrentGMTTimeHex } from "./utils/getCurrentGMTTimeHex";
import { handleMultiLbsWifi } from "./decoders/handleMultiLbsWifi";
import { LogCreateType } from "./db/logs";

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

app.get("/data/:imei", async (req, res) => {
  const { imei } = req.params;
  const data = await db.records.getByIMEI(imei);
  res.json({ data });
});

app.get("/logs/:imei", async (req, res) => {
  const { imei } = req.params;
  const data = await db.logs.getByIMEI(imei);
  res.json({ data });
});

app.get("/devices", async (req, res) => {
  const data = await db.devices.get();
  res.json({ data });
});

app.patch("/devices/command/:id", async (req, res) => {
  const imei = req.params.id;
  const protocol = req.body?.code;
  const value = req.body?.value;
  const socket = devices.get(imei);
  if (!socket) {
    console.warn(`Socket not found for device ${imei}`);
    res.json({ data: 1 });
    return;
  }
  let ack = "";
  if (protocol === "48") {
    ack = restartDevice(socket);
  } else if (protocol === "80") {
    ack = getLocation(socket);
  } else if (protocol === "97") {
    ack = updateDeviceInterval(socket, value, imei);
  }
  // else if (protocol === "49") {
  // ack = turnAlarmOnOff(socket, value);
  // }
  console.log(`[SENT] 0x${req.body.code} - IMEI: ${imei}, CODE: ${ack}`);
  res.json({ data: 1 });
});

const bufferToHex = (buffer: Buffer) => buffer.toString("hex").toUpperCase();

export const addLog = (data: LogCreateType) => {
  db.logs.insert(data);
};

export function sendAck(
  socket: net.Socket,
  protocol: string,
  hexStr: string,
  timeHex = ""
) {
  const header = "7878";
  const length = "00";
  const footer = "0D0A";
  let ack = header + length + protocol + timeHex + footer;
  if (protocol === "01") {
    ack = header + "0101" + footer;
  }
  addLog({ imei: (socket as any).imei, protocol, received: hexStr, ack });
  const buffer = Buffer.from(ack);
  socket.write(buffer);
  console.log(`>> [SENT] Ack sent for protocol ${protocol}, ${ack}`);
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
      sendAck(socket, "01", hexStr);
      break;
    }
    case "08":
      console.log("[HEARTBEAT] Heartbeat packet received.");
      db.devices.updateStatus((socket as any).imei, "static");
      sendAck(socket, "08", hexStr);
      break;
    case "10":
    case "11": {
      const data = parseGpsPacket(hexStr, socket);
      if (data && data.imei) {
        db.records.insert(data);
        db.devices.updateStatus(data.imei, "dynamic");
      }
      sendAck(socket, protocol, hexStr, data?.dateTime);
      break;
    }
    case "13": {
      const data = parseStatusPacket(hexStr, socket);
      if (data && data.imei) {
        db.devices.update(data);
        db.devices.updateStatus(data.imei, "static");
      }
      sendAck(socket, "13", hexStr);
      break;
    }

    case "17":
    case "69": {
      const time = hexStr.substring(10, 22);
      console.log(`[WIFI LBS] DateTime: ${time}`);
      sendAck(socket, protocol, hexStr, time);
      break;
    }

    case "30": {
      console.log("[TIME SYNC] Device requests time sync.");
      const currentTime = getCurrentGMTTimeHex();
      const ack = "78780730" + currentTime + "0D0A";
      const timeReply = Buffer.from(ack);
      socket.write(timeReply);
      addLog({ imei: (socket as any).imei, protocol, received: hexStr, ack });
      console.log(`[TIME SYNC] Time sync sent: ${currentTime}`);
      break;
    }

    case "80": {
      console.log(`[KEEPALIVE] Protocol 0x80 keep-alive received.`);
      db.devices.updateStatus((socket as any).imei, "static");
      sendAck(socket, "80", hexStr);
      break;
    }
    case "97": {
      console.log(`[INTERVAL CHANGE] Protocol 0x97 received.`);
      addLog({
        imei: (socket as any).imei,
        protocol,
        received: hexStr,
        ack: "",
      });
      break;
    }

    case "18":
    case "19":
    case "1A":
    case "1B": {
      handleMultiLbsWifi(socket, hexStr, protocol);
      break;
    }

    default:
      console.log(
        `[UNKNOWN] Protocol ${protocol} received. Raw data: ${hexStr}`
      );
      addLog({
        imei: (socket as any).imei,
        protocol,
        received: hexStr,
        ack: "NOT REPLIED",
      });
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
      db.devices.updateStatus(imei, "offline");
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
  db.devices.setAllOffline();
  console.log(`HTTP server running at http://localhost:${HTTP_PORT}`);
});

app.get("/status", async (req, res) => {
  const a = await server.getConnections((error, count) => {
    if (!error) {
      console.log("OPA: ", count);
      return new Promise((resolve) => resolve(count));
    }
  });
  res.json({
    message: "Server is up",
    count: server.connections,
    count2: a,
    x: JSON.stringify(server),
  });
});

server.on("error", (err) => {
  console.error(`Server Error: ${err.message}`);
});
