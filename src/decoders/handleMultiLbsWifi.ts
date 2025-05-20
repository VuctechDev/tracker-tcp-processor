import net from "net";

function parseWifi(hexStr: string, count: number, offset: number) {
  const wifiList = [];
  for (let i = 0; i < count; i++) {
    const start = offset + i * 14;
    const bssid = hexStr.substring(start, start + 12);
    const rssi = parseInt(hexStr.substring(start + 12, start + 14), 16);
    wifiList.push({
      bssid: bssid.match(/.{2}/g)?.join(":"),
      rssi: -rssi,
    });
  }
  return wifiList;
}

function parseLBS(hexStr: string, count: number, offset: number) {
  const towers = [];
  for (let i = 0; i < count; i++) {
    const base = offset + i * 18;
    if (base + 18 > hexStr.length) break; // bounds check
    const lacHex = hexStr.substring(base, base + 8);
    const cellHex = hexStr.substring(base + 8, base + 16);
    const rssiHex = hexStr.substring(base + 16, base + 18);
    const lac = parseInt(lacHex, 16);
    const cellId = parseInt(cellHex, 16);
    const rssi = parseInt(rssiHex, 16);
    if (Number.isNaN(lac) || Number.isNaN(cellId) || Number.isNaN(rssi)) break;
    towers.push({ lac, cellId, rssi: -rssi });
  }
  return towers;
}

function sendAck(socket: net.Socket, protocol: string, bcdTimestamp: string) {
  const ack = Buffer.from(`787800${protocol}${bcdTimestamp}0D0A`, "hex");
  socket.write(ack);
  console.log(
    `>> [SENT] Ack sent for protocol ${protocol}, ${ack
      .toString("hex")
      .toUpperCase()}`
  );
}

export function handleMultiLbsWifi(
  socket: net.Socket,
  hexStr: string,
  protocol: string
) {
  const wifiCount = parseInt(hexStr.substring(4, 6), 16);
  const timestamp = hexStr.substring(6, 18);
  const tsParts = timestamp.match(/.{2}/g);
  const readableTimestamp = tsParts
    ? `20${tsParts[0]}-${tsParts[1]}-${tsParts[2]} ${tsParts[3]}:${tsParts[4]}:${tsParts[5]}`
    : `Invalid timestamp (${timestamp})`;

  const wifiOffset = 18;
  const wifiData = parseWifi(hexStr, wifiCount, wifiOffset);
  const lbsStart = wifiOffset + wifiCount * 14;

  if (hexStr.length < lbsStart + 8) {
    console.warn(
      `[0x${protocol}] Packet too short to contain valid LBS headers.`
    );
    sendAck(socket, protocol, timestamp);
    return;
  }

  const lbsCount = parseInt(hexStr.substring(lbsStart, lbsStart + 2), 16);
  const mccHex = hexStr.substring(lbsStart + 2, lbsStart + 6);
  const mncHex = hexStr.substring(lbsStart + 6, lbsStart + 8);
  const mcc = parseInt(mccHex, 16);
  const mnc = parseInt(mncHex, 16);

  const lbsTowerStart = lbsStart + 8;
  const expectedLbsDataLen = lbsCount * 18;
  if (hexStr.length < lbsTowerStart + expectedLbsDataLen) {
    console.warn(`[0x${protocol}] Not enough LBS tower data, adjusting count.`);
  }

  const towers = parseLBS(hexStr, lbsCount, lbsTowerStart);
  const alarmOffset = lbsTowerStart + towers.length * 18;
  const alarmByte = hexStr.substring(alarmOffset, alarmOffset + 2);

  console.log(`[0x${protocol}] LBS+WiFi packet received`);
  console.log(`  • Timestamp: ${readableTimestamp}`);
  console.log(`  • WiFi Hotspots (${wifiCount}):`);
  wifiData.forEach((w, i) => {
    console.log(`     - ${i + 1}: BSSID = ${w.bssid}, RSSI = ${w.rssi} dBm`);
  });
  console.log(`  • Mobile Country Code (MCC): ${mcc}`);
  console.log(`  • Mobile Network Code (MNC): ${mnc}`);
  console.log(`  • Cell Towers (${towers.length}):`);
  towers.forEach((t, i) => {
    console.log(
      `     - ${i + 1}: LAC = ${t.lac}, Cell ID = ${t.cellId}, RSSI = ${
        t.rssi
      } dBm`
    );
  });
  console.log(`  • Alarm Byte: 0x${alarmByte}`);

  sendAck(socket, protocol, timestamp);
}
