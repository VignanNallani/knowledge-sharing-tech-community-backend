import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Get Current User Profile
export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        profileImage: true,
        skills: true,
        createdAt: true,
        posts: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Count followers/following
    const followersCount = await prisma.follower.count({
      where: { followingId: user.id },
    });

    const followingCount = await prisma.follower.count({
      where: { followerId: user.id },
    });

    res.json({
      user: {
        ...user,
        postsCount: user.posts.length,
        followersCount,
        followingCount,
      },
    });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// ✅ Update User Profile
export const updateUserProfile = async (req, res) => {
  const { name, bio, profileImage } = req.body;
  const userId = req.user.id;

  try {
    // Validate input
    if (name && name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({ error: "Bio must be less than 500 characters" });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name: name.trim() }),
        ...(bio !== undefined && { bio }),
        ...(profileImage && { profileImage }),
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// ✅ Get User Profile (Public)
export const getUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        profileImage: true,
        skills: true,
        createdAt: true,
        posts: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Count followers/following
    const followersCount = await prisma.follower.count({
      where: { followingId: userId },
    });

    const followingCount = await prisma.follower.count({
      where: { followerId: userId },
    });

    // Check if current user follows this user
    let isFollowing = false;
    if (req.user) {
      const follower = await prisma.follower.findFirst({
        where: {
          followerId: req.user.id,
          followingId: userId,
        },
      });
      isFollowing = !!follower;
    }

    // Count posts by this user (using authorId!)
    const postsCount = await prisma.post.count({
      where: { authorId: userId },
    });

    res.json({
      user: {
        ...user,
        postsCount,
        followersCount,
        followingCount,
        isFollowing,
      },
    });
  } catch (err) {
    console.error("Get user profile error:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// ✅ Get User Posts
export const getUserPosts = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * parseInt(limit); // ✅ FIXED: Calculate skip properly

  try {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      skip: skip, // ✅ FIXED: Add skip
      take: parseInt(limit), // ✅ FIXED: Add take (was missing!)
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, profileImage: true },
        },
        tags: true,
        likes: true,
        comments: true,
      },
    });

    const totalPosts = await prisma.post.count({
      where: { authorId: userId },
    });

    res.json({
      posts: posts.map((post) => ({
        ...post,
        likeCount: post.likes.length,
        commentCount: post.comments.length,
        isLiked: req.user
          ? post.likes.some((like) => like.userId === req.user.id)
          : false,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
      },
    });
  } catch (err) {
    console.error("Get user posts error:", err);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
};

// ✅ Follow User
export const followUser = async (req, res) => {
  const { id } = req.params;
  const followerId = req.user.id;
  const followingId = parseInt(id);

  if (isNaN(followingId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  if (followerId === followingId) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already following
    const existingFollow = await prisma.follower.findFirst({
      where: { followerId, followingId },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follower.delete({ where: { id: existingFollow.id } });
      return res.json({ message: "User unfollowed", following: false });
    }

    // Follow
    await prisma.follower.create({
      data: { followerId, followingId },
    });

    res.status(201).json({ message: "User followed", following: true });
  } catch (err) {
    console.error("Follow user error:", err);
    res.status(500).json({ error: "Failed to follow user" });
  }
};

// ✅ Get User Followers
export const getUserFollowers = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * parseInt(limit);

  try {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const followers = await prisma.follower.findMany({
      where: { followingId: userId },
      skip: skip,
      take: parseInt(limit),
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            bio: true,
          },
        },
      },
    });

    const totalFollowers = await prisma.follower.count({
      where: { followingId: userId },
    });

    res.json({
      followers: followers.map((f) => f.follower),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFollowers / parseInt(limit)),
        totalFollowers,
      },
    });
  } catch (err) {
    console.error("Get followers error:", err);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
};

// ✅ Get User Following
export const getUserFollowing = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * parseInt(limit);

  try {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      skip: skip,
      take: parseInt(limit),
      include: {
        following: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            bio: true,
          },
        },
      },
    });

    const totalFollowing = await prisma.follower.count({
      where: { followerId: userId },
    });

    res.json({
      following: following.map((f) => f.following),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFollowing / parseInt(limit)),
        totalFollowing,
      },
    });
  } catch (err) {
    console.error("Get following error:", err);
    res.status(500).json({ error: "Failed to fetch following" });
  }
};

// ✅ Search Users
export const searchUsers = async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Search query must be at least 2 characters" });
  }

  const skip = (page - 1) * parseInt(limit);
  const searchTerm = q.trim().toLowerCase(); // ✅ FIXED: Convert to lowercase for comparison

  try {
    // ✅ FIXED: Remove mode for SQLite compatibility
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } }, // ✅ FIXED: Removed mode
          { email: { contains: searchTerm } }, // ✅ FIXED: Removed mode
        ],
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
      },
    });

    const totalUsers = await prisma.user.count({
      where: {
        OR: [
          { name: { contains: searchTerm } }, // ✅ FIXED: Removed mode
          { email: { contains: searchTerm } }, // ✅ FIXED: Removed mode
        ],
      },
    });

    // Get counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const postsCount = await prisma.post.count({
          where: { authorId: u.id },
        });
        const followersCount = await prisma.follower.count({
          where: { followingId: u.id },
        });
        return {
          ...u,
          postsCount,
          followersCount,
        };
      })
    );

    res.json({
      users: usersWithCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
      },
    });
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: "Failed to search users" });
  }
};