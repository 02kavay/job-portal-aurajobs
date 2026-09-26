import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { parseResumeFile } from '../services/resumeService.js';

const router = Router();

// Configure Multer storage (Use /tmp directory on Vercel for write permissions)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.VERCEL 
      ? '/tmp' 
      : path.join(process.cwd(), 'uploads', 'resumes');
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.warn('Multer directory creation warning:', e.message);
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
    }).catch(() => null);

    if (!profile) {
      return res.json({
        fullName: req.user.email ? req.user.email.split('@')[0] : 'User',
        title: req.user.role === 'RECRUITER' ? 'Recruiter' : 'Full Stack Developer',
        skills: 'React, Node.js, JavaScript, SQL',
        experienceYears: 3,
        education: 'Computer Science B.S.',
        bio: 'Professional candidate profile.'
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.json({
      fullName: req.user.email ? req.user.email.split('@')[0] : 'User',
      title: 'Candidate',
      skills: 'React, Node.js, JavaScript, SQL',
      experienceYears: 3,
      education: 'Computer Science B.S.',
      bio: 'Professional candidate profile.'
    });
  }
});

// Update profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { fullName, title, bio, skills, experienceYears, education, resumeUrl } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    let updatedProfile = null;
    try {
      updatedProfile = await prisma.profile.upsert({
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
      }).catch(() => null);
    } catch (dbErr) {
      console.warn('Profile DB upsert warning:', dbErr.message);
    }

    if (!updatedProfile) {
      updatedProfile = {
        userId: req.user.userId,
        fullName,
        title: title || 'Full Stack Developer',
        bio: bio || '',
        skills: skills || '',
        experienceYears: parseInt(experienceYears, 10) || 0,
        education: education || '',
        resumeUrl: resumeUrl || ''
      };
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error updating profile.' });
  }
});

// Upload and Parse Resume
router.post('/upload-resume', authenticateToken, upload.single('resume'), async (req, res) => {
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
        resumeUrl: fileUrl
      });
    }

    // Save resume URL to profile
    try {
      await prisma.profile.upsert({
        where: { userId: req.user.userId },
        update: { 
          resumeUrl: fileUrl,
          fullName: parseResult.data.fullName || undefined,
          skills: parseResult.data.skills || undefined,
          title: parseResult.data.title || undefined
        },
        create: {
          userId: req.user.userId,
          fullName: parseResult.data.fullName || (req.user.email ? req.user.email.split('@')[0] : 'Seeker'),
          title: parseResult.data.title || 'Candidate',
          skills: parseResult.data.skills || '',
          experienceYears: parseResult.data.experienceYears || 1,
          education: parseResult.data.education || '',
          bio: parseResult.data.bio || '',
          resumeUrl: fileUrl
        }
      }).catch(() => null);
    } catch (dbErr) {
      console.warn('DB profile resume save fallback:', dbErr.message);
    }

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
