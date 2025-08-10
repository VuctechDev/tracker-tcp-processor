import net from "net";
import { dispatchHCS048 } from "./hendlers";

const parseHCS048Content = (content: string): Record<string, any> => {
  const parts = content.split(";").filter(Boolean);
  const result: Record<string, any> = {};
  for (const part of parts) {
    const [key, valuesStr] = part.split(":");
    if (!key || !valuesStr) continue;
    const values = valuesStr.split(",");
    result[key.trim()] =
      values.length === 1 ? values[0].trim() : values.map((v) => v.trim());
  }
  return result;
};

const parseHCS048Packet = (raw: string) => {
  // raw includes trailing $
  const noEnd = raw.slice(0, -1);
  const [header, imei, serial, lengthHex, ...rest] = noEnd.split("#");
  if (header !== "S168" || !imei || !serial || !lengthHex || !rest.length)
    return;
  const content = rest.join("#");
  const length = parseInt(lengthHex, 16);
  if (content.length !== length) {
    console.warn(`Length mismatch: expected ${length}, got ${content.length}`);
    // We still proceed; some firmwares misreport length by 1 on commas/spaces.
  }
  const contentObj = parseHCS048Content(content);
  console.log(
    `[HCS048] PARSED DATA: ${JSON.stringify({
      imei,
      serial,
      length,
      content,
      contentObj,
    })}`
  );
  return { imei, serial, length, content, contentObj };
};

export const handleHCS048Data = async (socket: net.Socket, data: Buffer) => {
  // Optional: reduce coalescing (still no guarantees)
  if (!(socket as any)._nodelaySet) {
    socket.setNoDelay(true);
    (socket as any)._nodelaySet = true;
  }

  const str = data.toString("utf8").trim();
  console.log(`[HCS048] Received Raw: ${str}`);
  // Dev guard 1: if we see more than one '$', we probably got multiple frames at once
  const dollarCount = (str.match(/\$/g) || []).length;
  if (dollarCount > 1) {
    console.warn(
      `[HCS048] Warning: multiple frames in one chunk (${dollarCount}). Consider buffering.`
    );
  }

  // Dev guard 2: if we don't have a trailing '$', we probably got a partial frame
  if (!str.endsWith("$")) {
    console.warn(
      "[HCS048] Warning: partial frame (no trailing $). Consider buffering."
    );
    console.log("[HCS048] Invalid frame. Socket destroyed!");
    socket.destroy();
    return; // bail for now during testing
  }

  // If the device is well-behaved, we expect exactly one frame here.
  // If the chunk somehow contains multiple frames, just take the last complete one for now.
  const raw = str.slice(str.lastIndexOf("S168#")).trim();

  if (!raw.startsWith("S168#") || !raw.endsWith("$")) {
    console.log("[HCS048] Invalid frame. Socket destroyed!");
    socket.destroy();
    return;
  }

  console.log(`[HCS048] RAW: ${raw}`);
  const parsed = parseHCS048Packet(raw);
  if (!parsed) return;

  await dispatchHCS048(socket, raw, parsed);
};
