// GPS tracker TCP server (Node.js) – Login handshake handler

import net from "net";

const PORT = 5555;
const server = net.createServer();

server.on("connection", (socket: any) => {
  console.log("New connection established");

  socket.on("data", (data: any) => {
    const hex = data.toString("hex");
    console.log(`[RECEIVED] ${hex}`);

    // Provjera da li je login paket (0x01)
    if (hex.startsWith("7878") && hex.substr(6, 2) === "01") {
      // Ekstrakcija vremena iz login paketa (nije neophodno ovdje)
      console.log("Login packet detected");

      // Slanje odgovora: 7878 01 01 0D0A (login OK)
      const response = Buffer.from("787801010D0A", "hex");
      socket.write(response, () => {
        console.log(`[SENT] Login ACK sent: ${response.toString("hex")}`);
      });
    } else {
      console.log("Non-login packet received");
    }
  });

  socket.on("close", () => {
    console.log("Connection closed");
  });

  socket.on("error", (err: any) => {
    console.error("Socket error:", err);
  });
});

server.listen(PORT, () => {
  console.log(`GPS Server listening on port ${PORT}`);
});
