import net from "net";
import { getCurrentGMTTime } from "../../../lib/utils/getCurrentGMTTime";
import db from "../../../db";
import { devices } from "../../../devices";
import { addLog } from "../7878/services";
import { StatusPacket } from "../../decoders/status";
import { GpsPacket } from "../../decoders/gps";
import { handleNewLocation } from "../../../lib/handlers/handleNewLocation";

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
  // [HCS048] SYNC: {"SYNC":"0001-271-7-1","STATUS":["96","73"]}
  // 96 → Battery at 96%
  // 73 → GSM signal strength 73/100
  const data = {
    imei,
    battery: parseInt(contentObj?.STATUS?.[0] ?? 0),
    signal: parseInt(contentObj?.STATUS?.[1] ?? 0),
  };
  console.log(`[HCS048] SYNC: ${JSON.stringify(contentObj)}`);
  console.log(`[HCS048] SYNC DATA: ${JSON.stringify(data)}`);
  devices.set(imei, socket);
  db.devices.updateStatus(imei, "static");
  db.devices.update(data as StatusPacket);
  ack("SYNC");
};

export const handleLoca: PacketHandler = async ({ imei, contentObj, ack }) => {
  // LOCA: {"LOCA":"G","CELL":["4","da","5","c8","1210e","27","33","297202","33","c8","13415","27","c8","12102","27"],"GDATA":["A","9","250811063210","44.716255","17.167983","1","0","0"],"ALERT":"0000","STATUS":["96","73"],"WIFI":"0"}
  const parseGdata = (g: string[]) => ({
    imei,
    status: g[0] === "A" ? "valid" : "invalid",
    satellites: parseInt(g[1], 10),
    dateTime: `20${g[2].slice(0, 2)}-${g[2].slice(2, 4)}-${g[2].slice(
      4,
      6
    )} ${g[2].slice(6, 8)}:${g[2].slice(8, 10)}:${g[2].slice(10, 12)}`,
    latitude: parseFloat(g[3]),
    longitude: parseFloat(g[4]),
    speed: parseInt(g[5], 10),
    heading: parseFloat(g[6]),
    altitudeM: parseFloat(g[7]),
  });

  if (contentObj.GDATA) {
    const data = parseGdata(contentObj?.GDATA ?? []);
    if (data) {
      handleNewLocation(data as unknown as GpsPacket);
    }
  }

  db.devices.updateStatus(imei, "dynamic");
  console.log(`[HCS048] LOCA: ${JSON.stringify(contentObj)}`);
  console.log(`[HCS048] LOCA DATA: ${parseGdata(contentObj?.GDATA)}`);
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
