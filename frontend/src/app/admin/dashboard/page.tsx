'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiBriefcase, FiUsers, FiTrash2, FiActivity, FiLayers, FiList, FiAlertTriangle, FiSliders } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  profile?: {
    fullName: string;
    title: string;
  } | null;
}

interface Job {
  id: string;
  title: string;
  location: string;
  createdAt: string;
  recruiter: {
    email: string;
  };
  _count?: {
    applications: number;
  };
}

interface Stats {
  totalUsers: number;
  seekerCount: number;
  recruiterCount: number;
  adminCount: number;
  totalJobs: number;
  totalApplications: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs'>('overview');
  
  // Data States
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    try {
      const userObj = JSON.parse(userStr);
      if (userObj.role !== 'ADMIN') {
        router.push('/');
        return;
      }
    } catch (e) {
      router.push('/login');
      return;
    }

    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      if (activeTab === 'overview') {
        const res = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setErrorMsg('Failed to load system stats.');
        }
      } else if (activeTab === 'users') {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, { headers });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          setErrorMsg('Failed to load user directories.');
        }
      } else if (activeTab === 'jobs') {
        const res = await fetch(`${API_BASE_URL}/api/admin/jobs`, { headers });
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        } else {
          setErrorMsg('Failed to load job listings.');
        }
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
      setErrorMsg('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete the user ${email}? This action will delete their profile, posted jobs, and job applications. This cannot be undone.`)) {
      return;
    }

    setActionLoadingId(userId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'User deleted successfully.');
        // Refresh list
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        setErrorMsg(data.error || 'Failed to delete user.');
      }
    } catch (e) {
      setErrorMsg('Network error.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove the job post "${title}"?`)) {
      return;
    }

    setActionLoadingId(jobId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Job listing deleted.');
        // Refresh list
        setJobs(prev => prev.filter(j => j.id !== jobId));
      } else {
        setErrorMsg(data.error || 'Failed to delete job listing.');
      }
    } catch (e) {
      setErrorMsg('Network error.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="container" style={{ minHeight: '80vh' }}>
      
      {/* Top Banner */}
      <div style={{ marginBottom: '36px' }}>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Moderate platform users, remove spam jobs, and monitor registration telemetry.</p>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-glow)', paddingBottom: '12px', marginBottom: '32px' }}>
        <button 
          onClick={() => setActiveTab('overview')} 
          className="btn" 
          style={{ 
            background: activeTab === 'overview' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'overview' ? 'var(--text-main)' : 'var(--text-muted)'
          }}
        >
          <FiActivity style={{ color: 'var(--accent)' }} /> Overview
        </button>
        
        <button 
          onClick={() => setActiveTab('users')} 
          className="btn" 
          style={{ 
            background: activeTab === 'users' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'users' ? 'var(--text-main)' : 'var(--text-muted)'
          }}
        >
          <FiUsers style={{ color: 'var(--primary)' }} /> Manage Users
        </button>

        <button 
          onClick={() => setActiveTab('jobs')} 
          className="btn" 
          style={{ 
            background: activeTab === 'jobs' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'jobs' ? 'var(--text-main)' : 'var(--text-muted)'
          }}
        >
          <FiBriefcase style={{ color: 'var(--secondary)' }} /> Manage Jobs
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', marginBottom: '24px', textTransform: 'none', fontSize: '0.9rem' }}>
          <FiAlertTriangle /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="badge badge-success" style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', marginBottom: '24px', textTransform: 'none', fontSize: '0.9rem' }}>
          {successMsg}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : activeTab === 'overview' ? (
        
        /* OVERVIEW TAB */
        stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Stats Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '14px', borderRadius: '12px', color: 'var(--primary)' }}>
                  <FiUsers style={{ fontSize: '1.5rem' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>Total Accounts</p>
                  <h2 style={{ fontSize: '1.8rem' }}>{stats.totalUsers}</h2>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '14px', borderRadius: '12px', color: 'var(--accent)' }}>
                  <FiBriefcase style={{ fontSize: '1.5rem' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>Job Postings</p>
                  <h2 style={{ fontSize: '1.8rem' }}>{stats.totalJobs}</h2>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '14px', borderRadius: '12px', color: 'var(--secondary)' }}>
                  <FiLayers style={{ fontSize: '1.5rem' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>Job Applications</p>
                  <h2 style={{ fontSize: '1.8rem' }}>{stats.totalApplications}</h2>
                </div>
              </div>

            </div>

            {/* Sub telemetry details */}
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>User Role Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span>Seekers</span>
                    <span style={{ fontWeight: 600 }}>{stats.seekerCount}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(stats.seekerCount / (stats.totalUsers || 1)) * 100}%`, height: '100%', background: 'var(--primary)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span>Recruiters</span>
                    <span style={{ fontWeight: 600 }}>{stats.recruiterCount}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(stats.recruiterCount / (stats.totalUsers || 1)) * 100}%`, height: '100%', background: 'var(--accent)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span>Administrators</span>
                    <span style={{ fontWeight: 600 }}>{stats.adminCount}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(stats.adminCount / (stats.totalUsers || 1)) * 100}%`, height: '100%', background: 'var(--secondary)' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )
      ) : activeTab === 'users' ? (
        
        /* USERS LIST TAB */
        users.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No users registered.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {users.map(u => (
              <div 
                key={u.id} 
                className="glass-panel" 
                style={{ 
                  padding: '20px 24px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '20px' 
                }}
              >
                <div style={{ flex: 2, minWidth: '220px' }}>
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>
                    {u.profile?.fullName || u.email.split('@')[0]}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {u.email} &bull; Joined {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ flex: 1, minWidth: '120px' }}>
                  <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'RECRUITER' ? 'badge-purple' : 'badge-blue'}`}>
                    {u.role}
                  </span>
                </div>

                <div>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.email)}
                    className="btn btn-secondary"
                    style={{ 
                      color: 'var(--danger)', 
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                      padding: '8px 12px',
                      borderRadius: '8px'
                    }}
                    disabled={actionLoadingId === u.id || u.role === 'ADMIN'}
                  >
                    <FiTrash2 /> {actionLoadingId === u.id ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        
        /* JOBS LIST TAB */
        jobs.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No active job postings.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {jobs.map(j => (
              <div 
                key={j.id} 
                className="glass-panel" 
                style={{ 
                  padding: '20px 24px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '20px' 
                }}
              >
                <div style={{ flex: 2, minWidth: '220px' }}>
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>{j.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Recruiter: {j.recruiter.email} &bull; {j.location} &bull; Posted {new Date(j.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ flex: 1, minWidth: '100px' }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.8rem' }}>
                    {j._count?.applications || 0} applicants
                  </span>
                </div>

                <div>
                  <button
                    onClick={() => handleDeleteJob(j.id, j.title)}
                    className="btn btn-secondary"
                    style={{ 
                      color: 'var(--danger)', 
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                      padding: '8px 12px',
                      borderRadius: '8px'
                    }}
                    disabled={actionLoadingId === j.id}
                  >
                    <FiTrash2 /> {actionLoadingId === j.id ? 'Removing...' : 'Remove Post'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
}
