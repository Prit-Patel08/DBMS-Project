import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { UsersRound, Trophy, Search, CheckCircle2 } from 'lucide-react';

export const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.getAllTeamsAdmin();
        if (res.success) {
          setTeams(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch teams.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const filtered = teams.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.team_name.toLowerCase().includes(term) ||
      t.hackathon_title.toLowerCase().includes(term) ||
      (t.leader_name && t.leader_name.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Teams & Rosters</h1>
          <p className="page-subtitle">Inspect registered teams, designated leaders, and full membership rosters</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {/* Search */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by team name, hackathon title, or team leader..."
            className="form-control"
            style={{ maxWidth: '420px', border: 'none', padding: '0.35rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Team Name</th>
                <th>Hackathon</th>
                <th>Team Leader</th>
                <th>Members List</th>
                <th>Project Submission</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading teams from MySQL...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No matching teams found.</td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.team_id}>
                    <td>#{t.team_id}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.team_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created {t.created_at?.split(' ')[0]}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.hackathon_title}</div>
                      <Badge status={t.hackathon_status} />
                    </td>
                    <td>
                      {t.leader_name ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{t.leader_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.leader_email}</div>
                          <Badge type="role">Leader</Badge>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {t.members?.map((m) => (
                          <div key={m.participant_id} style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>{m.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({m.role})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      {t.project_title ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{t.project_title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <Badge status={t.submission_status} />
                            {t.score !== null && (
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>
                                {t.score} pts
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No submission yet
                        </span>
                      )}
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
