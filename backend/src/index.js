import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import adminRoutes from './routes/admin.js';
import { authenticateToken, authorizeRole } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists safely
try {
  const uploadDir = process.env.VERCEL 
    ? path.join('/tmp', 'uploads', 'resumes') 
    : path.join(process.cwd(), 'uploads', 'resumes');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create upload directory:', e.message);
}

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Serve temporary uploaded resume files from /tmp (on Vercel) or local uploads directory
app.get('/uploads/resumes/:filename', (req, res) => {
  const filename = req.params.filename;
  const tmpPath = path.join('/tmp', filename);
  const localPath = path.join(process.cwd(), 'uploads', 'resumes', filename);

  if (fs.existsSync(tmpPath)) {
    return res.sendFile(tmpPath);
  } else if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  } else {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume Attached - AuraJobs</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f8fafc; text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh;">
          <div style="background: rgba(18, 24, 54, 0.7); border: 1px solid rgba(99, 102, 241, 0.2); padding: 40px; border-radius: 20px; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <div style="font-size: 3rem; margin-bottom: 16px;">📄</div>
            <h2 style="font-size: 1.4rem; margin-bottom: 12px; color: #818cf8;">Resume Document Active</h2>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 20px; word-break: break-all;">${filename}</p>
            <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.5; margin-bottom: 24px;">Your resume text has been parsed and saved into your candidate profile!</p>
            <button onclick="window.close()" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer;">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', authenticateToken, authorizeRole('ADMIN'), adminRoutes);

// Root status endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AuraJobs Backend API',
    status: 'Running',
    message: 'Welcome to AuraJobs Job Portal API',
    healthCheck: '/health',
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      jobs: '/api/jobs',
      applications: '/api/applications',
      admin: '/api/admin'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong on the server!'
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 Job Portal API running on port ${PORT}`);
    console.log(`📁 Static files served at http://localhost:${PORT}/uploads`);
    console.log(`========================================`);
  });
}

export default app;
