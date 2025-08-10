import net from "net";
import { getCurrentGMTTime } from "../../../lib/utils/getCurrentGMTTime";
import db from "../../../db";
import { devices } from "../../../devices";
import { addLog } from "../7878/services";

type HCS048Parsed = {
  imei: string;
  serial: string;
  length: number;
  content: string;
  contentObj: Record<string, any>;
};

type HandlerCtx = {
  socket: net.Socket;
  raw: string;
  imei: string;
  serial: string;
  contentObj: Record<string, any>;
  ack: (type: "SYNC" | "LOCA" | string) => void;
};

type PacketHandler = (ctx: HandlerCtx) => Promise<void>;

export const sendHCS048Ack = (
  socket: net.Socket,
  imei: string,
  serial: string,
  type: "SYNC" | "LOCA" | "INFO" | string,
  raw?: string
): void => {
  const t = type.toUpperCase();
  const needsUtc = t === "SYNC" || t === "INFO"; // both require UTC timestamp
  const content = needsUtc ? `ACK^${t},${getCurrentGMTTime()}` : `ACK^${t}`;
  const lenHex = content.length.toString(16).padStart(4, "0");
  const frame = `S168#${imei}#${serial}#${lenHex}#${content}$`;

  socket.write(frame, "utf8");
  addLog({ imei, protocol: t, received: raw ?? "", ack: frame });
  console.log(`[HCS048][TX] ${frame}`);
};

export const handleSync: PacketHandler = async ({
  socket,
  imei,
  contentObj,
  ack,
}) => {
  devices.set(imei, socket);
  db.devices.updateStatus(imei, "static");
  console.log(`[HCS048] SYNC: ${JSON.stringify(contentObj)}`);
  ack("SYNC");
};

export const handleLoca: PacketHandler = async ({ imei, contentObj, ack }) => {
  db.devices.updateStatus(imei, "dynamic");
  console.log(`[HCS048] LOCA: ${JSON.stringify(contentObj)}`);
  ack("LOCA");
};

export const handleInfo: PacketHandler = async ({ imei, contentObj, ack }) => {
  db.devices.updateStatus(imei, "static");
  console.log(`[HCS048] INFO: ${JSON.stringify(contentObj)}`);
  ack("INFO");
};

export const handleUnknown: PacketHandler = async ({ contentObj }) => {
  console.log(`[HCS048] UNKNOWN: ${JSON.stringify(contentObj)}`);
};

export const resolvePrimaryType = (
  contentObj: Record<string, any>
): keyof typeof protocolHandlers => {
  if ("SYNC" in contentObj) return "SYNC";
  if ("LOCA" in contentObj) return "LOCA";
  if ("INFO" in contentObj) return "INFO";
  return "UNKNOWN";
};

export const dispatchHCS048 = async (
  socket: net.Socket,
  raw: string,
  parsed: HCS048Parsed
): Promise<void> => {
  const { imei, serial, contentObj } = parsed;

  if (!imei) return;

  (socket as any).imei = imei;
  const exists = await db.devices.getByIMEI(imei);
  if (!exists) await db.devices.create(imei);
  console.log(`[HCS048] IMEI: ${imei}`);

  const primary = resolvePrimaryType(contentObj);
  const handler = protocolHandlers[primary] ?? protocolHandlers.UNKNOWN;

  const ack = (type: "SYNC" | "LOCA" | "INFO" | string) =>
    sendHCS048Ack(socket, imei, serial, type, raw);

  const ctx: HandlerCtx = { socket, raw, imei, serial, contentObj, ack };
  await handler(ctx);
};

export const protocolHandlers: Record<string, PacketHandler> = {
  SYNC: handleSync,
  LOCA: handleLoca,
  INFO: handleInfo,
  UNKNOWN: handleUnknown,
};
