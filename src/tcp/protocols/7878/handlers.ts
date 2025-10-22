import db from "../../../db";
import net from "net";
import { parseGpsPacket } from "../../decoders/gps";
import { handleNewLocation } from "../../handleNewLocation";
import { parseConnectionPacket } from "../../decoders/connect";
import { parseStatusPacket } from "../../decoders/status";
import { getCurrentGMTTimeHex } from "../../../lib/utils/getCurrentGMTTimeHex";
import { handleMultiLbsWifiLogic } from "../../decoders/handleMultiLbsWifi";
import { addLog, getProtocol, sendAck } from "./services";

type PacketHandler = (hexStr: string, socket: net.Socket) => Promise<void>;

export const handleUnknown: PacketHandler = async (hexStr, socket) => {
  const protocol = getProtocol(hexStr);
  console.log(`[UNKNOWN] Protocol ${protocol} received. Raw data: ${hexStr}`);
  addLog({
    imei: (socket as any).imei,
    protocol,
    received: hexStr,
    ack: "NOT REPLIED: [UNKNOWN] Protocol",
  });
};

const handleChargingStatus =
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
  const data = parseGpsPacket(hexStr, socket);
  if (data?.imei) {
    await handleNewLocation(data);
  }
  sendAck(socket, hexStr, data?.dateTime);
};

const handleLbsWifi: PacketHandler = async (hexStr, socket) => {
  const time = hexStr.substring(10, 22);
  console.log(`[WIFI LBS] DateTime: ${time}`);
  sendAck(socket, hexStr, time);
};

const handleConnection: PacketHandler = async (hexStr, socket) => {
  const imei = parseConnectionPacket(hexStr, socket);
  if (imei) {
    const exists = await db.devices.getByIMEI(imei);
    if (!exists) {
      await db.devices.create(imei);
    }
  }
  sendAck(socket, hexStr);
};

const handleHeartbeat: PacketHandler = async (hexStr, socket) => {
  console.log("[HEARTBEAT] Heartbeat packet received.");
  db.devices.updateStatus((socket as any).imei, "static");
  sendAck(socket, hexStr);
};

const handleStatusUpdate: PacketHandler = async (hexStr, socket) => {
  const data = parseStatusPacket(hexStr, socket);
  if (data?.imei) {
    if (hexStr?.length > 40) {
      db.health.insert(data);
    }
    db.devices.update(data);
    db.devices.updateStatus(data.imei, "static");
  }
  sendAck(socket, hexStr);
};

const handleTimeSync: PacketHandler = async (hexStr, socket) => {
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
};

const handleKeepAlive: PacketHandler = async (hexStr, socket) => {
  console.log(`[KEEPALIVE] Protocol 0x80 keep-alive received.`);
  db.devices.updateStatus((socket as any).imei, "static");
  addLog({
    imei: (socket as any).imei,
    protocol: "80",
    received: hexStr,
    ack: "",
  });
};

const handleGPSIntervalChange: PacketHandler = async (hexStr, socket) => {
  console.log(`[INTERVAL CHANGE] Protocol 0x97 received.`);
  addLog({
    imei: (socket as any).imei,
    protocol: "97",
    received: hexStr,
    ack: "",
  });
};

const handleMultiLbsWifi: PacketHandler = async (hexStr, socket) => {
  const protocol = getProtocol(hexStr);
  handleMultiLbsWifiLogic(socket, hexStr, protocol);
};

export const protocolHandlers: Record<string, PacketHandler> = {
  "01": handleConnection,
  "08": handleHeartbeat,
  "10": handleGpsPacket,
  "11": handleGpsPacket,
  "13": handleStatusUpdate,
  "17": handleLbsWifi,
  "69": handleLbsWifi,
  "30": handleTimeSync,
  "80": handleKeepAlive,
  "81": handleChargingStatus("Full"),
  "82": handleChargingStatus("True"),
  "83": handleChargingStatus("False"),
  "97": handleGPSIntervalChange,
  "18": handleMultiLbsWifi,
  "19": handleMultiLbsWifi,
  "1A": handleMultiLbsWifi,
  "1B": handleMultiLbsWifi,
};
