import net from "net";

import { addLog, removeSocket, sendAck } from "..";
import { handleMultiLbsWifi } from "../decoders/handleMultiLbsWifi";
import { parseConnectionPacket } from "../decoders/connect";
import db from "../db";
import { parseGpsPacket } from "../decoders/gps";
import { parseStatusPacket } from "../decoders/status";
import { getCurrentGMTTimeHex } from "../utils/getCurrentGMTTimeHex";

const bufferToHex = (buffer: Buffer) => buffer.toString("hex").toUpperCase();

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
      const ack = "78780730" + currentTime + "0d0a";
      // const ack1 = "787807301905160704370d0a";
      // const ack2 = "787807302505220704370d0a";
      const timeReply = Buffer.from(ack, "hex");
      console.log("Buffer 30: ", timeReply);
      socket.write(timeReply);

      addLog({ imei: (socket as any).imei, protocol, received: hexStr, ack });
      console.log(`[TIME SYNC] Time sync sent: ${currentTime}`);
      break;
    }

    case "80": {
      console.log(`[KEEPALIVE] Protocol 0x80 keep-alive received.`);
      db.devices.updateStatus((socket as any).imei, "static");
      addLog({
        imei: (socket as any).imei,
        protocol,
        received: hexStr,
        ack: "",
      });
      break;
    }
    case "81": {
      console.log(`[CHARGING] Full.`);
      addLog({
        imei: (socket as any).imei,
        protocol,
        received: hexStr,
        ack: "NOT REPLIED: [CHARGING] Full.",
      });
      break;
    }
    case "82": {
      console.log(`[CHARGING] True.`);
      addLog({
        imei: (socket as any).imei,
        protocol,
        received: hexStr,
        ack: "NOT REPLIED: [CHARGING] True.",
      });
      break;
    }
    case "83": {
      console.log(`[CHARGING] False.`);
      addLog({
        imei: (socket as any).imei,
        protocol,
        received: hexStr,
        ack: "NOT REPLIED: [CHARGING] False.",
      });
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
    // case "57": {
    //   sendAck(socket, "57", hexStr);
    //   break;
    // }

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
