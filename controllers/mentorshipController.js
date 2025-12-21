import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Request Mentorship
export const requestMentorship = async (req, res) => {
  try {
    const { mentorId, topic, preferredSlot } = req.body;
    const menteeId = req.user.id;

    if (!mentorId || !topic) {
      return res.status(400).json({ error: "Mentor ID and topic are required" });
    }

    // ✅ FIXED: Convert both to integers for comparison
    const mentorIdInt = parseInt(mentorId);
    if (isNaN(mentorIdInt)) {
      return res.status(400).json({ error: "Invalid mentor ID" });
    }

    if (menteeId === mentorIdInt) {  // ✅ FIXED: Now comparing integers
      return res.status(400).json({ error: "You cannot request mentorship from yourself" });
    }

    // Check if mentor exists
    const mentor = await prisma.user.findUnique({
      where: { id: mentorIdInt },
    });

    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }

    // Check if already exists
    const existing = await prisma.mentorship.findFirst({
      where: { menteeId, mentorId: mentorIdInt },
    });

    if (existing) {
      return res.status(400).json({ error: "Mentorship request already exists" });
    }

    // Create mentorship request
    const mentorship = await prisma.mentorship.create({
      data: {
        menteeId,
        mentorId: mentorIdInt,
        topic: topic.trim(),
        status: "pending",
        preferredSlot: preferredSlot ? new Date(preferredSlot) : undefined,
      },
      include: {
        mentor: { select: { id: true, name: true, profileImage: true } },
        mentee: { select: { id: true, name: true, profileImage: true } },
      },
    });

    res.status(201).json({
      message: "Mentorship request sent",
      mentorship,
    });
  } catch (err) {
    console.error("Request mentorship error:", err);
    res.status(500).json({ error: "Failed to request mentorship" });
  }
};

// ✅ Get Pending Mentorship Requests (for mentors)
export const getPendingRequests = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * parseInt(limit);

  try {
    const requests = await prisma.mentorship.findMany({
      where: {
        mentorId: req.user.id,
        status: "pending",
      },
      skip: skip,
      take: parseInt(limit),
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalRequests = await prisma.mentorship.count({
      where: {
        mentorId: req.user.id,
        status: "pending",
      },
    });

    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRequests / parseInt(limit)),
        totalRequests,
      },
    });
  } catch (err) {
    console.error("Get pending requests error:", err);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
};

// ✅ Accept Mentorship Request
export const acceptMentorship = async (req, res) => {
  const { id } = req.params;

  try {
    const mentorshipId = parseInt(id);
    if (isNaN(mentorshipId)) {
      return res.status(400).json({ error: "Invalid mentorship ID" });
    }

    const mentorship = await prisma.mentorship.findUnique({
      where: { id: mentorshipId },
    });

    if (!mentorship) {
      return res.status(404).json({ error: "Mentorship request not found" });
    }

    if (mentorship.mentorId !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to accept this request" });
    }

    if (mentorship.status !== "pending") {
      return res.status(400).json({ error: "This request is not pending" });
    }

    // Update status
    const updated = await prisma.mentorship.update({
      where: { id: mentorshipId },
      data: { status: "accepted" },
      include: {
        mentor: { select: { id: true, name: true, profileImage: true } },
        mentee: { select: { id: true, name: true, profileImage: true } },
      },
    });

    res.json({
      message: "Mentorship request accepted",
      mentorship: updated,
    });
  } catch (err) {
    console.error("Accept mentorship error:", err);
    res.status(500).json({ error: "Failed to accept mentorship" });
  }
};

// ✅ Reject Mentorship Request
export const rejectMentorship = async (req, res) => {
  const { id } = req.params;

  try {
    const mentorshipId = parseInt(id);
    if (isNaN(mentorshipId)) {
      return res.status(400).json({ error: "Invalid mentorship ID" });
    }

    const mentorship = await prisma.mentorship.findUnique({
      where: { id: mentorshipId },
    });

    if (!mentorship) {
      return res.status(404).json({ error: "Mentorship request not found" });
    }

    if (mentorship.mentorId !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to reject this request" });
    }

    if (mentorship.status !== "pending") {
      return res.status(400).json({ error: "This request is not pending" });
    }

    // Delete the request
    await prisma.mentorship.delete({
      where: { id: mentorshipId },
    });

    res.json({ message: "Mentorship request rejected" });
  } catch (err) {
    console.error("Reject mentorship error:", err);
    res.status(500).json({ error: "Failed to reject mentorship" });
  }
};

