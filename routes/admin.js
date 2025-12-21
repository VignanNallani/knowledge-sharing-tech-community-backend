import { Router } from "express";

const router = Router();

router.get("/stats", (req, res) => {
  res.json({ message: "Admin stats endpoint", user: req.user });
});

router.get("/users", (req, res) => {
  res.json({ message: "Get all users" });
});

export default router;