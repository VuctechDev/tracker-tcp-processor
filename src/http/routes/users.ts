import express from "express";
import db from "../../db";

const router = express.Router();

router.post("/", async (req, res) => {
  const body = req.body;
  if (!body?.name) {
    console.warn(`Error: name is required`);
    res.status(400).json({ data: "Error: name is required" });
    return;
  }
  db.users.create(body.name);

  res.json({ data: 1 });
});

export default router;
