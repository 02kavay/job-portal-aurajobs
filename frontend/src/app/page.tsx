'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiMapPin, FiBriefcase, FiDollarSign, FiClock, FiFileText, FiChevronRight, FiZap, FiCheckCircle } from 'react-icons/fi';

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
  recruiter: {
    email: string;
  };
}

export default function Home() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('All');
  const [experience, setExperience] = useState('');

  // Application Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  // User state
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchJobs();
  }, []);

  const fetchJobs = async (searchVal = '', locVal = '', typeVal = 'All') => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/jobs';
      const params = new URLSearchParams();
      if (searchVal) params.append('search', searchVal);
      if (locVal) params.append('location', locVal);
      if (typeVal && typeVal !== 'All') params.append('jobType', typeVal);
      if (experience) params.append('experience', experience);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setJobs(data);
        if (data.length > 0) {
          setSelectedJob(data[0]);
        } else {
          setSelectedJob(null);
        }
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(search, location, jobType);
  };

  const handleApplyClick = () => {
    if (!localStorage.getItem('token')) {
      router.push('/login?redirect=apply');
      return;
    }
    if (user?.role === 'RECRUITER') {
      alert('Recruiters cannot apply for jobs.');
      return;
    }
    setIsApplyModalOpen(true);
    setAppliedSuccess(false);
    setApplyError('');
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setApplying(true);
    setApplyError('');
    try {
      const res = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          coverLetter
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAppliedSuccess(true);
        setCoverLetter('');
        // Sync seeker dashboard updates if needed
      } else {
        setApplyError(data.error || 'Failed to submit application.');
      }
    } catch (err) {
      setApplyError('Network error. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Header */}
      <section style={{ 
        textAlign: 'center', 
        padding: '100px 20px 60px 20px', 
        position: 'relative', 
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          zIndex: -1
        }} />
        
        <div className="animate-float" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'rgba(99, 102, 241, 0.1)', 
          border: '1px solid rgba(99, 102, 241, 0.25)', 
          padding: '8px 16px', 
          borderRadius: '30px', 
          marginBottom: '24px',
          fontSize: '0.9rem',
          color: '#a5b4fc',
          fontFamily: 'var(--font-heading)',
          fontWeight: 500
        }}>
          <FiZap /> Real-time AI Resume Matching enabled
        </div>

        <h1 style={{ 
          fontSize: '3.6rem', 
          lineHeight: '1.1',
          marginBottom: '20px',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 40%, #818cf8 80%, #22d3ee 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-heading)'
        }}>
          Unlock Your Aura.<br />Land Your Dream Job.
        </h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px auto' }}>
          Discover thousands of job postings curated and ranked instantly by our advanced content-based AI engine.
        </p>

        {/* Search Bar Container */}
        <form onSubmit={handleSearchSubmit} className="glass-panel" style={{ 
          maxWidth: '850px', 
          margin: '0 auto', 
          padding: '16px', 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '12px',
          borderRadius: '20px',
          background: 'rgba(18, 24, 54, 0.8)'
        }}>
          <div style={{ flex: '2', minWidth: '220px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
            <input 
              type="text" 
              placeholder="Job title, keywords, or skills..." 
              className="form-input" 
              style={{ paddingLeft: '44px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ flex: '1', minWidth: '160px', position: 'relative' }}>
            <FiMapPin style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
            <input 
              type="text" 
              placeholder="City or 'Remote'..." 
              className="form-input" 
              style={{ paddingLeft: '44px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div style={{ minWidth: '140px' }}>
            <select 
              className="form-select" 
              style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              value={jobType}
              onChange={(e) => {
                setJobType(e.target.value);
                fetchJobs(search, location, e.target.value);
              }}
            >
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Remote">Remote</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 28px', height: '48px' }}>
            Search Jobs
          </button>
        </form>
      </section>

      {/* Main Jobs Section */}
      <section className="container" style={{ padding: '20px 20px 80px 20px' }}>
        <div style={{ display: 'flex', gap: '30px', flexDirection: 'row', flexWrap: 'wrap' }}>
          
          {/* Left Column: Job Cards List */}
          <div style={{ flex: '1.2', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.3rem' }}>
                {loading ? 'Searching opportunities...' : `${jobs.length} Positions Available`}
              </h3>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div className="spinner" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No jobs found matching your filters. Try search keywords like "React" or "Python".
              </div>
            ) : (
              jobs.map(job => (
                <div 
                  key={job.id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '24px', 
                    cursor: 'pointer',
                    borderColor: selectedJob?.id === job.id ? 'var(--primary)' : 'var(--border-glow)',
                    background: selectedJob?.id === job.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)'
                  }}
                  onClick={() => setSelectedJob(job)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>{job.title}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>Posted by {job.recruiter.email.split('@')[0]}</p>
                    </div>
                    <span className={`badge ${job.jobType === 'Remote' ? 'badge-cyan' : 'badge-blue'}`}>
                      {job.jobType}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiMapPin /> {job.location}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiDollarSign /> {job.salaryRange}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiClock /> {job.experienceRequired === 0 ? 'Entry Level' : `${job.experienceRequired}+ yrs`}
                    </span>
                  </div>

                  {/* Skills required */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {job.requirements.split(',').map((req, idx) => (
                      <span key={idx} className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                        {req.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Detailed Job Panel */}
          <div style={{ flex: '1.8', minWidth: '350px' }}>
            {selectedJob ? (
              <div className="glass-panel" style={{ padding: '32px', position: 'sticky', top: '100px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glow)', paddingBottom: '20px', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{selectedJob.title}</h2>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FiBriefcase /> AuraJobs Recruiter
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FiMapPin /> {selectedJob.location}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FiDollarSign /> {selectedJob.salaryRange}
                      </span>
                    </div>
                  </div>
                  <button onClick={handleApplyClick} className="btn btn-primary">
                    Apply Now <FiChevronRight />
                  </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--text-main)' }}>Job Description</h4>
                  <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>{selectedJob.description}</p>
                </div>

                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-main)' }}>Key Requirements & Skills</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedJob.requirements.split(',').map((req, idx) => (
                      <span key={idx} className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                        {req.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              !loading && (
                <div className="glass-panel" style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-dark)' }}>
                  <FiBriefcase style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }} />
                  <h3>Select a job post to view full requirements and apply</h3>
                </div>
              )
            )}
          </div>

        </div>
      </section>

      {/* Application Modal */}
      {isApplyModalOpen && selectedJob && (
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
            maxWidth: '550px',
            padding: '36px',
            background: 'var(--bg-dark)'
          }}>
            {appliedSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <FiCheckCircle style={{ fontSize: '4rem', color: 'var(--success)', marginBottom: '20px' }} />
                <h2 style={{ marginBottom: '12px' }}>Application Sent!</h2>
                <p style={{ marginBottom: '30px' }}>
                  Your application for <strong>{selectedJob.title}</strong> has been submitted. The Recruiter will see your profile along with your AI Match compatibility rating.
                </p>
                <button 
                  onClick={() => setIsApplyModalOpen(false)} 
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Back to job search
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit}>
                <h2 style={{ marginBottom: '6px', fontSize: '1.6rem' }}>Apply for Position</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Applying to <strong>{selectedJob.title}</strong>
                </p>

                {applyError && (
                  <div className="badge badge-danger" style={{ display: 'block', width: '100%', marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', textTransform: 'none' }}>
                    {applyError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Cover Letter / Intro Note</label>
                  <textarea 
                    placeholder="Briefly introduce yourself and outline why you are interested in this position..." 
                    className="form-textarea"
                    required
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                </div>

                <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <FiFileText style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '0.85rem' }}>
                      We will automatically attach your <strong>saved profile data and resume file</strong> to the Recruiter payload.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsApplyModalOpen(false)} 
                    className="btn btn-secondary"
                    disabled={applying}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={applying}
                  >
                    {applying ? 'Sending application...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
