import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const seekerCount = await prisma.user.count({ where: { role: 'SEEKER' } });
    const recruiterCount = await prisma.user.count({ where: { role: 'RECRUITER' } });
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    const totalJobs = await prisma.job.count();
    const totalApplications = await prisma.application.count();

    res.json({
      totalUsers,
      seekerCount,
      recruiterCount,
      adminCount,
      totalJobs,
      totalApplications
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error fetching statistics.' });
  }
});

// List all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error listing users for admin:', error);
    res.status(500).json({ error: 'Internal server error listing users.' });
  }
});

// Delete a user (Cascade deletes their profile, jobs, applications)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: `User ${user.email} and all associated data deleted successfully.` });
  } catch (error) {
    console.error('Error deleting user as admin:', error);
    res.status(500).json({ error: 'Internal server error deleting user.' });
  }
});

// List all jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        recruiter: {
          select: { email: true }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) {
    console.error('Error listing jobs for admin:', error);
    res.status(500).json({ error: 'Internal server error listing jobs.' });
  }
});

// Delete a job
router.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found.' });
    }

    await prisma.job.delete({ where: { id } });
    res.json({ message: `Job listing "${job.title}" deleted successfully.` });
  } catch (error) {
    console.error('Error deleting job as admin:', error);
    res.status(500).json({ error: 'Internal server error deleting job.' });
  }
});

export default router;
