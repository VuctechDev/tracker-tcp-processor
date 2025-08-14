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
import { handleFailedRequest } from "../handleFailedRequest";
import { getDeviceAnalytics } from "../../lib/handlers/getDeviceAnalytics";
import { DeviceType } from "../../db/devices";

const router = express.Router();

router.get("/", async (req, res) => {
  const organizationId = req.headers.organizationId as string;
  const role = req.headers.role as string;
  if (!organizationId) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: `organizationId is required`,
    });
  }
  let data: DeviceType[] = [];
  if (role === "admin") {
    data = await db.devices.get();
  } else {
    data = await db.devices.getOrganizationDevices(organizationId);
  }

  const dataWithAnalytics = await Promise.all(
    data.map(async (device) => ({
      ...device,
      analytics: await getDeviceAnalytics(device.imei),
    }))
  );

  res.json({ data: dataWithAnalytics });
});

router.patch("/command/:id", async (req, res) => {
  const imei = req.params.id;
  const protocol = req.body?.code;
  const value = req.body?.value;
  const socket = devices.get(imei);

  if (!socket) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: `Socket not found for device - ${imei}`,
    });
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
    return handleFailedRequest(res, req, {
      code: 400,
      message: `Socket not found for device or no value - ${imei}`,
    });
  }

  const buffer = Buffer.from(value, "hex");
  socket.write(buffer);
  console.log(`[RAW SENT] ${value} - IMEI: ${imei}`);
  res.json({ data: 1 });
});

export default router;
