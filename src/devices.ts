import net from "net";

const deviceSockets = new Map<string, net.Socket>();

export const devices = {
  get: (imei: string) => deviceSockets.get(imei),
  set: (imei: string, socket: net.Socket) => deviceSockets.set(imei, socket),
  delete: (imei: string) => deviceSockets.delete(imei),
  reset: () => deviceSockets.clear(),
};
