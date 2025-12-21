import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Get events", user: req.user });
});

router.post("/", (req, res) => {
  res.json({ message: "Create event" });
});

export default router;