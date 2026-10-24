import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { Calendar, Users, FolderGit2, Plus, AlertCircle, CheckCircle, Trophy } from 'lucide-react';

export const ParticipantHackathons = () => {
  const [hackathons, setHackathons] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Team Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [modalError, setModalError] = useState('');
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [hRes, tRes] = await Promise.all([
        api.getHackathons(),
        api.getMyTeams()
      ]);
      if (hRes.success) setHackathons(hRes.data);
      if (tRes.success) setMyTeams(tRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load hackathon events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateTeamModal = (h) => {
    setSelectedHackathon(h);
    setTeamName('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!teamName.trim()) {
      setModalError('Team name is required.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.createTeam({
        team_name: teamName.trim(),
        hackathon_id: selectedHackathon.hackathon_id
      });
      setSuccess(`Team "${teamName}" created successfully! You are the Team Leader.`);
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to create team.');
    } finally {
      setCreating(false);
    }
  };

  // Check if participant is already enrolled in a team for this hackathon
  const isEnrolledIn = (hackathonId) => {
    return myTeams.some((t) => t.hackathon_id === hackathonId);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Browse Hackathons</h1>
          <p className="page-subtitle">Discover active challenges, form teams, and register before deadlines</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading hackathons from database...
          </div>
        ) : (
          hackathons.map((h) => {
            const enrolled = isEnrolledIn(h.hackathon_id);
            const myTeam = myTeams.find((t) => t.hackathon_id === h.hackathon_id);
            const isCompleted = h.status === 'Completed';

            return (
              <div key={h.hackathon_id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{h.title}</h3>
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
                    <span>Registration Deadline: <strong>{h.registration_deadline}</strong></span>
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

                {/* Team Status or Action */}
                <div style={{ marginTop: 'auto' }}>
                  {enrolled ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-light)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                        Enrolled: {myTeam?.team_name}
                      </span>
                      <button
                        onClick={() => navigate('/participant/teams')}
                        className="btn btn-primary btn-sm"
                      >
                        My Team
                      </button>
                    </div>
                  ) : isCompleted ? (
                    <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      Event has concluded
                    </div>
                  ) : (
                    <button
                      onClick={() => openCreateTeamModal(h)}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                    >
                      <Plus size={15} /> Create a Team
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Team Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Form Team for: ${selectedHackathon?.title}`}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              form="create-team-form"
              disabled={creating}
              className="btn btn-primary"
            >
              {creating ? 'Creating Team...' : 'Create Team & Register'}
            </button>
          </>
        }
      >
        {modalError && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>{modalError}</div>
          </div>
        )}

        <form id="create-team-form" onSubmit={handleCreateTeamSubmit}>
          <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div><strong>Registration Deadline:</strong> {selectedHackathon?.registration_deadline}</div>
            <div style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
              Note: As creator, you will automatically be assigned as <strong>Team Leader</strong>.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="teamName">Team Name *</label>
            <input
              id="teamName"
              type="text"
              required
              className="form-control"
              placeholder="e.g. NeuralKnights"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <span className="form-hint">Unique within this hackathon</span>
          </div>
        </form>
      </Modal>
    </div>
  );
};
