import { Router } from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { computeMatchScore } from '../services/aiService.js';

const router = Router();

// Apply for a job (Seeker only)
router.post('/', authenticateToken, authorizeRole('SEEKER'), async (req, res) => {
  try {
    const { jobId, coverLetter, resumeUrl } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required.' });
    }

    // Check if already applied
    const existingApp = await prisma.application.findFirst({
      where: {
        jobId,
        seekerId: req.user.userId
      }
    });

    if (existingApp) {
      return res.status(400).json({ error: 'You have already applied for this job.' });
    }

    // Fetch Job and Seeker Profile
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!profile) {
      return res.status(400).json({ error: 'Please create your profile before applying.' });
    }

    // Compute AI Match Score
    const matchResult = computeMatchScore(profile, job);

    // Use provided resume URL or fall back to profile resume
    const appResumeUrl = resumeUrl || profile.resumeUrl;

    const application = await prisma.application.create({
      data: {
        jobId,
        seekerId: req.user.userId,
        status: 'APPLIED',
        coverLetter: coverLetter || '',
        resumeUrl: appResumeUrl || '',
        aiMatchScore: matchResult.score,
        aiMatchExplanation: matchResult.explanation
      }
    });

    res.status(201).json({
      message: 'Application submitted successfully.',
      application
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ error: 'Internal server error submitting application.' });
  }
});

// Get seeker's applications (Seeker only)
router.get('/seeker', authenticateToken, authorizeRole('SEEKER'), async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { seekerId: req.user.userId },
      include: {
        job: {
          include: {
            recruiter: {
              select: { email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(applications);
  } catch (error) {
    console.error('Error getting seeker applications:', error);
    res.status(500).json({ error: 'Internal server error getting applications.' });
  }
});

// Get applications for a specific job (Recruiter only, ordered by AI match score)
router.get('/job/:jobId', authenticateToken, authorizeRole('RECRUITER'), async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify recruiter owns this job
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    if (job.recruiterId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized. You do not own this job posting.' });
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        seeker: {
          select: {
            email: true,
            profile: true
          }
        }
      },
      orderBy: {
        aiMatchScore: 'desc' // Rank applicants by match score automatically
      }
    });

    res.json(applications);
  } catch (error) {
    console.error('Error getting job applicants:', error);
    res.status(500).json({ error: 'Internal server error fetching applicants.' });
  }
});

// Update application status (Recruiter only)
router.put('/:id/status', authenticateToken, authorizeRole('RECRUITER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    // Verify recruiter owns this job
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    if (application.job.recruiterId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized. You do not own this job listing.' });
    }

    const updatedApp = await prisma.application.update({
      where: { id },
      data: { status }
    });

    res.json(updatedApp);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal server error updating application status.' });
  }
});

export default router;
