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

  const data = await db.health.getById(deviceId);

  res.json({ data });
});

export default router;
