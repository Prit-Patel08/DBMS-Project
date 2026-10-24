import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, Search, GraduationCap, Phone, Mail, Calendar } from 'lucide-react';

export const AdminParticipants = () => {
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await api.getParticipants();
        if (res.success) {
          setParticipants(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch participants.');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, []);

  const filtered = participants.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      (p.college && p.college.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Registered Participants</h1>
          <p className="page-subtitle">View student registrations, academic affiliations, and participation volume</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {/* Search Bar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by participant name, email, or college..."
            className="form-control"
            style={{ maxWidth: '400px', border: 'none', padding: '0.35rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Participant</th>
                <th>College / University</th>
                <th>Contact Phone</th>
                <th>Teams Enrolled</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading participants from MySQL...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No matching participants found.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.participant_id}>
                    <td>#{p.participant_id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.email}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <GraduationCap size={15} color="var(--text-muted)" />
                        <span>{p.college || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not specified</span>}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <Phone size={14} color="var(--text-muted)" />
                        <span>{p.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-member" style={{ fontWeight: 600 }}>
                        {p.teams_joined} {p.teams_joined === 1 ? 'Team' : 'Teams'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {p.created_at ? p.created_at.split(' ')[0] : '—'}
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
