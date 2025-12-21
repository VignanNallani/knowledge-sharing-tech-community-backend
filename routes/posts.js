import { Router } from "express";
import {
  createPost,
  getPosts,
  searchPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  commentOnPost,
  getPostComments,
} from "../controllers/postController.js";

const router = Router();

// ✅ Search route (must be before /:id to avoid conflicts)
router.get("/search", searchPosts);

// Get all posts & Create post
router.get("/", getPosts);
router.post("/", createPost);

// Single post operations
router.get("/:id", getPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.post("/:id/like", likePost);
router.post("/:id/comment", commentOnPost);
router.get("/:id/comments", getPostComments);

export default router;