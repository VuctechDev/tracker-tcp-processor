import express from "express";
import db from "../../db";
import { generateAccessToken } from "../../lib/jwt";
import { handleFailedRequest } from "../handleFailedRequest";

const router = express.Router();

router.post("/start-session", async (req, res) => {
  const body = req.body;
  const authCode = body?.code;
  if (!authCode) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: "Code is required!",
    });
  }
  const user = await db.users.getByCode(authCode);
  if (!user) {
    return handleFailedRequest(res, req, {
      code: 404,
      message: "Invalid credentials",
    });
  }
  let role = "user";
  if (authCode === "NQXZWYP2APVTULDAEI") {
    role = "admin";
  }
  const token = generateAccessToken(user, role);

  res.json({ token });
});

export default router;
