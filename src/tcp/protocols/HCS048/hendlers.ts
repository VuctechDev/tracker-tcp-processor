import net from "net";

type PacketHandler = (hexStr: string, socket: net.Socket) => Promise<void>;

export const protocolHandlers: Record<string, PacketHandler> = {
  //   "01": handleConnection,
  //   "08": handleHeartbeat,
  //   "10": handleGpsPacket,
  //   "11": handleGpsPacket,
  //   "13": handleStatusUpdate,
  //   "17": handleLbsWifi,
  //   "69": handleLbsWifi,
  //   "30": handleTimeSync,
  //   "80": handleKeepAlive,
  //   "81": handleChargingStatus("Full"),
  //   "82": handleChargingStatus("True"),
  //   "83": handleChargingStatus("False"),
  //   "97": handleGPSIntervalChange,
  //   "18": handleMultiLbsWifi,
  //   "19": handleMultiLbsWifi,
  //   "1A": handleMultiLbsWifi,
  //   "1B": handleMultiLbsWifi,
};