// ✅ Get My Mentorships (as mentor)
export const getMyMentorships = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * parseInt(limit);

  try {
    const mentorships = await prisma.mentorship.findMany({
      where: {
        mentorId: req.user.id,
        status: "accepted",
      },
      skip: skip,
      take: parseInt(limit),
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalMentorships = await prisma.mentorship.count({
      where: {
        mentorId: req.user.id,
        status: "accepted",
      },
    });

    res.json({
      mentorships,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMentorships / parseInt(limit)),
        totalMentorships,
      },
    });
  } catch (err) {
    console.error("Get my mentorships error:", err);
    res.status(500).json({ error: "Failed to fetch mentorships" });
  }
};

// ✅ Get My Mentees
export const getMyMentees = async (req, res) => {
  try {
    const mentorships = await prisma.mentorship.findMany({
      where: {
        mentorId: req.user.id,
        status: "accepted",
      },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            bio: true,
            skills: true,
          },
        },
      },
    });

    const mentees = mentorships.map((m) => ({
      ...m.mentee,
      mentorshipTopic: m.topic,
      mentorshipId: m.id,
    }));

    res.json({
      mentees,
      totalMentees: mentees.length,
    });
  } catch (err) {
    console.error("Get my mentees error:", err);
    res.status(500).json({ error: "Failed to fetch mentees" });
  }
};

// ✅ Get My Mentors (as mentee)
export const getMyMentors = async (req, res) => {
  try {
    const mentorships = await prisma.mentorship.findMany({
      where: {
        menteeId: req.user.id,
        status: "accepted",
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            bio: true,
            skills: true,
          },
        },
      },
    });

    const mentors = mentorships.map((m) => ({
      ...m.mentor,
      mentorshipTopic: m.topic,
      mentorshipId: m.id,
    }));

    res.json({
      mentors,
      totalMentors: mentors.length,
    });
  } catch (err) {
    console.error("Get my mentors error:", err);
    res.status(500).json({ error: "Failed to fetch mentors" });
  }
};

// ✅ Find Available Mentors
export const findMentors = async (req, res) => {
  const { topic, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * parseInt(limit);

  try {
    // Find users who might be mentors (filter by bio/skills mentioning the topic)
    const mentors = await prisma.user.findMany({
      where: {
        id: { not: req.user.id }, // Exclude current user
        bio: topic ? { contains: topic } : undefined,
      },
      skip: skip,
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        profileImage: true,
        skills: true,
      },
    });

    const totalMentors = await prisma.user.count({
      where: {
        id: { not: req.user.id },
        bio: topic ? { contains: topic } : undefined,
      },
    });

    res.json({
      mentors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMentors / parseInt(limit)),
        totalMentors,
      },
    });
  } catch (err) {
    console.error("Find mentors error:", err);
    res.status(500).json({ error: "Failed to find mentors" });
  }
};

// ✅ End Mentorship
export const endMentorship = async (req, res) => {
  const { id } = req.params;

  try {
    const mentorshipId = parseInt(id);
    if (isNaN(mentorshipId)) {
      return res.status(400).json({ error: "Invalid mentorship ID" });
    }

    const mentorship = await prisma.mentorship.findUnique({
      where: { id: mentorshipId },
    });

    if (!mentorship) {
      return res.status(404).json({ error: "Mentorship not found" });
    }

    // Check if user is mentor or mentee
    if (mentorship.mentorId !== req.user.id && mentorship.menteeId !== req.user.id) {
      return res.status(403).json({ error: "You are not part of this mentorship" });
    }

    // Delete mentorship
    await prisma.mentorship.delete({
      where: { id: mentorshipId },
    });

    res.json({ message: "Mentorship ended" });
  } catch (err) {
    console.error("End mentorship error:", err);
    res.status(500).json({ error: "Failed to end mentorship" });
  }
};