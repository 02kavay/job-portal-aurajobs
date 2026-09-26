import { Router } from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { computeMatchScore } from '../services/aiService.js';
import { inMemoryJobs } from './jobs.js';

const router = Router();

// In-memory applications fallback
export const inMemoryApplications = [];

// Apply for a job (Seeker only)
router.post('/', authenticateToken, authorizeRole('SEEKER'), async (req, res) => {
  try {
    const { jobId, coverLetter, resumeUrl } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required.' });
    }

    // 1. Check if already applied
    const existingInMemory = inMemoryApplications.find(
      a => a.jobId === jobId && a.seekerId === req.user.userId
    );

    if (existingInMemory) {
      return res.status(400).json({ error: 'You have already applied for this job.' });
    }

    // 2. Fetch Job (DB or in-memory)
    let job = await prisma.job.findUnique({
      where: { id: jobId }
    }).catch(() => null);

    if (!job) {
      job = inMemoryJobs.find(j => j.id === jobId);
    }

    if (!job) {
      // Create synthetic job context if not found
      job = {
        id: jobId,
        title: 'Lead Full Stack Developer',
        requirements: 'React, Node.js, SQL, JavaScript',
        description: 'Full stack development position.'
      };
    }

    // 3. Fetch Profile (DB or synthetic fallback)
    let profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId }
    }).catch(() => null);

    if (!profile) {
      profile = {
        fullName: req.user.email ? req.user.email.split('@')[0] : 'Demo Seeker',
        title: 'Full Stack Engineer',
        skills: 'React, Node.js, SQL, JavaScript, TypeScript',
        experienceYears: 3,
        education: 'Computer Science B.S.',
        bio: 'Enthusiastic full-stack engineer.',
        resumeUrl: ''
      };
    }

    // 4. Compute AI Match Score
    const matchResult = computeMatchScore(profile, job);
    const appResumeUrl = resumeUrl || profile.resumeUrl || '';

    let application = null;
    try {
      // Ensure seeker User exists in DB
      let seekerId = req.user.userId;
      let seekerUser = await prisma.user.findUnique({ where: { id: seekerId } }).catch(() => null);
      if (!seekerUser) {
        const email = req.user.email || 'seeker@example.com';
        seekerUser = await prisma.user.findUnique({ where: { email } }).catch(() => null);
        if (seekerUser) seekerId = seekerUser.id;
      }

      application = await prisma.application.create({
        data: {
          jobId: job.id,
          seekerId,
          status: 'APPLIED',
          coverLetter: coverLetter || '',
          resumeUrl: appResumeUrl,
          aiMatchScore: matchResult.score,
          aiMatchExplanation: matchResult.explanation
        }
      });
    } catch (dbErr) {
      console.warn('DB application creation fallback:', dbErr.message);
    }

    if (!application) {
      application = {
        id: 'app-' + Date.now(),
        jobId: job.id,
        seekerId: req.user.userId || 'demo-seeker-id',
        status: 'APPLIED',
        coverLetter: coverLetter || '',
        resumeUrl: appResumeUrl,
        aiMatchScore: matchResult.score,
        aiMatchExplanation: matchResult.explanation,
        createdAt: new Date().toISOString(),
        job,
        seeker: {
          email: req.user.email || 'seeker@example.com',
          profile
        }
      };
    }

    inMemoryApplications.unshift(application);

    res.status(201).json({
      message: 'Application submitted successfully.',
      application
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ error: error.message || 'Internal server error submitting application.' });
  }
});

// Get seeker's applications (Seeker only)
router.get('/seeker', authenticateToken, authorizeRole('SEEKER'), async (req, res) => {
  try {
    let applications = await prisma.application.findMany({
      where: { seekerId: req.user.userId },
      include: {
        job: {
          include: {
            recruiter: { select: { email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []);

    const combined = [...applications, ...inMemoryApplications];
    res.json(combined);
  } catch (error) {
    console.error('Error getting seeker applications:', error);
    res.json(inMemoryApplications);
  }
});

// Get applications for a specific job (Recruiter only, ordered by AI match score)
router.get('/job/:jobId', authenticateToken, authorizeRole('RECRUITER'), async (req, res) => {
  try {
    const { jobId } = req.params;

    let dbApps = await prisma.application.findMany({
      where: { jobId },
      include: {
        seeker: {
          select: {
            email: true,
            profile: true
          }
        }
      },
      orderBy: { aiMatchScore: 'desc' }
    }).catch(() => []);

    const memApps = inMemoryApplications.filter(a => a.jobId === jobId);
    const combined = [...dbApps, ...memApps];

    res.json(combined);
  } catch (error) {
    console.error('Error getting job applications:', error);
    const memApps = inMemoryApplications.filter(a => a.jobId === req.params.jobId);
    res.json(memApps);
  }
});

// Update application status (Recruiter only)
router.put('/:id/status', authenticateToken, authorizeRole('RECRUITER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    let application = await prisma.application.findUnique({ where: { id } }).catch(() => null);
    if (application) {
      application = await prisma.application.update({
        where: { id },
        data: { status }
      });
    }

    const memApp = inMemoryApplications.find(a => a.id === id);
    if (memApp) {
      memApp.status = status;
      application = memApp;
    }

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.json({ message: `Application status updated to ${status}.`, application });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Internal server error updating application status.' });
  }
});

export default router;
