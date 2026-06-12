import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { parseResumeFile } from '../services/resumeService.js';

const router = Router();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/resumes';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' && ext !== '.txt') {
      return cb(new Error('Only PDF and TXT resumes are allowed!'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!profile) {
      // If recruiter doesn't have a profile yet, return an empty/default layout
      if (req.user.role === 'RECRUITER') {
        return res.json({ fullName: req.user.email.split('@')[0], title: 'Recruiter' });
      }
      return res.status(404).json({ error: 'Profile not found.' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error fetching profile.' });
  }
});

// Update profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { fullName, title, bio, skills, experienceYears, education, resumeUrl } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: req.user.userId },
      update: {
        fullName,
        title,
        bio,
        skills,
        experienceYears: parseInt(experienceYears, 10) || 0,
        education,
        resumeUrl
      },
      create: {
        userId: req.user.userId,
        fullName,
        title,
        bio,
        skills,
        experienceYears: parseInt(experienceYears, 10) || 0,
        education,
        resumeUrl
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error updating profile.' });
  }
});

// Upload and Parse Resume
router.post('/upload-resume', authenticateToken, authorizeRole('SEEKER'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a resume file (PDF or TXT).' });
    }

    const filePath = req.file.path;
    const fileUrl = `/uploads/resumes/${req.file.filename}`;

    // Parse resume
    const parseResult = await parseResumeFile(filePath, req.file.mimetype);

    if (!parseResult.success) {
      return res.status(500).json({ 
        error: 'Failed to extract text from resume.', 
        details: parseResult.error,
        resumeUrl: fileUrl // Still return the url so they can fill manually
      });
    }

    // Save resume URL to profile
    await prisma.profile.upsert({
      where: { userId: req.user.userId },
      update: { resumeUrl: fileUrl },
      create: {
        userId: req.user.userId,
        fullName: parseResult.data.fullName || req.user.email.split('@')[0],
        resumeUrl: fileUrl
      }
    });

    res.json({
      message: 'Resume uploaded and parsed successfully.',
      resumeUrl: fileUrl,
      parsedData: parseResult.data
    });
  } catch (error) {
    console.error('Error uploading/parsing resume:', error);
    res.status(500).json({ error: error.message || 'Internal server error uploading resume.' });
  }
});

export default router;
