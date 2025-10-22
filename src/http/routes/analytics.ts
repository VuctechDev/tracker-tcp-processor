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

  const data = await db.analytics.getByIMEI(deviceId);

  res.json({ data });
});

router.get("/:deviceId", async (req, res) => {
  const query = req.query;
  const { deviceId } = req.params;
  const tz = query?.tz as string;
  if (!deviceId) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "deviceId is required!",
    });
  }

  const data = await db.analytics.getByIMEI2(deviceId, tz);

  res.json({ data });
});

export default router;
