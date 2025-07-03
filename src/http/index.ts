import express from "express";
import cors from "cors";
import db from "../db";
import devicesRouter from "./routes/devices";
import usersRouter from "./routes/users";
import organizationsRouter from "./routes/organizations";

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.use("/devices", devicesRouter);
app.use("/users", usersRouter);
app.use("/organizations", organizationsRouter);

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

export const httpInit = (HTTP_PORT: string) => {
  app.listen(parseInt(HTTP_PORT), () => {
    db.devices.setAllOffline();
    console.log(`HTTP app running on PORT: ${HTTP_PORT}`);
  });
};
