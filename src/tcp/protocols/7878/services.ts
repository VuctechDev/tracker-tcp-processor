import net from "net";
import db from "../../../db";
import { LogCreateType } from "../../../db/logs";

export const getProtocol = (hexStr: string) =>
  hexStr.substring(6, 8).toUpperCase();

export const addLog = (data: LogCreateType) => {
  db.logs.insert(data);
};

export const sendAck = (socket: net.Socket, hexStr: string, timeHex = "") => {
  const protocol = getProtocol(hexStr);
  const header = "7878";
  const length = "00";
  const footer = "0d0a";
  let ack = header + length + protocol + timeHex + footer;
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
};
