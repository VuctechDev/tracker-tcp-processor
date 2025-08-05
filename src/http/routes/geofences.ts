import express from "express";
import db from "../../db";
import { handleFailedRequest } from "../handleFailedRequest";

const router = express.Router();

router.get("/", async (req, res) => {
  const query = req.query;
  const deviceId = query.deviceId as string;
  if (!deviceId) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "deviceId is required!",
    });
  }

  const data = await db.geofences.getById(deviceId);

  res.json({ data });
});

router.post("/", async (req, res) => {
  const body = req.body;
  if (!body?.deviceId || !body?.coordinates) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "deviceId and coordinates is required!",
    });
  }
  await db.geofences.insert(body);

  res.json({ data: true });
});

router.patch("/", async (req, res) => {
  const body = req.body;
  if (!body?.deviceId || !body?.coordinates) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "deviceId and coordinates is required!",
    });
  }
  await db.geofences.updateCoordinates(body);
  res.json({ data: true });
});

export default router;
