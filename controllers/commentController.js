// controllers/commentController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createComment = async (req, res) => {
  const { content, postId } = req.body;
  const comment = await prisma.comment.create({
    data: { content, postId, authorId: req.user.id },
  });
  res.status(201).json(comment);
};

export const getCommentsByPost = async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: parseInt(req.params.postId) },
    include: { author: true },
  });
  res.json(comments);
};

export const updateComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim().length < 1) {
    return res.status(400).json({ error: 'Content cannot be empty' });
  }

  const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } });
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  if (comment.authorId !== userId) {
    return res.status(403).json({ error: 'Not authorized to edit this comment' });
  }

  const updated = await prisma.comment.update({
    where: { id: parseInt(id) },
    data: { content: content.trim() },
    include: { author: true },
  });

  res.json({ message: 'Comment updated', comment: updated });
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } });
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  // allow author or admin (role check)
  if (comment.authorId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized to delete this comment' });
  }

  await prisma.comment.delete({ where: { id: parseInt(id) } });
  res.json({ message: 'Comment deleted' });
};
