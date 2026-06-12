import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AuraJobs | AI-Powered Job Search & Recruitment Portal',
  description: 'Connect recruiters and job seekers with instant AI matching. Parse resumes, build profiles, and get personalized job recommendations based on your skills.',
  keywords: 'job board, AI job portal, resume parser, recruiter dashboard, job matching, Next.js, Express',
  authors: [{ name: 'AuraJobs Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Navbar />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <footer style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          borderTop: '1px solid var(--border-glow)',
          color: 'var(--text-dark)',
          fontSize: '0.9rem',
          background: 'rgba(7, 9, 19, 0.5)'
        }}>
          &copy; {new Date().getFullYear()} AuraJobs. Designed with premium AI recommendations. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
