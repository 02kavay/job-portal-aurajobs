import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing records
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Recruiter
  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@example.com',
      passwordHash,
      role: 'RECRUITER'
    }
  });
  console.log('✅ Created Recruiter: recruiter@example.com');

  // 1b. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin1@example.com',
      passwordHash,
      role: 'ADMIN'
    }
  });
  console.log('✅ Created Admin: admin1@example.com');

  // 2. Create Seeker & Seeker Profile
  const seeker = await prisma.user.create({
    data: {
      email: 'seeker@example.com',
      passwordHash,
      role: 'SEEKER',
      profile: {
        create: {
          fullName: 'Alex Mercer',
          title: 'Full Stack Web Developer',
          bio: 'Passionate developer with 3 years of experience specializing in building responsive web applications using React, Node.js, and SQL. Quick learner and team player.',
          skills: 'React, Node.js, JavaScript, HTML, CSS, Git, PostgreSQL, SQL, REST API',
          experienceYears: 3,
          education: 'Bachelor of Science in Computer Science, State University',
          resumeUrl: ''
        }
      }
    }
  });
  console.log('✅ Created Seeker: seeker@example.com with profile');

  // 3. Create Sample Jobs
  const jobs = [
    {
      title: 'Senior Frontend Engineer (React)',
      description: 'We are looking for a Senior Frontend Engineer to join our core team. You will lead the development of our dashboard, optimize application performance, and design custom CSS layouts.',
      requirements: 'React, TypeScript, CSS, SASS, Git, HTML',
      location: 'Bangalore, India',
      salaryRange: '₹15,00,000 - ₹24,00,000',
      jobType: 'Full-time',
      experienceRequired: 5
    },
    {
      title: 'Backend Engineer (Node.js & Postgres)',
      description: 'Join our backend infrastructure team. You will build and scale REST APIs, design database schemas, optimize queries, and implement authentication and file upload services.',
      requirements: 'Node.js, Express, PostgreSQL, SQL, REST API, Git',
      location: 'Hyderabad, India',
      salaryRange: '₹12,00,000 - ₹18,00,000',
      jobType: 'Remote',
      experienceRequired: 3
    },
    {
      title: 'AI Product Specialist',
      description: 'We are seeking an engineer to build AI-driven features. You will design recommendation pipelines, interface with LLM APIs, and implement machine learning features in python.',
      requirements: 'Python, AI, Machine Learning, REST API',
      location: 'Pune, India',
      salaryRange: '₹18,00,000 - ₹28,00,000',
      jobType: 'Full-time',
      experienceRequired: 4
    },
    {
      title: 'Junior Web Developer',
      description: 'Great entry-level opportunity for a passionate web developer! You will work closely with senior engineers to implement UI features and fix bugs. Great learning environment.',
      requirements: 'HTML, CSS, JavaScript, Git',
      location: 'Remote (India)',
      salaryRange: '₹4,50,000 - ₹7,00,000',
      jobType: 'Full-time',
      experienceRequired: 1
    }
  ];

  for (const jobData of jobs) {
    const job = await prisma.job.create({
      data: {
        ...jobData,
        recruiterId: recruiter.id
      }
    });
    console.log(`✅ Created Job: "${job.title}"`);
  }

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
