import { addLog, sendAck } from "../..";
import db from "../../db";
import net from "net";
import { parseGpsPacket } from "../decoders/gps";
import { handleNewLocation } from "../../lib/handlers/handleNewLocation";
import { parseConnectionPacket } from "../decoders/connect";
import { parseStatusPacket } from "../decoders/status";
import { getCurrentGMTTimeHex } from "../../lib/utils/getCurrentGMTTimeHex";

type PacketHandler = (hexStr: string, socket: net.Socket) => Promise<void>;

const getProtocol = (hexStr: string) => hexStr.substring(6, 8).toUpperCase();

export const handleUnknown: PacketHandler = async (hexStr, socket) => {
  const protocol = getProtocol(hexStr);
  console.log(`[UNKNOWN] Protocol ${protocol} received. Raw data: ${hexStr}`);
  addLog({
    imei: (socket as any).imei,
    protocol,
    received: hexStr,
    ack: "NOT REPLIED",
  });
};

const logChargingStatus =
  (status: string): PacketHandler =>
  async (hexStr, socket) => {
    const protocol = getProtocol(hexStr);
    console.log(`[CHARGING] ${status}.`);
    addLog({
      imei: (socket as any).imei,
      protocol,
      received: hexStr,
      ack: `NOT REPLIED: [CHARGING] ${status}.`,
    });
  };

const handleGpsPacket: PacketHandler = async (hexStr, socket) => {
  const protocol = getProtocol(hexStr);
  const data = parseGpsPacket(hexStr, socket);
  if (data?.imei) {
    await handleNewLocation(data);
  }
  sendAck(socket, protocol, hexStr, data?.dateTime);
};

const handleLbsWifi: PacketHandler = async (hexStr, socket) => {
  const protocol = getProtocol(hexStr);
  const time = hexStr.substring(10, 22);
  console.log(`[WIFI LBS] DateTime: ${time}`);
  sendAck(socket, protocol, hexStr, time);
};

// const handleMultiLbsWifi: PacketHandler = async (hexStr, socket) => {
//   const protocol = getProtocol(hexStr);
//   handleMultiLbsWifiLogic(socket, hexStr, protocol);
// };

export const protocolHandlers: Record<string, PacketHandler> = {
  "01": async (hexStr, socket) => {
    const imei = parseConnectionPacket(hexStr, socket);
    if (imei) {
      const exists = await db.devices.getByIMEI(imei);
      if (!exists) {
        await db.devices.create(imei);
      }
    }
    sendAck(socket, "01", hexStr);
  },

  "08": async (hexStr, socket) => {
    console.log("[HEARTBEAT] Heartbeat packet received.");
    db.devices.updateStatus((socket as any).imei, "static");
    sendAck(socket, "08", hexStr);
  },

  "10": handleGpsPacket,
  "11": handleGpsPacket,

  "13": async (hexStr, socket) => {
    const data = parseStatusPacket(hexStr, socket);
    if (data?.imei) {
      db.devices.update(data);
      db.devices.updateStatus(data.imei, "static");
    }
    sendAck(socket, "13", hexStr);
  },

  "17": handleLbsWifi,
  "69": handleLbsWifi,

  "30": async (hexStr, socket) => {
    console.log("[TIME SYNC] Device requests time sync.");
    const currentTime = getCurrentGMTTimeHex();
    const ack = `78780730${currentTime}0d0a`;
    socket.write(Buffer.from(ack, "hex"));

    addLog({
      imei: (socket as any).imei,
      protocol: "30",
      received: hexStr,
      ack,
    });
    console.log(`[TIME SYNC] Time sync sent: ${currentTime}`);
  },

  "80": async (hexStr, socket) => {
    console.log(`[KEEPALIVE] Protocol 0x80 keep-alive received.`);
    db.devices.updateStatus((socket as any).imei, "static");
    addLog({
      imei: (socket as any).imei,
      protocol: "80",
      received: hexStr,
      ack: "",
    });
  },

  "81": logChargingStatus("Full"),
  "82": logChargingStatus("True"),
  "83": logChargingStatus("False"),

  "97": async (hexStr, socket) => {
    console.log(`[INTERVAL CHANGE] Protocol 0x97 received.`);
    addLog({
      imei: (socket as any).imei,
      protocol: "97",
      received: hexStr,
      ack: "",
    });
  },

  // "18": handleMultiLbsWifi,
  // "19": handleMultiLbsWifi,
  // "1A": handleMultiLbsWifi,
  // "1B": handleMultiLbsWifi,
};
