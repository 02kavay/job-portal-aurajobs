export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://job-portal-backend-aurajobs.onrender.com' 
    : 'http://localhost:5000');
