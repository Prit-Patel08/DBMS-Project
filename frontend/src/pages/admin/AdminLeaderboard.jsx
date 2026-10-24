import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Trophy, ExternalLink, Award, AlertCircle } from 'lucide-react';

export const AdminLeaderboard = () => {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingLeaderboard, setFetchingLeaderboard] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHackathonsList = async () => {
      try {
        const res = await api.getHackathons();
        if (res.success && res.data.length > 0) {
          setHackathons(res.data);
          setSelectedHackathonId(res.data[0].hackathon_id.toString());
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch hackathons.');
      } finally {
        setLoading(false);
      }
    };

    fetchHackathonsList();
  }, []);

  useEffect(() => {
    if (!selectedHackathonId) return;

    const fetchBoard = async () => {
      setFetchingLeaderboard(true);
      setError('');
      try {
        const res = await api.getLeaderboard(selectedHackathonId);
        if (res.success) {
          setLeaderboard(res.leaderboard);
        }
      } catch (err) {
        setError(err.message || 'Failed to load leaderboard data.');
      } finally {
        setFetchingLeaderboard(false);
      }
    };

    fetchBoard();
  }, [selectedHackathonId]);

  const getRankBadge = (rank) => {
    if (rank === 1) return <span style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 800 }}><Award size={18} /> 1st</span>;
    if (rank === 2) return <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700 }}><Award size={18} /> 2nd</span>;
    if (rank === 3) return <span style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700 }}><Award size={18} /> 3rd</span>;
    return <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{rank}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hackathon Leaderboard</h1>
          <p className="page-subtitle">Rankings computed dynamically via MySQL Window Functions (DENSE_RANK)</p>
        </div>

        {/* Hackathon Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="hackathon-select" style={{ fontSize: '0.88rem', fontWeight: 600 }}>Select Event:</label>
          <select
            id="hackathon-select"
            className="form-control"
            style={{ width: 'auto', minWidth: '260px' }}
            value={selectedHackathonId}
            onChange={(e) => setSelectedHackathonId(e.target.value)}
          >
            {hackathons.map((h) => (
              <option key={h.hackathon_id} value={h.hackathon_id}>
                {h.title} ({h.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Rank</th>
                <th>Team & Leader</th>
                <th>Project Title & Repository</th>
                <th>Evaluator</th>
                <th>Submission Timestamp</th>
                <th style={{ textAlign: 'right', width: '130px' }}>Final Score</th>
              </tr>
            </thead>
            <tbody>
              {fetchingLeaderboard ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Computing leaderboard ranking from MySQL...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                      No evaluated submissions found for this hackathon yet.
                    </div>
                  </td>
                </tr>
              ) : (
                leaderboard.map((row) => (
                  <tr key={row.submission_id}>
                    <td>{getRankBadge(row.rank_position)}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.team_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Leader: {row.leader_name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.project_title}</div>
                      {row.github_link && (
                        <a
                          href={row.github_link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                        >
                          Code Repository <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {row.evaluated_by}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {row.submitted_at}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {row.score}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>/ 100</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
