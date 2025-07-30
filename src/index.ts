import net from "net";

import db from "./db";
import { LogCreateType } from "./db/logs";
import { httpInit } from "./http";
import { tcpInit } from "./tcp";
import { connectRedis } from "./lib";
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
  const footer = "0d0a";
  let ack = header + length + protocol + timeHex + footer;
  let ack2 = "";
  if (protocol === "01") {
    ack = header + "0101" + footer;
  } else if (protocol === "13") {
    ack = hexStr;
  } else if (protocol === "57") {
    ack = `78781F570258010000000000000000000000000000000000000000000000003B3B3B0D0A`;
  }
  addLog({ imei: (socket as any).imei, protocol, received: hexStr, ack });
  const buffer = Buffer.from(ack, "hex");
  socket.write(buffer, () => {
    console.log(
      `>> [SENT] Ack sent for protocol ${protocol}, ${buffer.toString("hex")}`
    );
  });
}
const deviceSockets = new Map<string, net.Socket>();

export const getSocket = (imei: string) => deviceSockets.get(imei);
export const removeSocket = (imei: string) => deviceSockets.delete(imei);

const init = () => {
  const HTTP_PORT = process.env.HTTP_PORT;
  const TCP_PORT = process.env.TCP_PORT;
  const HOST = "0.0.0.0";

  if (!HTTP_PORT) {
    console.error("No HTTP_PORT provided!");
    return;
  } else if (!TCP_PORT) {
    console.error("No TCP_PORT provided!");
    return;
  }
  connectRedis();

  tcpInit(TCP_PORT, HOST);
  httpInit(HTTP_PORT);
};

init();
