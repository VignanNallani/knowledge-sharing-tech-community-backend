import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Create Post (Enhanced)
export const createPost = async (req, res) => {
  const { title, content, tags } = req.body;
  const userId = req.user.id;
  const image = req.body.image || null;

  // Validation
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  if (title.trim().length < 5) {
    return res.status(400).json({ error: "Title must be at least 5 characters" });
  }

  if (content.trim().length < 10) {
    return res.status(400).json({ error: "Content must be at least 10 characters" });
  }

  try {
    // Create or connect tags
    const tagConnections = tags && tags.length > 0 
      ? await Promise.all(
          tags.map((tagName) =>
            prisma.tag.upsert({
              where: { name: tagName.toLowerCase() },
              update: {},
              create: { name: tagName.toLowerCase() },
            })
          )
        )
      : [];

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        image,
        authorId: userId,
        tags: {
          connect: tagConnections.map((tag) => ({ id: tag.id })),
        },
      },
      include: {
        author: {
          select: { id: true, name: true, profileImage: true },
        },
        tags: true,
        likes: true,
        comments: true,
      },
    });

    res.status(201).json({
      message: "Post created successfully",
      post: {
        ...post,
        likeCount: post.likes.length,
        commentCount: post.comments.length,
      },
    });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// ✅ Get Feed (Paginated - 50 per page)
export const getPosts = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const posts = await prisma.post.findMany({
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, profileImage: true, bio: true },
        },
        tags: true,
        likes: true,
        comments: {
          include: {
            author: {
              select: { id: true, name: true, profileImage: true },
            },
          },
        },
      },
    });

    const totalPosts = await prisma.post.count();
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts: posts.map((post) => ({
        ...post,
        likeCount: post.likes.length,
        commentCount: post.comments.length,
        isLiked: req.user ? post.likes.some((like) => like.userId === req.user.id) : false,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPosts,
        postsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// ✅ Search Posts (Title + Content + Tags)
export const searchPosts = async (req, res) => {
  const { q, page = 1, limit = 50 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Search query must be at least 2 characters" });
  }

  const skip = (page - 1) * limit;
  const searchTerm = q.toLowerCase();

  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
          {
            tags: {
              some: {
                name: { contains: searchTerm, mode: "insensitive" },
              },
            },
          },
        ],
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, profileImage: true },
        },
        tags: true,
        likes: true,
        comments: {
          include: {
            author: {
              select: { id: true, name: true, profileImage: true },
            },
          },
        },
      },
    });

    const totalResults = await prisma.post.count({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
          {
            tags: {
              some: {
                name: { contains: searchTerm, mode: "insensitive" },
              },
            },
          },
        ],
      },
    });

    res.json({
      posts: posts.map((post) => ({
        ...post,
        likeCount: post.likes.length,
        commentCount: post.comments.length,
        isLiked: req.user ? post.likes.some((like) => like.userId === req.user.id) : false,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResults / limit),
        totalResults,
        postsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Search posts error:", err);
    res.status(500).json({ error: "Failed to search posts" });
  }
};

// ✅ Get Single Post
export const getPost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: {
          select: { id: true, name: true, profileImage: true, bio: true },
        },
        tags: true,
        likes: true,
        comments: {
          include: {
            author: {
              select: { id: true, name: true, profileImage: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({
      ...post,
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      isLiked: req.user ? post.likes.some((like) => like.userId === req.user.id) : false,
    });
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

// ✅ Update Post (Only Author)
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;
  const userId = req.user.id;

  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }

    const tagConnections = tags && tags.length > 0
      ? await Promise.all(
          tags.map((tagName) =>
            prisma.tag.upsert({
              where: { name: tagName.toLowerCase() },
              update: {},
              create: { name: tagName.toLowerCase() },
            })
          )
        )
      : [];

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(id) },
      data: {
        title: title?.trim() || post.title,
        content: content?.trim() || post.content,
        tags: {
          set: tagConnections.map((tag) => ({ id: tag.id })),
        },
      },
      include: {
        author: {
          select: { id: true, name: true, profileImage: true },
        },
        tags: true,
        likes: true,
        comments: true,
      },
    });

    res.json({
      message: "Post updated successfully",
      post: {
        ...updatedPost,
        likeCount: updatedPost.likes.length,
        commentCount: updatedPost.comments.length,
      },
    });
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ error: "Failed to update post" });
  }
};

// ✅ Delete Post (Only Author)
export const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    await prisma.post.delete({ where: { id: parseInt(id) } });

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

// ✅ Like/Unlike Post
export const likePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const existingLike = await prisma.like.findFirst({
      where: { postId: parseInt(id), userId },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return res.json({ message: "Post unliked", liked: false });
    }

    await prisma.like.create({
      data: { postId: parseInt(id), userId },
    });

    res.json({ message: "Post liked", liked: true });
  } catch (err) {
    console.error("Like post error:", err);
    res.status(500).json({ error: "Failed to like/unlike post" });
  }
};

// ✅ Add Comment
export const commentOnPost = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim().length < 1) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId: parseInt(id),
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });

    res.status(201).json({
      message: "Comment added successfully",
      comment,
    });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// ✅ Get Post Comments
export const getPostComments = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(id) },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });

    const totalComments = await prisma.comment.count({
      where: { postId: parseInt(id) },
    });

    res.json({
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
      },
    });
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};