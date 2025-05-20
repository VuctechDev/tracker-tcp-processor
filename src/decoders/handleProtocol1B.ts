import net from "net";

// Parse WiFi hotspots
function parseWifi(hexStr: string, count: number, offset: number) {
  const wifiList = [];
  for (let i = 0; i < count; i++) {
    const start = offset + i * 14;
    const bssid = hexStr.substring(start, start + 12);
    const rssi = parseInt(hexStr.substring(start + 12, start + 14), 16);
    wifiList.push({
      bssid: bssid.match(/.{2}/g)?.join(":").toUpperCase(),
      rssi: -rssi,
    });
  }
  return wifiList;
}

// Parse LBS tower data
function parseLBS(hexStr: string, count: number, offset: number) {
  const towers = [];
  for (let i = 0; i < count; i++) {
    const base = offset + i * 18; // 9 bytes = 18 hex chars
    const lac = hexStr.substring(base, base + 8);
    const cellId = hexStr.substring(base + 8, base + 16);
    const rssi = parseInt(hexStr.substring(base + 16, base + 18), 16);
    towers.push({
      lac,
      cellId,
      rssi: -rssi,
    });
  }
  return towers;
}

// Send ACK response with timestamp
function sendAck(socket: net.Socket, protocol: string, bcdTimestamp: string) {
  const ack = Buffer.from(`787800${protocol}${bcdTimestamp}0D0A`, "hex");
  socket.write(ack);
  console.log(
    `>> [SENT] Ack sent for protocol ${protocol}, ${ack
      .toString("hex")
      .toUpperCase()}`
  );
}

// Handle protocol 0x1B (Offline 4G LBS + WiFi data)
export function handleProtocol1B(socket: net.Socket, hexStr: string) {
  const wifiCount = parseInt(hexStr.substring(4, 6), 16);
  const timestamp = hexStr.substring(6, 18); // BCD YYMMDDHHMMSS

  const wifiOffset = 18;
  const wifiData = parseWifi(hexStr, wifiCount, wifiOffset);

  const lbsStart = wifiOffset + wifiCount * 14;
  const lbsCount = parseInt(hexStr.substring(lbsStart, lbsStart + 2), 16);
  const mcc = hexStr.substring(lbsStart + 2, lbsStart + 6);
  const mnc = hexStr.substring(lbsStart + 6, lbsStart + 8);

  const lbsTowerStart = lbsStart + 8;
  const towers = parseLBS(hexStr, lbsCount, lbsTowerStart);

  const alarmOffset = lbsTowerStart + lbsCount * 18;
  const alarmByte = hexStr.substring(alarmOffset, alarmOffset + 2);

  // ⬇️ Decode timestamp for readable output (optional)
  const ts = timestamp.match(/.{2}/g) || [];
  const readableTimestamp = `20${ts[0]}-${ts[1]}-${ts[2]} ${ts[3]}:${ts[4]}:${ts[5]}`;

  // 🖨 Logging with decoded values
  console.log(`[0x1B] Offline LBS+WiFi packet received`);
  console.log(`  • Timestamp: ${readableTimestamp}`);
  console.log(`  • WiFi Hotspots (${wifiCount}):`);
  wifiData.forEach((w, i) => {
    console.log(
      `     - ${i + 1}: BSSID (MAC) = ${w.bssid}, RSSI (signal strength) = ${
        w.rssi
      } dBm`
    );
  });

  console.log(`  • Mobile Country Code (MCC): ${parseInt(mcc, 16)}`);
  console.log(`  • Mobile Network Code (MNC): ${parseInt(mnc, 16)}`);
  console.log(`  • Cell Towers (${lbsCount}):`);
  towers.forEach((t, i) => {
    console.log(
      `     - ${i + 1}: LAC (Location Area Code) = ${parseInt(
        t.lac,
        16
      )}, Cell ID = ${parseInt(t.cellId, 16)}, RSSI = ${t.rssi} dBm`
    );
  });

  console.log(`  • Alarm Byte: 0x${alarmByte}`);

  sendAck(socket, "1B", timestamp);
}
