'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiUserCheck, FiUsers, FiUser } from 'react-icons/fi';

export default function Register() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'SEEKER' | 'RECRUITER'>('SEEKER');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Notify Navbar
        window.dispatchEvent(new Event('auth-change'));

        // Redirect based on role
        if (data.user.role === 'SEEKER') {
          router.push('/seeker/dashboard');
        } else {
          router.push('/recruiter/dashboard');
        }
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '85vh',
      padding: '40px 20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '500px',
        padding: '40px',
        background: 'var(--bg-card)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)' }}>Get started with AuraJobs today</p>
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
          
          {/* Role Toggle Selector */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div 
              onClick={() => setRole('SEEKER')}
              style={{
                flex: 1,
                padding: '16px',
                textAlign: 'center',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: role === 'SEEKER' ? 'var(--primary)' : 'var(--border-glow)',
                background: role === 'SEEKER' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <FiUser style={{ fontSize: '1.5rem', marginBottom: '8px', color: role === 'SEEKER' ? 'var(--primary)' : 'var(--text-dark)' }} />
              <h4 style={{ fontSize: '0.95rem' }}>Job Seeker</h4>
            </div>

            <div 
              onClick={() => setRole('RECRUITER')}
              style={{
                flex: 1,
                padding: '16px',
                textAlign: 'center',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: role === 'RECRUITER' ? 'var(--primary)' : 'var(--border-glow)',
                background: role === 'RECRUITER' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <FiUsers style={{ fontSize: '1.5rem', marginBottom: '8px', color: role === 'RECRUITER' ? 'var(--primary)' : 'var(--text-dark)' }} />
              <h4 style={{ fontSize: '0.95rem' }}>Recruiter</h4>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
              <input 
                type="email" 
                placeholder="name@company.com" 
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
              <input 
                type="password" 
                placeholder="Choose a password" 
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
              <input 
                type="password" 
                placeholder="Re-enter password" 
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : <><FiUserCheck /> Register Account</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
