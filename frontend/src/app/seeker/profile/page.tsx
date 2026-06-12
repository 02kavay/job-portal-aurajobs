'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUploadCloud, FiUser, FiBriefcase, FiBookOpen, FiActivity, FiSave, FiAlertCircle, FiCheck, FiFileText } from 'react-icons/fi';

export default function SeekerProfile() {
  const router = useRouter();

  // Profile fields state
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [education, setEducation] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [parsedNotice, setParsedNotice] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFullName(data.fullName || '');
        setTitle(data.title || '');
        setBio(data.bio || '');
        setSkills(data.skills || '');
        setExperienceYears(data.experienceYears || 0);
        setEducation(data.education || '');
        setResumeUrl(data.resumeUrl || '');
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    setParsedNotice(false);
    setMessage(null);

    try {
      const res = await fetch('http://localhost:5000/api/profile/upload-resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        // Pre-fill fields with parsed data
        if (data.parsedData) {
          setFullName(data.parsedData.fullName || fullName);
          setTitle(data.parsedData.title || title);
          setBio(data.parsedData.bio || bio);
          setSkills(data.parsedData.skills || skills);
          setExperienceYears(data.parsedData.experienceYears || experienceYears);
          setEducation(data.parsedData.education || education);
        }
        setResumeUrl(data.resumeUrl);
        setParsedNotice(true);
        setMessage({ text: 'Resume uploaded and parsed successfully! Review details below.', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to parse resume.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network upload error.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setParsedNotice(false);

    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fullName,
          title,
          bio,
          skills,
          experienceYears,
          education,
          resumeUrl
        })
      });

      if (res.ok) {
        setMessage({ text: 'Profile updated successfully! Unlock AI recommendations in your dashboard.', type: 'success' });
        // Update user name in localStorage if changed
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.profile = { fullName, title, skills, experienceYears, education, resumeUrl };
          localStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new Event('auth-change'));
        }
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'Failed to save profile.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network saving error.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Calculate completeness score
  const getCompleteness = () => {
    let score = 0;
    if (fullName) score += 15;
    if (title) score += 15;
    if (bio) score += 20;
    if (skills) score += 20;
    if (experienceYears > 0) score += 15;
    if (education) score += 15;
    return score;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const compScore = getCompleteness();

  return (
    <div className="container" style={{ maxWidth: '950px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Profile Builder</h1>
          <p className="page-subtitle">Build your technical profile. Upload a PDF resume to instantly pre-fill details using AI parser.</p>
        </div>
        
        {/* Completeness Tracker */}
        <div className="glass-panel" style={{ padding: '16px 24px', minWidth: '220px', background: 'rgba(99, 102, 241, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
            <span>Profile Completeness</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{compScore}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${compScore}%`, height: '100%', background: 'linear-gradient(to right, var(--primary), var(--accent))', transition: 'width 0.4s' }} />
          </div>
        </div>
      </div>

      {message && (
        <div className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ 
          display: 'block', 
          width: '100%', 
          padding: '14px', 
          borderRadius: '12px', 
          marginBottom: '28px', 
          textTransform: 'none',
          fontSize: '0.9rem'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {message.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
            {message.text}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '30px', flexDirection: 'row', flexWrap: 'wrap' }}>
        
        {/* Left: Resume Upload Widget */}
        <div style={{ flex: '1', minWidth: '280px' }}>
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', background: 'rgba(18, 24, 54, 0.4)' }}>
            <FiUploadCloud style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: '16px', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Resume AI Parser</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '24px' }}>
              Upload your resume in PDF or TXT format (max 5MB).
            </p>

            <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', width: '100%', gap: '8px' }}>
              <input 
                type="file" 
                accept=".pdf,.txt" 
                onChange={handleResumeUpload} 
                style={{ display: 'none' }}
                disabled={uploading}
              />
              {uploading ? 'Analyzing PDF...' : 'Upload Resume File'}
            </label>

            {resumeUrl && (
              <div style={{ marginTop: '24px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <FiFileText style={{ color: 'var(--accent)' }} />
                <span>Resume file attached</span>
                <a 
                  href={`http://localhost:5000${resumeUrl}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                >
                  View
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right: Editable Form Details */}
        <form onSubmit={handleSaveProfile} style={{ flex: '2', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '44px' }}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Professional Title</label>
                <div style={{ position: 'relative' }}>
                  <FiBriefcase style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                  <input 
                    type="text" 
                    placeholder="e.g. Frontend Engineer, Product Designer" 
                    className="form-input" 
                    style={{ paddingLeft: '44px' }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">Years of Experience</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value, 10) || 0)}
                />
              </div>

              <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
                <label className="form-label">Highest Education</label>
                <div style={{ position: 'relative' }}>
                  <FiBookOpen style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                  <input 
                    type="text" 
                    placeholder="e.g. BS in Computer Science, Stanford" 
                    className="form-input" 
                    style={{ paddingLeft: '44px' }}
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Skills & Tech Stack (Comma-separated)</label>
              <div style={{ position: 'relative' }}>
                <FiActivity style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-dark)' }} />
                <textarea 
                  placeholder="e.g. React, Node.js, JavaScript, Python, PostgreSQL" 
                  className="form-textarea" 
                  style={{ paddingLeft: '44px' }}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Professional Summary / Bio</label>
              <textarea 
                placeholder="Tell recruiters about your background, projects, and goals..." 
                className="form-textarea" 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ alignSelf: 'flex-end', padding: '14px 32px' }}
              disabled={saving}
            >
              <FiSave /> {saving ? 'Saving Details...' : 'Save Profile Builder'}
            </button>

          </div>
        </form>

      </div>
    </div>
  );
}
