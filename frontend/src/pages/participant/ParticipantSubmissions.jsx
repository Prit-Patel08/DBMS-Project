import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { 
  FolderGit2, 
  ExternalLink, 
  Edit3, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Lock 
} from 'lucide-react';

export const ParticipantSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Submit / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState(null);

  const [formData, setFormData] = useState({
    project_title: '',
    description: '',
    github_link: ''
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [subsRes, teamsRes] = await Promise.all([
        api.getMySubmissions(),
        api.getMyTeams()
      ]);
      if (subsRes.success) setSubmissions(subsRes.data);
      if (teamsRes.success) setMyTeams(teamsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch project submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Teams where user is Leader and hasn't submitted yet
  const eligibleTeams = myTeams.filter(
    (t) => t.my_role === 'Leader' && !t.project_title && t.hackathon_status !== 'Completed'
  );

  const openCreateModal = (teamId = '') => {
    setModalMode('create');
    setSelectedTeamId(teamId || (eligibleTeams.length > 0 ? eligibleTeams[0].team_id.toString() : ''));
    setSelectedSubId(null);
    setFormData({ project_title: '', description: '', github_link: '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setModalMode('edit');
    setSelectedSubId(sub.submission_id);
    setSelectedTeamId(sub.team_id.toString());
    setFormData({
      project_title: sub.project_title,
      description: sub.description || '',
      github_link: sub.github_link || ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.project_title.trim()) {
      setModalError('Project title is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await api.createSubmission({
          team_id: parseInt(selectedTeamId, 10),
          ...formData
        });
        setSuccess('Project submitted successfully for evaluation!');
      } else {
        await api.updateSubmission(selectedSubId, formData);
        setSuccess('Submission details updated successfully.');
      }
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to save submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Project Submissions</h1>
          <p className="page-subtitle">Submit deliverables, monitor evaluation progress, and review scores</p>
        </div>
        {eligibleTeams.length > 0 && (
          <button onClick={() => openCreateModal()} className="btn btn-primary">
            <Plus size={16} /> Submit Team Project
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading submissions from MySQL...
        </div>
      ) : submissions.length === 0 ? (
        <div className="card empty-state">
          <FolderGit2 className="empty-state-icon" />
          <div className="empty-state-title">No submissions yet</div>
          <div className="empty-state-desc">
            {eligibleTeams.length > 0
              ? 'You are the leader of a team with a pending submission. Click below to submit your project codebase.'
              : 'Join a hackathon and form a team to submit a project for evaluation.'}
          </div>
          {eligibleTeams.length > 0 && (
            <button onClick={() => openCreateModal()} className="btn btn-primary">
              Submit Project Now
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {submissions.map((s) => {
            const isLeader = s.my_role === 'Leader';
            const isEvaluated = s.status === 'Evaluated';

            return (
              <div key={s.submission_id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{s.project_title}</h2>
                      <Badge status={s.status} />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Team: <strong>{s.team_name}</strong> &bull; Hackathon: <strong>{s.hackathon_title}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {isLeader && !isEvaluated && (
                      <button onClick={() => openEditModal(s)} className="btn btn-outline btn-sm">
                        <Edit3 size={14} /> Edit Details
                      </button>
                    )}
                    {isEvaluated && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <Lock size={14} /> Finalized & Evaluated
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {s.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No project description provided.</span>}
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  {s.github_link && (
                    <div>
                      <strong>Repository:</strong>{' '}
                      <a href={s.github_link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {s.github_link} <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                  <div><strong>Submitted At:</strong> {s.submitted_at}</div>
                </div>

                {/* Score & Evaluation Feedback Box */}
                {isEvaluated ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#166534' }}>Official Evaluation Result</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>{s.score} / 100</span>
                    </div>
                    {s.feedback && (
                      <div style={{ fontSize: '0.88rem', color: '#14532d', lineHeight: 1.5 }}>
                        <strong>Feedback:</strong> {s.feedback}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.5rem', textAlign: 'right' }}>
                      Evaluated by {s.evaluator_name || 'Administrator'}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} />
                    <span>Your submission is currently under review by the hackathon evaluation team. Results will be posted here once finalized.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Submit Final Project' : 'Edit Project Details'}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              form="submission-form"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : modalMode === 'create' ? 'Submit Project' : 'Save Changes'}
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

        <form id="submission-form" onSubmit={handleModalSubmit}>
          {modalMode === 'create' && (
            <div className="form-group">
              <label className="form-label" htmlFor="teamSelect">Team *</label>
              <select
                id="teamSelect"
                required
                className="form-control"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                {eligibleTeams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.team_name} — {t.hackathon_title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="projTitle">Project Title *</label>
            <input
              id="projTitle"
              type="text"
              required
              className="form-control"
              placeholder="e.g. Distributed Mesh Network"
              value={formData.project_title}
              onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="projDesc">Project Description</label>
            <textarea
              id="projDesc"
              className="form-control"
              placeholder="Summarize the core architecture, features, and technologies used..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="projGithub">GitHub / Code Repository URL</label>
            <input
              id="projGithub"
              type="url"
              className="form-control"
              placeholder="https://github.com/your-team/project"
              value={formData.github_link}
              onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
