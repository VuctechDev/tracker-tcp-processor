import express from "express";
import db from "../../db";
import { handleFailedRequest } from "../handleFailedRequest";

const router = express.Router();

router.post("/", async (req, res) => {
  const body = req.body;
  if (!body?.name) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "Name is required",
    });
  }
  db.users.create(body.name);
  res.json({ data: 1 });
});

export default router;
