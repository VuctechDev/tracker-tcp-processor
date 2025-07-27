import express from "express";
import db from "../../db";
import { generateAccessToken } from "../../lib/jwt";
import { handleFailedRequest } from "../handleFailedRequest";

const router = express.Router();

router.post("/start-session", async (req, res) => {
  const body = req.body;
  if (!body?.code) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "Code is required!",
    });
  }
  const user = await db.users.getByCode(body.code);
  if (!user) {
    return handleFailedRequest(res, req, {
      code: 404,
      message: "Invalid credentials",
    });
  }
  const token = generateAccessToken(user);

  res.json({ token });
});

export default router;
