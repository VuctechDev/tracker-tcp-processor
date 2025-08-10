import express from "express";
import cors from "cors";
import db from "../db";
import devicesRouter from "./routes/devices";
import authRouter from "./routes/auth";
import boRouter from "./routes/bo";
import geofencesRouter from "./routes/geofences";
import organizationsRouter from "./routes/organizations";

import { authGuard } from "./middleware";
import { handleNewLocation } from "../lib/handlers/handleNewLocation";

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.use("/devices", authGuard, devicesRouter);
app.use("/auth", authRouter);
app.use("/bo", authGuard, boRouter);
app.use("/geofence", authGuard, geofencesRouter);
app.use("/organizations", authGuard, organizationsRouter);

app.get("/data/:imei", async (req, res) => {
  const { imei } = req.params;
  const data = await db.records.getByIMEI(imei);
  res.json({ data });
});

app.get("/logs/:imei", async (req, res) => {
  const { imei } = req.params;
  const data = await db.logs.getByIMEI(imei);
  res.json({ data });
});

app.get("/status", async (req, res) => {
  res.json({
    status: `Running in ${process.env.NODE_ENV} mode`,
  });
});

app.post("/test/new-location", async (req, res) => {
  const body = req.body;
  console.log(body);
  await handleNewLocation(body);
  res.json({ data: true });
});

export const httpInit = (HTTP_PORT: string) => {
  app.listen(parseInt(HTTP_PORT), () => {
    db.devices.setAllOffline();
    console.log(`HTTP app running on PORT: ${HTTP_PORT}`);
  });
};
