'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiMapPin, FiCalendar, FiDollarSign, FiClock, FiFileText, FiZap, FiCheckCircle, FiXCircle, FiPhone, FiMail, FiExternalLink, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

interface Profile {
  fullName: string;
  title: string;
  bio: string;
  skills: string;
  experienceYears: number;
  education: string;
  resumeUrl: string;
}

interface Seeker {
  email: string;
  profile: Profile;
}

interface Application {
  id: string;
  status: string;
  coverLetter: string;
  resumeUrl: string;
  aiMatchScore: number;
  aiMatchExplanation: string;
  createdAt: string;
  seeker: Seeker;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryRange: string;
  jobType: string;
  experienceRequired: number;
}

export default function JobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  // Data States
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded card tracking
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchJobAndApplicants();
  }, [id]);

  const fetchJobAndApplicants = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      // Fetch job details
      const jobRes = await fetch(`${API_BASE_URL}/api/jobs/${id}`, { headers });
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJob(jobData);
      }

      // Fetch applicants
      const appRes = await fetch(`${API_BASE_URL}/api/applications/job/${id}`, { headers });
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplicants(appData);
        // Automatically expand the highest ranking applicant if there are any
        if (appData.length > 0) {
          setExpandedAppId(appData[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    setUpdatingStatusId(appId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Update local state
        setApplicants(prev => prev.map(app => 
          app.id === appId ? { ...app, status: newStatus } : app
        ));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'badge-success';
    if (score >= 50) return 'badge-warning';
    return 'badge-danger';
  };

  const toggleExpand = (appId: string) => {
    setExpandedAppId(prev => prev === appId ? null : appId);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2>Job posting not found</h2>
        <Link href="/recruiter/dashboard" className="btn btn-secondary" style={{ marginTop: '20px' }}>
          Back to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      
      {/* Navigation & Header */}
      <Link href="/recruiter/dashboard" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <FiArrowLeft /> Back to Recruiter Dashboard
      </Link>

      <div className="glass-panel" style={{ padding: '32px', marginBottom: '40px', background: 'rgba(18, 24, 54, 0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{job.title}</h1>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
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
          </div>
          
          <div className="badge badge-purple" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
            {applicants.length} Total Applicants
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.4rem', marginBottom: '24px' }}>Applicants Ranked by AI Match Score</h2>

      {applicants.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No candidates have applied for this position yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {applicants.map((app, index) => {
            const isExpanded = expandedAppId === app.id;
            const profile = app.seeker.profile || { fullName: 'Applicant', title: 'Job Seeker', bio: '', skills: '', experienceYears: 0, education: '' };
            
            return (
              <div 
                key={app.id} 
                className="glass-panel" 
                style={{ 
                  padding: '24px', 
                  borderColor: isExpanded ? 'var(--primary)' : 'var(--border-glow)',
                  background: isExpanded ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-card)'
                }}
              >
                
                {/* Applicant Summary Row */}
                <div 
                  onClick={() => toggleExpand(app.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span 
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.05)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        border: '1px solid var(--border-glow)'
                      }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{profile.fullName}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{profile.title} &bull; {profile.experienceYears} yrs experience</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Score Badge */}
                    <span className={`badge ${getScoreColor(app.aiMatchScore)}`} style={{ display: 'inline-flex', gap: '6px', fontSize: '0.85rem', padding: '6px 12px' }}>
                      <FiZap /> {app.aiMatchScore}% Match
                    </span>

                    {/* Status Display */}
                    <select
                      className="form-select"
                      style={{ width: '150px', padding: '8px 12px', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)' }}
                      value={app.status}
                      disabled={updatingStatusId === app.id}
                      onClick={(e) => e.stopPropagation()} // Prevent card expand
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    >
                      <option value="APPLIED">Applied</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="INTERVIEW">Interview</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    <div>
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div style={{ 
                    marginTop: '24px', 
                    paddingTop: '24px', 
                    borderTop: '1px solid var(--border-glow)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '24px' 
                  }}>
                    
                    {/* Contact Info */}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FiMail /> {app.seeker.email}
                      </span>
                      {profile.education && (
                        <span>&bull; Education: <strong>{profile.education}</strong></span>
                      )}
                    </div>

                    {/* Bio & Cover letter */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div className="glass-panel" style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', borderColor: 'rgba(255,255,255,0.03)' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '8px' }}>Candidate Profile Summary</h4>
                        <p style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                          {profile.bio || 'No summary provided.'}
                        </p>
                      </div>

                      <div className="glass-panel" style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', borderColor: 'rgba(255,255,255,0.03)' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '8px' }}>Intro/Cover Letter</h4>
                        <p style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>
                          {app.coverLetter || 'No cover letter provided.'}
                        </p>
                      </div>
                    </div>

                    {/* AI Score breakdown detail */}
                    <div className="glass-panel" style={{ 
                      padding: '20px', 
                      background: 'rgba(99, 102, 241, 0.05)', 
                      borderColor: 'rgba(99, 102, 241, 0.2)' 
                    }}>
                      <h4 style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '10px' }}>
                        <FiZap style={{ color: 'var(--accent)' }} /> AI Compatibility Insights
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {app.aiMatchExplanation}
                      </p>
                    </div>

                    {/* Skills Checklist */}
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '10px' }}>Candidate Skills</h4>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {profile.skills ? (
                          profile.skills.split(',').map((sk, idx) => (
                            <span key={idx} className="badge badge-purple" style={{ fontSize: '0.7rem', padding: '4px 10px', textTransform: 'none' }}>
                              {sk.trim()}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>No skills listed.</span>
                        )}
                      </div>
                    </div>

                    {/* Resume download/view link */}
                    {app.resumeUrl && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <a 
                          href={`${API_BASE_URL}${app.resumeUrl}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn btn-secondary"
                          style={{ display: 'inline-flex', gap: '6px', fontSize: '0.85rem', padding: '8px 16px' }}
                        >
                          <FiFileText /> View Uploaded Resume <FiExternalLink />
                        </a>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
