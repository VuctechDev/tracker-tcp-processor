import net from "net";
import { parseStatusPacket } from "./status";
import { parseGpsPacket } from "./gps";
import { insertInDB } from "./baza";
import express from "express";
import prisma from "./prizma";
import { setInterval } from "timers";
import { insert } from "./prizma/records";

// === CONFIGURATION SECTION ===
const HTTP_PORT = 2302;
const TCP_PORT = 5001;
const HOST = "0.0.0.0";

const app = express();

app.get("/status", async (req, res) => {
  const count = await prisma.records.count(); // Example DB query
  res.json({ message: "Server is up", records: count });
});

function bufferToHex(buffer: Buffer) {
  return buffer.toString("hex").toUpperCase();
}

function sendAck(socket: net.Socket, protocolNumber: string, timeHex = "") {
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

function decodePacket(hexStr: string, socket: net.Socket) {
  const protocol = hexStr.substring(6, 8);
  console.log(`[INFO] Protocol: ${protocol}`);

  switch (protocol) {
    case "01": {
      const imeiBytes = hexStr.substring(8, 24).match(/.{1,2}/g) || [];
      const imei = imeiBytes
        .map((b) => parseInt(b, 16).toString(16).padStart(2, "0"))
        .join("");
      console.log(`[LOGIN] IMEI: ${imei}`);
      sendAck(socket, "01");
      break;
    }
    case "08":
      console.log("[HEARTBEAT] Heartbeat packet received.");
      sendAck(socket, "08");
      break;
    case "10": {
      const data = parseGpsPacket(hexStr);
      insertInDB(data);
      sendAck(socket, "10", data?.dateTime);
      break;
    }

    case "11": {
      const data = parseGpsPacket(hexStr);
      insertInDB(data);
      sendAck(socket, "11", data?.dateTime);
      break;
    }
    case "13": {
      parseStatusPacket(hexStr);
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
      sendAck(socket, "80");
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

// === Create TCP Server ===
const server = net.createServer((socket) => {
  console.log(
    `Client connected from ${socket.remoteAddress}:${socket.remotePort}`
  );

  socket.on("data", (data) => {
    const hexStr = bufferToHex(data);
    console.log(`[RECEIVED] ${hexStr}`);

    if (data.length < 5 || data[0] !== 0x78 || data[1] !== 0x78) {
      console.log("Invalid or non-GPS packet. Ignored.");
      return;
    }

    decodePacket(hexStr, socket);
  });

  socket.on("close", () => {
    console.log(`Client disconnected: ${socket.remoteAddress}`);
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
