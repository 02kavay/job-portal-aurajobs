export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://aurajobs-backend.vercel.app' 
    : 'http://localhost:5000');
