import { Router } from "express";
import {
  requestMentorship,
  getPendingRequests,
  acceptMentorship,
  rejectMentorship,
  getMyMentorships,
  getMyMentees,
  getMyMentors,
  findMentors,
  endMentorship,
} from "../controllers/mentorshipController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Protected routes (auth required)
router.post("/request", authenticateToken, requestMentorship);
router.get("/requests/pending", authenticateToken, getPendingRequests);
router.put("/:id/accept", authenticateToken, acceptMentorship);
router.put("/:id/reject", authenticateToken, rejectMentorship);
router.get("/my-mentorships", authenticateToken, getMyMentorships);
router.get("/my-mentees", authenticateToken, getMyMentees);
router.get("/my-mentors", authenticateToken, getMyMentors);
router.delete("/:id", authenticateToken, endMentorship);

// Public route
router.get("/find", findMentors);

export default router;