import net from "net";

// === CONFIGURATION SECTION ===
const PORT = 5001; // Your server port
const HOST = "0.0.0.0"; // Listen on all interfaces

// === Helper: Convert Buffer to Hex String ===
function bufferToHex(buffer: any) {
  return buffer.toString("hex").toUpperCase();
}

// === Helper: Decode Login Packet (Protocol 0x01) ===
function decodeLoginPacket(buffer: any) {
  const imei = buffer
    .slice(4, 12)
    .toString("hex")
    .match(/.{1,2}/g)
    .join("");
  const version = buffer[12];
  console.log(`Device Login: IMEI ${imei}, Software Version ${version}`);
}

// === Helper: Decode GPS Packet (Protocol 0x10 or 0x11) ===
function decodeGpsPacket(buffer: any) {
  const dateBytes = buffer.slice(4, 10);
  const dateStr = [...dateBytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const year = 2000 + parseInt(dateStr.slice(0, 2), 16);
  const month = parseInt(dateStr.slice(2, 4), 16);
  const day = parseInt(dateStr.slice(4, 6), 16);
  const hour = parseInt(dateStr.slice(6, 8), 16);
  const minute = parseInt(dateStr.slice(8, 10), 16);
  const second = parseInt(dateStr.slice(10, 12), 16);
  console.log(
    `GPS Timestamp: ${year}-${month}-${day} ${hour}:${minute}:${second}`
  );
  // You can extend here: parse lat/lon, speed, etc.
}

// === Create TCP Server ===
const server = net.createServer((socket) => {
  console.log(
    `Client connected from ${socket.remoteAddress}:${socket.remotePort}`
  );

  socket.on("data", (data) => {
    const hexStr = bufferToHex(data);
    console.log(`Received Raw: ${hexStr}`);

    const protocol = data[3];
    switch (protocol) {
      case 0x01:
        decodeLoginPacket(data);
        // Send back login response
        const response = Buffer.from("787801010D0A", "hex");
        socket.write(response);
        console.log("Sent Login Acknowledgment");
        break;
      case 0x10:
      case 0x11:
        decodeGpsPacket(data);
        // Send back GPS response
        const gpsResponse = Buffer.from(
          "78780010" + hexStr.slice(8, 20) + "0D0A",
          "hex"
        );
        socket.write(gpsResponse);
        console.log("Sent GPS Acknowledgment");
        break;
      default:
        console.log(`Unknown Protocol: 0x${protocol.toString(16)}`);
    }
  });

  socket.on("close", () => {
    console.log(`Client disconnected: ${socket.remoteAddress}`);
  });

  socket.on("error", (err) => {
    console.error(`Socket Error: ${err.message}`);
  });
});

// === Start Listening ===
server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});

// === Handle Server Errors ===
server.on("error", (err) => {
  console.error(`Server Error: ${err.message}`);
});
