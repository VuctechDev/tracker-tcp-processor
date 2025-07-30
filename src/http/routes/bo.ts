import express from "express";
import db from "../../db";
import { handleFailedRequest } from "../handleFailedRequest";

const router = express.Router();

router.get("/devices", async (req, res) => {
  const data = await db.devices.get();
  res.json({ data });
});

router.patch("/devices", async (req, res) => {
  const body = req.body;
  if (!body.organizationId || !body.id || !body.name) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "ID, name and organizationId required",
    });
  }
  db.devices.updateFromBO({
    id: body.id,
    organizationId: body.organizationId,
    name: body.name,
  });
  res.json({ data: 1 });
});

router.get("/users", async (req, res) => {
  const data = await db.users.get();
  res.json({ data });
});

router.post("/users", async (req, res) => {
  const body = req.body;
  if (!body?.name || !body.organizationId) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "Name and organizationId required",
    });
  }
  db.users.create(body.name, body.organizationId);
  res.json({ data: 1 });
});

router.patch("/users", async (req, res) => {
  const body = req.body;
  if (!body.organizationId || !body.id) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "ID and organizationId required",
    });
  }
  db.users.update({ id: body.id, organizationId: body.organizationId });
  res.json({ data: 1 });
});

router.get("/organizations", async (req, res) => {
  const data = await db.organizations.get();
  res.json({ data });
});

router.post("/organizations", async (req, res) => {
  const body = req.body;
  if (!body?.name) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "Name is required",
    });
  }
  db.organizations.create(body.name);
  res.json({ data: 1 });
});

export default router;
