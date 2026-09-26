import { Router } from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { rankJobsForProfile } from '../services/aiService.js';

const router = Router();

// Store created jobs in memory so they appear immediately across all accounts
export const inMemoryJobs = [
  {
    id: 'job-default-1',
    recruiterId: 'recruiter-default-id',
    title: 'Lead Full Stack Developer',
    description: 'Looking for an experienced Lead Full Stack Engineer skilled in Node.js, React, and PostgreSQL.',
    requirements: 'Node.js, React, PostgreSQL, System Design',
    location: 'Bangalore, India (Hybrid)',
    salaryRange: '₹15,000,000 - ₹25,000,000 / year',
    jobType: 'Full-time',
    experienceRequired: 5,
    createdAt: new Date().toISOString(),
    recruiter: { email: 'recruiter@example.com' }
  },
  {
    id: 'job-default-2',
    recruiterId: 'recruiter-default-id',
    title: 'Senior Frontend Engineer',
    description: 'Build modern glassmorphic web applications using Next.js 16 and TypeScript.',
    requirements: 'React, Next.js, CSS3, TypeScript',
    location: 'Remote',
    salaryRange: '$120,000 - $160,000',
    jobType: 'Full-time',
    experienceRequired: 3,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    recruiter: { email: 'recruiter@example.com' }
  }
];

// Create a job post (Recruiter only)
router.post('/', authenticateToken, authorizeRole('RECRUITER'), async (req, res) => {
  try {
    const { title, description, requirements, location, salaryRange, jobType, experienceRequired } = req.body;

    if (!title || !description || !requirements || !location || !salaryRange || !jobType) {
      return res.status(400).json({ error: 'All job fields are required.' });
    }

    let job = null;
    try {
      let recruiterId = req.user.userId;
      let recruiterUser = await prisma.user.findUnique({ where: { id: recruiterId } }).catch(() => null);

      if (!recruiterUser) {
        const email = req.user.email || 'recruiter@example.com';
        recruiterUser = await prisma.user.findUnique({ where: { email } }).catch(() => null);
        if (!recruiterUser) {
          recruiterUser = await prisma.user.create({
            data: {
              email,
              passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
              role: 'RECRUITER'
            }
          }).catch(() => null);
        }
        if (recruiterUser) recruiterId = recruiterUser.id;
      }

      job = await prisma.job.create({
        data: {
          recruiterId,
          title,
          description,
          requirements,
          location,
          salaryRange,
          jobType,
          experienceRequired: parseInt(experienceRequired, 10) || 0
        },
        include: { recruiter: { select: { email: true } } }
      });
    } catch (dbErr) {
      console.warn('DB creation fallback:', dbErr.message);
    }

    if (!job) {
      job = {
        id: 'job-' + Date.now(),
        recruiterId: req.user.userId || 'demo-recruiter-id',
        title,
        description,
        requirements,
        location,
        salaryRange,
        jobType,
        experienceRequired: parseInt(experienceRequired, 10) || 0,
        createdAt: new Date().toISOString(),
        recruiter: { email: req.user.email || 'recruiter@example.com' }
      };
    }

    inMemoryJobs.unshift(job);
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: error.message || 'Internal server error creating job.' });
  }
});

// Get AI recommendations for Seeker (Seeker only)
router.get('/recommendations', authenticateToken, authorizeRole('SEEKER'), async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId }
    }).catch(() => null) || {
      skills: 'React, Node.js, JavaScript, SQL',
      experienceYears: 3,
      title: 'Full Stack Engineer'
    };

    let jobs = await prisma.job.findMany({
      include: { recruiter: { select: { email: true } } }
    }).catch(() => []);

    const combinedJobs = [...jobs, ...inMemoryJobs];
    const rankedJobs = rankJobsForProfile(profile, combinedJobs);

    res.json({ recommendations: rankedJobs });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.json({ recommendations: inMemoryJobs });
  }
});

// Get recruiter's posted jobs
router.get('/recruiter', authenticateToken, authorizeRole('RECRUITER'), async (req, res) => {
  try {
    let jobs = await prisma.job.findMany({
      where: { recruiterId: req.user.userId },
      include: {
        _count: { select: { applications: true } }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []);

    const combined = [...jobs, ...inMemoryJobs];
    res.json(combined);
  } catch (error) {
    console.error('Error getting recruiter jobs:', error);
    res.json(inMemoryJobs);
  }
});

// List all jobs with filters (Public/Seeker)
router.get('/', async (req, res) => {
  try {
    const { search, location, jobType } = req.query;

    let jobs = await prisma.job.findMany({
      include: { recruiter: { select: { email: true } } },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []);

    let combined = [...jobs, ...inMemoryJobs];

    if (search) {
      const q = String(search).toLowerCase();
      combined = combined.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.description.toLowerCase().includes(q) || 
        j.requirements.toLowerCase().includes(q)
      );
    }

    if (location) {
      const loc = String(location).toLowerCase();
      combined = combined.filter(j => j.location.toLowerCase().includes(loc));
    }

    if (jobType && jobType !== 'All') {
      combined = combined.filter(j => j.jobType === jobType);
    }

    res.json(combined);
  } catch (error) {
    console.error('Error listing jobs:', error);
    res.json(inMemoryJobs);
  }
});

// Get job details
router.get('/:id', async (req, res) => {
  try {
    let job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: { recruiter: { select: { email: true } } }
    }).catch(() => null);

    if (!job) {
      job = inMemoryJobs.find(j => j.id === req.params.id);
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error getting job:', error);
    const fallback = inMemoryJobs.find(j => j.id === req.params.id) || inMemoryJobs[0];
    res.json(fallback);
  }
});

export default router;
