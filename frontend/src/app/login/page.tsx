'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

export default function Login() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="spinner" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Notify Navbar to update state
        window.dispatchEvent(new Event('auth-change'));

        // Redirection logic
        if (redirect === 'apply') {
          router.push('/');
        } else if (data.user.role === 'SEEKER') {
          router.push('/seeker/dashboard');
        } else {
          router.push('/recruiter/dashboard');
        }
      } else {
        setError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Connection failed. Is the API server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      padding: '40px 20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '40px',
        background: 'var(--bg-card)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to continue your career journey</p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ 
            display: 'block', 
            width: '100%', 
            padding: '12px', 
            borderRadius: '10px', 
            marginBottom: '20px', 
            textTransform: 'none',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
              <input 
                type="email" 
                placeholder="you@example.com" 
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
              <input 
                type="password" 
                placeholder="••••••••" 
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', borderRadius: '12px' }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : <><FiLogIn /> Sign In</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
