import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ---------------------------
  // Create Users (idempotent)
  // ---------------------------
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashedpassword1',
      skills: 'Java, SQL',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob',
      email: 'bob@example.com',
      password: 'hashedpassword2',
      skills: 'Python, AI',
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      name: 'Charlie',
      email: 'charlie@example.com',
      password: 'hashedpassword3',
      skills: 'Cybersecurity',
    },
  });

  // ---------------------------
  // Create Posts
  // ---------------------------
  const post1 = await prisma.post.create({
    data: {
      title: 'First Post',
      content: 'This is Alice’s first post!',
      authorId: alice.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Second Post',
      content: 'Bob writes his first post here.',
      authorId: bob.id,
    },
  });

  // ---------------------------
  // Create Comments
  // ---------------------------
  await prisma.comment.create({
    data: {
      content: 'Nice post Alice!',
      authorId: bob.id,
      postId: post1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Thanks Bob!',
      authorId: alice.id,
      postId: post2.id,
    },
  });

  // ---------------------------
  // Create Likes
  // ---------------------------
  await prisma.like.create({
    data: { userId: bob.id, postId: post1.id },
  });

  await prisma.like.create({
    data: { userId: alice.id, postId: post2.id },
  });

  // ---------------------------
  // Create Tags (idempotent)
  // ---------------------------
  const tagAI = await prisma.tag.upsert({
    where: { name: 'AI' },
    update: {},
    create: { name: 'AI' },
  });

  const tagSecurity = await prisma.tag.upsert({
    where: { name: 'Security' },
    update: {},
    create: { name: 'Security' },
  });

  // Connect tags to posts
  await prisma.post.update({
    where: { id: post1.id },
    data: { tags: { connect: [{ id: tagAI.id }] } },
  });

  await prisma.post.update({
    where: { id: post2.id },
    data: { tags: { connect: [{ id: tagSecurity.id }] } },
  });

  // ---------------------------
  // Create Event
  // ---------------------------
  await prisma.event.create({
    data: {
      name: 'AI Workshop',
      date: new Date(),
      attendees: { connect: [{ id: alice.id }, { id: bob.id }] },
    },
  });

  // ---------------------------
  // Create Follower
  // ---------------------------
  await prisma.follower.create({
    data: {
      followerId: bob.id,
      followingId: alice.id,
    },
  });

  // ---------------------------
  // Create Mentorship
  // ---------------------------
  await prisma.mentorship.create({
    data: {
      mentorId: alice.id,
      menteeId: charlie.id,
    },
  });

  // ---------------------------
  // Create Collaboration
  // ---------------------------
  await prisma.collaboration.create({
    data: {
      project: 'Tech Community Website',
      users: { connect: [{ id: alice.id }, { id: bob.id }] },
    },
  });

  // ---------------------------
  // Create Report
  // ---------------------------
  await prisma.report.create({
    data: {
      reason: 'Inappropriate content',
      postId: post2.id,
      userId: charlie.id,
    },
  });
}

main()
  .then(() => console.log('✅ Dummy data inserted successfully!'))
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
