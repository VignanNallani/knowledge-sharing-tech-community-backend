import { Router } from "express";
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

const router = Router();

// Create comment (also available via /api/posts/:id/comment)
router.post("/", createComment);

// Get comments for a post
router.get("/post/:postId", getCommentsByPost);

// Update a comment (only author)
router.put("/:id", updateComment);

// Delete a comment (author or admin)
router.delete("/:id", deleteComment);

export default router;
