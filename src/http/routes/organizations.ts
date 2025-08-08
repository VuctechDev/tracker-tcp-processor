import express from "express";
import db from "../../db";
import { handleFailedRequest } from "../handleFailedRequest";

const router = express.Router();

router.get("/", async (req, res) => {
  const organizationId = req.headers.organizationId as string;
  if (!organizationId) {
    return handleFailedRequest(res, req, {
      code: 400,
      message: `organizationId is required`,
    });
  }
  const data = await db.organizations.getById(organizationId);

  res.json({ data });
});

export default router;
