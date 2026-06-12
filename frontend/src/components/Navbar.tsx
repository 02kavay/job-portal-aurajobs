'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FiBriefcase, FiUser, FiLogOut, FiLayout, FiSearch, FiSliders } from 'react-icons/fi';

export default function Navbar() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Read user from localStorage on client side mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    // Custom event listener for storage/login changes
    const handleAuthChange = () => {
      const u = localStorage.getItem('user');
      setUser(u ? JSON.parse(u) : null);
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Dispatch event to sync other components
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  return (
    <nav className="navbar">
      <Link href="/" className="nav-brand">
        <FiBriefcase style={{ color: 'var(--accent)' }} />
        <span>AuraJobs</span>
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            {user.role === 'SEEKER' ? (
              <>
                <Link 
                  href="/seeker/dashboard" 
                  className={`nav-link ${pathname === '/seeker/dashboard' ? 'active' : ''}`}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FiLayout /> Dashboard
                  </span>
                </Link>
                <Link 
                  href="/seeker/profile" 
                  className={`nav-link ${pathname === '/seeker/profile' ? 'active' : ''}`}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FiUser /> Profile Builder
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/recruiter/dashboard" 
                  className={`nav-link ${pathname === '/recruiter/dashboard' ? 'active' : ''}`}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FiSliders /> Recruiter Portal
                  </span>
                </Link>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '12px' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                {user.role}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {user.email.split('@')[0]}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary" 
                style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <FiLogOut /> Log Out
              </button>
            </div>
          </>
        ) : (
          <>
            <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
              Find Jobs
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '10px 20px', borderRadius: '10px' }}>
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '10px' }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
