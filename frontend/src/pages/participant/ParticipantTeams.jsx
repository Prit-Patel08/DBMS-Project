import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { 
  UsersRound, 
  UserPlus, 
  FolderGit2, 
  Crown, 
  User, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Trash2
} from 'lucide-react';

export const ParticipantTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Member Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [modalError, setModalError] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const fetchTeams = async () => {
    try {
      const res = await api.getMyTeams();
      if (res.success) {
        setTeams(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch your teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openAddMemberModal = (team) => {
    setSelectedTeam(team);
    setMemberEmail('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!memberEmail.trim()) {
      setModalError('Participant email is required.');
      return;
    }

    setAddingMember(true);
    try {
      const res = await api.addTeamMember(selectedTeam.team_id, { email: memberEmail.trim() });
      setSuccess(res.message || 'Member added successfully.');
      setIsModalOpen(false);
      fetchTeams();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to add member to team.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Are you sure you want to disband and delete team "${team.team_name}"?\n\nThis will remove all member assignments and un-evaluated submissions.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await api.deleteTeam(team.team_id);
      setSuccess(res.message || `Team "${team.team_name}" was successfully disbanded.`);
      fetchTeams();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to disband team.');
      setTimeout(() => setError(''), 6000);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Teams</h1>
          <p className="page-subtitle">Manage your team rosters, collaborate, and invite registered participants</p>
        </div>
        <Link to="/participant/hackathons" className="btn btn-outline">
          <Calendar size={16} /> Browse More Hackathons
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading your teams from MySQL...
        </div>
      ) : teams.length === 0 ? (
        <div className="card empty-state">
          <UsersRound className="empty-state-icon" />
          <div className="empty-state-title">You have not joined any teams yet</div>
          <div className="empty-state-desc">Join an ongoing or upcoming hackathon to create or participate in a team.</div>
          <Link to="/participant/hackathons" className="btn btn-primary">
            Explore Hackathons
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {teams.map((t) => {
            const isLeader = t.my_role === 'Leader';

            return (
              <div key={t.team_id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{t.team_name}</h2>
                      <Badge type="role">{t.my_role}</Badge>
                      <Badge status={t.hackathon_status} />
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Event: <strong>{t.hackathon_title}</strong> &bull; Registration Deadline: {t.registration_deadline}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isLeader && (
                      <>
                        <button
                          onClick={() => openAddMemberModal(t)}
                          className="btn btn-outline btn-sm"
                        >
                          <UserPlus size={14} /> Add Teammate
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(t)}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)', borderColor: '#fca5a5' }}
                          title="Disband Team"
                        >
                          <Trash2 size={14} /> Disband Team
                        </button>
                      </>
                    )}
                    <Link
                      to="/participant/submissions"
                      className="btn btn-primary btn-sm"
                    >
                      <FolderGit2 size={14} /> {t.project_title ? 'View Project' : 'Submit Project'}
                    </Link>
                  </div>
                </div>

                {/* Team Roster Table */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Team Members ({t.members?.length || 0})
                  </div>
                  <table>
                    <tbody>
                      {t.members?.map((m) => (
                        <tr key={m.participant_id}>
                          <td style={{ width: '40px', padding: '0.65rem 1rem' }}>
                            {m.role === 'Leader' ? (
                              <Crown size={16} color="var(--primary)" />
                            ) : (
                              <User size={16} color="var(--text-muted)" />
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>{m.name}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{m.email}</td>
                          <td style={{ fontSize: '0.82rem' }}>{m.college || '—'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <Badge type="role">{m.role}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Project Status Snippet */}
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <div>
                    <strong>Project Submission:</strong> {t.project_title ? (
                      <span>"{t.project_title}"</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending submission by leader</span>
                    )}
                  </div>
                  {t.score !== null && (
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      Score: {t.score} / 100
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add Teammate to ${selectedTeam?.team_name}`}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              form="add-member-form"
              disabled={addingMember}
              className="btn btn-primary"
            >
              {addingMember ? 'Adding...' : 'Add Teammate'}
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

        <form id="add-member-form" onSubmit={handleAddMemberSubmit}>
          <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong>DBMS Rule:</strong> Teammates must already have a registered account on HackArena, and cannot be enrolled in another team within this same hackathon.
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="memberEmail">Student Email Address *</label>
            <input
              id="memberEmail"
              type="email"
              required
              className="form-control"
              placeholder="e.g. priya.patel@stanford.edu"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
            />
            <span className="form-hint">Must match their registered HackArena login email</span>
          </div>
        </form>
      </Modal>
    </div>
  );
};
