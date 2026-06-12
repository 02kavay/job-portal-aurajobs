import { Router } from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { rankJobsForProfile } from '../services/aiService.js';

const router = Router();

// Create a job post (Recruiter only)
router.post('/', authenticateToken, authorizeRole('RECRUITER'), async (req, res) => {
  try {
    const { title, description, requirements, location, salaryRange, jobType, experienceRequired } = req.body;

    if (!title || !description || !requirements || !location || !salaryRange || !jobType) {
      return res.status(400).json({ error: 'All job fields are required.' });
    }

    const job = await prisma.job.create({
      data: {
        recruiterId: req.user.userId,
        title,
        description,
        requirements,
        location,
        salaryRange,
        jobType,
        experienceRequired: parseInt(experienceRequired, 10) || 0
      }
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error creating job.' });
  }
});

// Get AI recommendations for Seeker (Seeker only)
router.get('/recommendations', authenticateToken, authorizeRole('SEEKER'), async (req, res) => {
  try {
    // 1. Fetch seeker's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!profile || !profile.skills) {
      return res.json({ 
        recommendations: [], 
        message: 'Please complete your profile details and list your skills to unlock AI recommendations!' 
      });
    }

    // 2. Fetch all jobs
    const jobs = await prisma.job.findMany({
      include: {
        recruiter: {
          select: {
            email: true
          }
        }
      }
    });

    // 3. Score and rank jobs
    const rankedJobs = rankJobsForProfile(profile, jobs);

    res.json({ recommendations: rankedJobs });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Internal server error getting recommendations.' });
  }
});

// Get recruiter's posted jobs
router.get('/recruiter', authenticateToken, authorizeRole('RECRUITER'), async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { recruiterId: req.user.userId },
      include: {
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) {
    console.error('Error getting recruiter jobs:', error);
    res.status(500).json({ error: 'Internal server error getting recruiter jobs.' });
  }
});

// List all jobs with filters (Public/Seeker)
router.get('/', async (req, res) => {
  try {
    const { search, location, jobType, experience } = req.query;

    const whereClause = {};

    // Text search
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { requirements: { contains: search } }
      ];
    }

    // Filters
    if (location) {
      whereClause.location = { contains: location };
    }

    if (jobType && jobType !== 'All') {
      whereClause.jobType = jobType;
    }

    if (experience) {
      const expYears = parseInt(experience, 10);
      if (!isNaN(expYears)) {
        whereClause.experienceRequired = { lte: expYears };
      }
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        recruiter: {
          select: {
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error listing jobs:', error);
    res.status(500).json({ error: 'Internal server error listing jobs.' });
  }
});

// Get job details
router.get('/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        recruiter: {
          select: {
            email: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error getting job:', error);
    res.status(500).json({ error: 'Internal server error getting job details.' });
  }
});

export default router;
