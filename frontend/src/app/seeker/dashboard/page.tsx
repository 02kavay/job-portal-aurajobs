'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSliders, FiList, FiZap, FiCheckCircle, FiFileText, FiMapPin, FiDollarSign, FiClock, FiCheck, FiInfo, FiUser, FiArrowRight } from 'react-icons/fi';
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
  recruiter: { email: string };
  aiMatch?: {
    score: number;
    explanation: string;
    matchedSkills: string[];
    missingSkills: string[];
  };
}

interface Application {
  id: string;
  status: string;
  createdAt: string;
  aiMatchScore: number;
  aiMatchExplanation: string;
  job: Job;
}

export default function SeekerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'applications'>('recommendations');
  
  // Data State
  const [recommendations, setRecommendations] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Selected Job for detail view
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Explanations Modal State
  const [explainMatch, setExplainMatch] = useState<{
    score: number;
    explanation: string;
    matchedSkills: string[];
    missingSkills: string[];
    title: string;
  } | null>(null);

  // Application Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      if (activeTab === 'recommendations') {
        const res = await fetch(`${API_BASE_URL}/api/jobs/recommendations`, { headers });
        const data = await res.json();
        
        if (data.message) {
          setMessage(data.message);
          setRecommendations([]);
          setSelectedJob(null);
        } else if (Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
          if (data.recommendations.length > 0) {
            setSelectedJob(data.recommendations[0]);
          } else {
            setSelectedJob(null);
          }
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/applications/seeker`, { headers });
        const data = await res.json();
        if (Array.isArray(data)) {
          setApplications(data);
        }
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
      setMessage('Failed to connect to API server.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
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
      const res = await fetch(`${API_BASE_URL}/api/applications`, {
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
        // Reload details to verify matching update
      } else {
        setApplyError(data.error || 'Failed to apply.');
      }
    } catch (err) {
      setApplyError('Network error.');
    } finally {
      setApplying(false);
    }
  };

  // Helper to color code scores
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'badge-success';
    if (score >= 50) return 'badge-warning';
    return 'badge-danger';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPLIED': return 'badge-blue';
      case 'SHORTLISTED': return 'badge-purple';
      case 'INTERVIEW': return 'badge-success';
      case 'REJECTED': return 'badge-danger';
      default: return 'badge-blue';
    }
  };

  return (
    <div className="container" style={{ minHeight: '80vh' }}>
      
      {/* Dashboard Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 className="page-title">Candidate Dashboard</h1>
          <p className="page-subtitle">Track your job applications and check real-time compatibility insights.</p>
        </div>
        <Link href="/seeker/profile" className="btn btn-secondary">
          <FiUser /> Edit Profile
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-glow)', paddingBottom: '12px', marginBottom: '32px' }}>
        <button 
          onClick={() => setActiveTab('recommendations')} 
          className="btn" 
          style={{ 
            background: activeTab === 'recommendations' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'recommendations' ? 'var(--text-main)' : 'var(--text-muted)'
          }}
        >
          <FiZap style={{ color: 'var(--primary)' }} /> AI Recommendations
        </button>
        <button 
          onClick={() => setActiveTab('applications')} 
          className="btn"
          style={{ 
            background: activeTab === 'applications' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'applications' ? 'var(--text-main)' : 'var(--text-muted)'
          }}
        >
          <FiList /> My Applications ({applications.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : activeTab === 'recommendations' ? (
        
        /* RECOMMENDATIONS TAB */
        message ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
            <FiZap style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ marginBottom: '12px' }}>Unlock AI matching engine</h3>
            <p style={{ maxWidth: '500px', margin: '0 auto 24px auto', fontSize: '0.95rem' }}>{message}</p>
            <Link href="/seeker/profile" className="btn btn-primary">
              Build Profile & Add Skills
            </Link>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No jobs are currently registered in the portal. Check back later!
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '30px', flexDirection: 'row', flexWrap: 'wrap' }}>
            
            {/* List side */}
            <div style={{ flex: '1.2', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recommendations.map(job => (
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

                    {job.aiMatch && (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (job.aiMatch) {
                            setExplainMatch({
                              ...job.aiMatch,
                              title: job.title
                            });
                          }
                        }}
                        className={`badge ${getScoreColor(job.aiMatch.score)}`} 
                        style={{ display: 'inline-flex', gap: '4px', cursor: 'pointer' }}
                        title="Click to view AI compatibility details"
                      >
                        <FiZap /> {job.aiMatch.score}% MATCH <FiInfo />
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiMapPin /> {job.location}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiClock /> {job.experienceRequired} yrs exp
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {job.requirements.split(',').map((req, idx) => (
                      <span key={idx} className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                        {req.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Detail side */}
            <div style={{ flex: '1.8', minWidth: '350px' }}>
              {selectedJob ? (
                <div className="glass-panel" style={{ padding: '32px', position: 'sticky', top: '100px' }}>
                  
                  {/* AI insights banner */}
                  {selectedJob.aiMatch && (
                    <div className="glass-panel" style={{ 
                      padding: '16px 20px', 
                      marginBottom: '24px', 
                      background: 'rgba(99,102,241,0.06)', 
                      borderColor: 'rgba(99,102,241,0.2)' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h5 style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          <FiZap style={{ color: 'var(--accent)' }} /> AI Match Analysis
                        </h5>
                        <span className={`badge ${getScoreColor(selectedJob.aiMatch.score)}`}>
                          {selectedJob.aiMatch.score}% Match Score
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {selectedJob.aiMatch.explanation}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glow)', paddingBottom: '20px', marginBottom: '24px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.7rem', marginBottom: '6px' }}>{selectedJob.title}</h2>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FiMapPin /> {selectedJob.location}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FiDollarSign /> {selectedJob.salaryRange}
                        </span>
                      </div>
                    </div>
                    <button onClick={handleApplyClick} className="btn btn-primary">
                      Apply Now <FiArrowRight />
                    </button>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--text-main)' }}>Job Description</h4>
                    <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>{selectedJob.description}</p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-main)' }}>Key Requirements</h4>
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
                <div className="glass-panel" style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-dark)' }}>
                  Select a job post to view AI match parameters and details
                </div>
              )}
            </div>

          </div>
        )
      ) : (
        
        /* APPLICATIONS TAB */
        applications.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            You haven&apos;t applied for any jobs yet. Browse recommended positions to apply!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {applications.map(app => (
              <div key={app.id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ flex: 2, minWidth: '250px' }}>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{app.job.title}</h3>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiMapPin /> {app.job.location}
                    </span>
                    <span>Applied on {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`badge ${getScoreColor(app.aiMatchScore)}`} style={{ fontSize: '0.7rem' }}>
                    AI Score: {app.aiMatchScore}%
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: '150px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', marginBottom: '4px' }}>Application Status</p>
                  <span className={`badge ${getStatusBadge(app.status)}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                    {app.status}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: '120px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => {
                      setExplainMatch({
                        score: app.aiMatchScore,
                        explanation: app.aiMatchExplanation,
                        matchedSkills: [],
                        missingSkills: [],
                        title: app.job.title
                      });
                    }}
                    className="btn btn-secondary" 
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    View Insights
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* AI match details explainer modal */}
      {explainMatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(6px)'
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '550px',
            padding: '36px',
            background: 'var(--bg-dark)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: '6px' }}>AI Match Breakdown</span>
                <h3 style={{ fontSize: '1.4rem' }}>{explainMatch.title}</h3>
              </div>
              <span className={`badge ${getScoreColor(explainMatch.score)}`} style={{ fontSize: '1.1rem', padding: '10px 16px', borderRadius: '12px' }}>
                {explainMatch.score}% Match
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '8px' }}>Matching Explanation</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {explainMatch.explanation}
                </p>
              </div>

              {/* Matched / Missing skills displays */}
              {explainMatch.matchedSkills.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiCheck /> Matched Skills
                  </h4>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {explainMatch.matchedSkills.map((sk, idx) => (
                      <span key={idx} className="badge badge-success" style={{ fontSize: '0.7rem', padding: '4px 10px', textTransform: 'none' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {explainMatch.missingSkills.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--warning)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiInfo /> Recommended Skills to Learn
                  </h4>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {explainMatch.missingSkills.map((sk, idx) => (
                      <span key={idx} className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '4px 10px', textTransform: 'none' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <button onClick={() => setExplainMatch(null)} className="btn btn-primary" style={{ width: '100%' }}>
              Close Insights
            </button>
          </div>
        </div>
      )}

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
                  Your application for <strong>{selectedJob.title}</strong> has been submitted.
                </p>
                <button 
                  onClick={() => {
                    setIsApplyModalOpen(false);
                    loadData(); // refresh
                  }} 
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Close
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
                      Your saved profile data and resume will be sent automatically.
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
                    {applying ? 'Sending...' : 'Submit Application'}
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
