import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all posts
router.get('/', async (req, res) => {
  const posts = await prisma.post.findMany({
    include: { author: true, comments: true, likes: true, tags: true }
  });
  res.json(posts);
});

// Create post
router.post('/', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  try {
    const post = await prisma.post.create({
      data: { title, content, authorId: req.user.id }
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Could not create post' });
  }
});

// Like post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const like = await prisma.like.create({
      data: { postId: parseInt(req.params.id), userId: req.user.id }
    });
    res.status(201).json(like);
  } catch (err) {
    res.status(500).json({ error: 'Could not like post' });
  }
});

export default router;
