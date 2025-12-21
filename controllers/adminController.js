// controllers/adminController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getDashboard = async (req, res) => {
  const totalUsers = await prisma.user.count();
  const totalPosts = await prisma.post.count();
  const totalComments = await prisma.comment.count();
  const totalEvents = await prisma.event.count();
  res.json({ totalUsers, totalPosts, totalComments, totalEvents });
};

export const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};
