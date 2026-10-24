import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { 
  UsersRound, 
  FolderGit2, 
  Trophy, 
  Clock, 
  ArrowRight, 
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ParticipantDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, subsRes] = await Promise.all([
          api.getMyTeams(),
          api.getMySubmissions()
        ]);
        if (teamsRes.success) setTeams(teamsRes.data);
        if (subsRes.success) setSubmissions(subsRes.data);
      } catch (err) {
        setError(err.message || 'Failed to load participant data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const evaluatedSubs = submissions.filter((s) => s.status === 'Evaluated');
  const pendingSubs = submissions.filter((s) => s.status === 'Pending');
  const maxScore = evaluatedSubs.length > 0 
    ? Math.max(...evaluatedSubs.map((s) => parseFloat(s.score || 0)))
    : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Participant Dashboard</h1>
          <p className="page-subtitle">Track your teams, monitor project evaluation, and review mentor feedback</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/participant/hackathons" className="btn btn-primary">
            <Calendar size={16} /> Browse Hackathons
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={UsersRound} value={teams.length} label="My Enrolled Teams" />
        <StatCard icon={FolderGit2} value={submissions.length} label="Total Submissions" />
        <StatCard icon={Clock} value={pendingSubs.length} label="Pending Evaluations" />
        <StatCard icon={Trophy} value={maxScore !== null ? `${maxScore} / 100` : '—'} label="Highest Project Score" />
      </div>

      {/* Teams and Project Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Active Teams */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">My Teams</h2>
            <Link to="/participant/teams" className="btn btn-outline btn-sm">
              Manage Teams <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <UsersRound className="empty-state-icon" />
              <div className="empty-state-title">No teams joined yet</div>
              <div className="empty-state-desc">Browse upcoming hackathons and form a team to get started.</div>
              <Link to="/participant/hackathons" className="btn btn-primary btn-sm">
                Browse Events
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {teams.map((t) => (
                <div
                  key={t.team_id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    background: 'var(--bg-main)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{t.team_name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        ({t.hackathon_title})
                      </span>
                    </div>
                    <Badge type="role">{t.my_role}</Badge>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Roster: {t.members?.map((m) => m.name).join(', ')}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', fontSize: '0.82rem' }}>
                    <span>Project: <strong>{t.project_title || 'Not submitted yet'}</strong></span>
                    {t.submission_status && <Badge status={t.submission_status} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Evaluations */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Project Evaluation Status</h2>
            <Link to="/participant/submissions" className="btn btn-outline btn-sm">
              All Submissions <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading evaluations...</div>
          ) : submissions.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <FolderGit2 className="empty-state-icon" />
              <div className="empty-state-title">No projects submitted yet</div>
              <div className="empty-state-desc">Your team leader can submit your project repository before the deadline.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {submissions.map((s) => (
                <div
                  key={s.submission_id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    background: 'var(--bg-main)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{s.project_title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Team: {s.team_name} &bull; {s.hackathon_title}</div>
                    </div>
                    <Badge status={s.status} />
                  </div>

                  {s.status === 'Evaluated' ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>Evaluation Score:</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>{s.score} / 100</span>
                      </div>
                      {s.feedback && (
                        <p style={{ fontSize: '0.82rem', color: '#14532d', margin: '0.35rem 0 0', lineHeight: 1.4 }}>
                          <strong>Feedback:</strong> "{s.feedback}"
                        </p>
                      )}
                      <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.25rem', textAlign: 'right' }}>
                        Evaluated by {s.evaluator_name || 'Admin'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '0.65rem', marginTop: '0.5rem', fontSize: '0.82rem', color: '#92400e' }}>
                      Status: Project is currently queued for evaluation by administrators.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
