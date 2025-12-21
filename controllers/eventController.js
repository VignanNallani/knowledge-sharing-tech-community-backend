// controllers/eventController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getEvents = async (req, res) => {
  const events = await prisma.event.findMany({ include: { attendees: true } });
  res.json(events);
};

export const joinEvent = async (req, res) => {
  const event = await prisma.event.update({
    where: { id: parseInt(req.params.id) },
    data: { attendees: { connect: { id: req.user.id } } },
  });
  res.json(event);
};
