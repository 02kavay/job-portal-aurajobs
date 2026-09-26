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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
