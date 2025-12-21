import { Router } from "express";
import { getThreads, getMessages, startConversation, sendMessage } from "../controllers/chatController.js";

const router = Router();

// GET /api/chat/threads - list conversations for current user
router.get("/threads", getThreads);

// POST /api/chat - start a 1:1 conversation
router.post("/", startConversation);

// GET /api/chat/:id/messages - messages for a conversation
router.get("/:id/messages", getMessages);

// POST /api/chat/:id/messages - send a message in a conversation
router.post("/:id/messages", sendMessage);

export default router;