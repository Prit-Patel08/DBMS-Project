import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Trophy, Calendar, Users, FolderGit2, ArrowRight } from 'lucide-react';

export const Home = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res = await api.getHackathons();
        if (res.success) {
          setHackathons(res.data);
        }
      } catch (err) {
        console.error('Failed to load hackathons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHackathons();
  }, []);

  return (
    <div className="app-container">
      <Navbar />

      <main style={{ padding: '3.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
            <Trophy size={16} /> College DBMS Project 2026
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
            HackArena: Hackathon Management & Project Evaluation
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            A normalized relational database system supporting real-time hackathon management, team collaboration, project submission, and transparent admin evaluation.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary">
              Register as Participant <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-outline">
              Sign In to Your Team
            </Link>
          </div>
        </div>

        {/* Hackathons Section */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="page-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 className="page-title" style={{ fontSize: '1.4rem' }}>Featured Hackathons</h2>
              <p className="page-subtitle">Real-time events fetched directly from MySQL database</p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading hackathons from database...
            </div>
          ) : hackathons.length === 0 ? (
            <div className="card empty-state">
              <Calendar className="empty-state-icon" />
              <div className="empty-state-title">No hackathons scheduled</div>
              <div className="empty-state-desc">Check back soon for new hackathon events.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {hackathons.map((h) => (
                <div key={h.hackathon_id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>{h.title}</h3>
                    <Badge status={h.status} />
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', flex: 1, marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    {h.description || 'No description provided.'}
                  </p>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} />
                      <span>Duration: {h.start_date} to {h.end_date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="var(--warning)" />
                      <span>Register By: <strong>{h.registration_deadline}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px dashed var(--border-color)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Users size={14} /> {h.total_teams} Teams
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FolderGit2 size={14} /> {h.total_submissions} Submissions
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to="/login" className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                      Join Hackathon
                    </Link>
                    <Link to={`/results/${h.hackathon_id}`} className="btn btn-primary btn-sm">
                      Leaderboard
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
