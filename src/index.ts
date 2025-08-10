import net from "net";

import db from "./db";
import { LogCreateType } from "./db/logs";
import { httpInit } from "./http";
import { tcpInit } from "./tcp";
import { connectRedis } from "./lib";

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
