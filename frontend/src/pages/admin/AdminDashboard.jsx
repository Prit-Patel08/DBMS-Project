import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { 
  Calendar, 
  Users, 
  UsersRound, 
  FolderGit2, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getAdminDashboard();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics from MySQL...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const { summary, hackathons, recent_submissions } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Administrator Dashboard</h1>
          <p className="page-subtitle">Real-time aggregate DBMS metrics across HackArena tables</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={Calendar} value={summary?.total_hackathons} label="Total Hackathons" />
        <StatCard icon={Users} value={summary?.total_participants} label="Total Participants" />
        <StatCard icon={UsersRound} value={summary?.total_teams} label="Registered Teams" />
        <StatCard icon={FolderGit2} value={summary?.total_submissions} label="Total Submissions" />
        <StatCard icon={Clock} value={summary?.pending_submissions} label="Pending Evaluations" />
        <StatCard icon={TrendingUp} value={summary?.average_score ? `${summary.average_score}/100` : 'N/A'} label="Average Evaluated Score" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Hackathon Participation Overview */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Hackathon Volume</h2>
            <Link to="/admin/hackathons" className="btn btn-outline btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Teams</th>
                  <th>Submissions</th>
                </tr>
              </thead>
              <tbody>
                {hackathons?.map((h) => (
                  <tr key={h.hackathon_id}>
                    <td style={{ fontWeight: 600 }}>{h.title}</td>
                    <td><Badge status={h.status} /></td>
                    <td>{h.total_teams}</td>
                    <td>{h.total_submissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Submissions</h2>
            <Link to="/admin/submissions" className="btn btn-outline btn-sm">
              Review Queue <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {recent_submissions?.map((s) => (
                  <tr key={s.submission_id}>
                    <td style={{ fontWeight: 600 }}>{s.project_title}</td>
                    <td>{s.team_name}</td>
                    <td><Badge status={s.status} /></td>
                    <td>{s.score !== null ? <strong>{s.score}</strong> : <span style={{ color: 'var(--text-muted)' }}>Pending</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
