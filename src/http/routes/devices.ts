import express from "express";
import db from "../../db";
import { devices } from "../../devices";
import {
  getLocation,
  restartDevice,
  turnAlarmOnOff,
  updateDeviceInterval,
  updateStatusInterval,
} from "../../commands";

const router = express.Router();

router.get("/", async (req, res) => {
  const data = await db.devices.get();
  res.json({ data });
});

router.patch("/command/:id", async (req, res) => {
  const imei = req.params.id;
  const protocol = req.body?.code;
  const value = req.body?.value;
  const socket = devices.get(imei);

  if (!socket) {
    console.warn(`Socket not found for device ${imei}`);
    res.json({ data: 1 });
    return;
  }

  let ack = "";
  if (protocol === "48") {
    ack = restartDevice(socket);
  } else if (protocol === "13") {
    ack = updateStatusInterval(socket, value);
  } else if (protocol === "49") {
    ack = turnAlarmOnOff(socket, value);
  } else if (protocol === "80") {
    ack = getLocation(socket);
  } else if (protocol === "97") {
    ack = updateDeviceInterval(socket, value, imei);
  }

  console.log(`[SENT] 0x${req.body.code} - IMEI: ${imei}, CODE: ${ack}`);
  res.json({ data: 1 });
});

router.patch("/raw-command/:id", async (req, res) => {
  const imei = req.params.id;
  const value = req.body?.value;
  const socket = devices.get(imei);

  if (!socket || !value) {
    console.warn(`Socket not found for device or no value - ${imei}`);
    res.json({ data: 1 });
    return;
  }

  const buffer = Buffer.from(value, "hex");
  socket.write(buffer);
  console.log(`[RAW SENT] ${value} - IMEI: ${imei}`);
  res.json({ data: 1 });
});

export default router;
