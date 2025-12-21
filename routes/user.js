import { Router } from "express";
import {
  getCurrentUser,
  updateUserProfile,
  getUserProfile,
  getUserPosts,
  followUser,
  getUserFollowers,
  getUserFollowing,
  searchUsers,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// ✅ IMPORTANT: Protected routes MUST come before :id routes!
router.get("/me", authenticateToken, getCurrentUser);
router.put("/me", authenticateToken, updateUserProfile);

// Public routes
router.get("/search", searchUsers);
router.get("/:id", getUserProfile);
router.get("/:id/posts", getUserPosts);
router.get("/:id/followers", getUserFollowers);
router.get("/:id/following", getUserFollowing);

// Protected routes (auth required)
router.post("/:id/follow", authenticateToken, followUser);

export default router;