import { PrismaClient } from '@prisma/client';
import path from 'path';

// Fallback to /tmp/dev.db if DATABASE_URL is not explicitly set in cloud environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.VERCEL 
    ? 'file:/tmp/dev.db' 
    : `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
}

const prisma = new PrismaClient();

export default prisma;
