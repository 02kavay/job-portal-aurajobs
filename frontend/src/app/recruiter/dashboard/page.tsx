'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPlus, FiBriefcase, FiUsers, FiMapPin, FiCalendar, FiDollarSign, FiClock, FiSettings, FiCheckCircle, FiChevronRight, FiGrid, FiList } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryRange: string;
  jobType: string;
  experienceRequired: number;
  createdAt: string;
  _count?: {
    applications: number;
  };
}

export default function RecruiterDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Job creation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [experienceRequired, setExperienceRequired] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'RECRUITER') {
      router.push('/');
      return;
    }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/recruiter`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title,
          description,
          requirements,
          location,
          salaryRange,
          jobType,
          experienceRequired
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Reset form
        setTitle('');
        setDescription('');
        setRequirements('');
        setLocation('');
        setSalaryRange('');
        setJobType('Full-time');
        setExperienceRequired(0);
        
        fetchJobs(); // reload
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create job posting.');
      }
    } catch (err) {
      setError('Connection failure.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const totalJobs = jobs.length;
  const totalApplicants = jobs.reduce((acc, job) => acc + (job._count?.applications || 0), 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '80vh' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 className="page-title">Recruiter Portal</h1>
          <p className="page-subtitle">Track job listings, monitor applicant counts, and review compatibility ratings.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <FiPlus /> Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '16px', borderRadius: '12px', color: 'var(--primary)' }}>
            <FiBriefcase style={{ fontSize: '1.8rem' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>Active Job Listings</p>
            <h2 style={{ fontSize: '2rem' }}>{totalJobs}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '16px', borderRadius: '12px', color: 'var(--accent)' }}>
            <FiUsers style={{ fontSize: '1.8rem' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>Total Candidates</p>
            <h2 style={{ fontSize: '2rem' }}>{totalApplicants}</h2>
          </div>
        </div>
      </div>

      {/* Jobs Table/List */}
      <h3 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Posted Jobs & Applications</h3>

      {jobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <FiBriefcase style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '8px' }}>No active listings</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Get started by creating your first job posting.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            Post Job
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {jobs.map(job => (
            <div 
              key={job.id} 
              className="glass-panel" 
              style={{ 
                padding: '24px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: '20px' 
              }}
            >
              <div style={{ flex: '2', minWidth: '280px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{job.title}</h3>
                
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FiMapPin /> {job.location}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FiCalendar /> {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                    {job.jobType}
                  </span>
                </div>
              </div>

              {/* Applicant Count */}
              <div style={{ flex: '1', minWidth: '150px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>Candidates</p>
                    <span className="badge badge-blue" style={{ fontSize: '1rem', padding: '6px 14px', borderRadius: '8px' }}>
                      {job._count?.applications || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div style={{ flex: '1', minWidth: '120px', display: 'flex', justifyContent: 'flex-end' }}>
                <Link href={`/recruiter/jobs/${job.id}`} className="btn btn-secondary" style={{ display: 'flex', gap: '6px', fontSize: '0.85rem', padding: '10px 18px' }}>
                  Review Applicants <FiChevronRight />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Post Job Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '650px',
            padding: '36px',
            background: 'var(--bg-dark)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <form onSubmit={handlePostJob}>
              <h2 style={{ marginBottom: '18px', fontSize: '1.6rem' }}>Post New Job listing</h2>

              {error && (
                <div className="badge badge-danger" style={{ display: 'block', width: '100%', marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', textTransform: 'none' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 2, minWidth: '220px' }}>
                  <label className="form-label">Job Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Lead Full Stack Developer" 
                    className="form-input" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                  <label className="form-label">Job Type</label>
                  <select 
                    className="form-select"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                  <label className="form-label">Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. San Francisco, CA / Remote" 
                    className="form-input" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                  <label className="form-label">Salary Range</label>
                  <input 
                    type="text" 
                    placeholder="e.g. $100,000 - $130,000" 
                    className="form-input" 
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                  <label className="form-label">Experience Required (Years)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min={0}
                    value={experienceRequired}
                    onChange={(e) => setExperienceRequired(parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div className="form-group" style={{ flex: 2, minWidth: '220px' }}>
                  <label className="form-label">Required Skills (Comma-separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Node.js, Express, Postgres, Git" 
                    className="form-input" 
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Job Description</label>
                <textarea 
                  placeholder="Outline responsibilities, team overview, benefits, and specifications..." 
                  className="form-textarea"
                  style={{ minHeight: '140px' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Creating posting...' : 'Publish Job Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
