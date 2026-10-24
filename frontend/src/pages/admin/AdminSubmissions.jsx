import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { 
  FolderGit2, 
  ExternalLink, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search 
} from 'lucide-react';

export const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Evaluation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [modalError, setModalError] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  const fetchSubmissions = async () => {
    try {
      const res = await api.getAllSubmissionsAdmin();
      if (res.success) {
        setSubmissions(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const openEvalModal = (sub) => {
    setSelectedSub(sub);
    setScore(sub.score !== null ? sub.score.toString() : '');
    setFeedback(sub.feedback || '');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      setModalError('Score must be a number between 0.00 and 100.00.');
      return;
    }

    setEvaluating(true);
    try {
      await api.evaluateSubmission(selectedSub.submission_id, {
        score: numScore,
        feedback: feedback.trim()
      });
      setSuccess(`Project "${selectedSub.project_title}" evaluated successfully with score ${numScore}.`);
      setIsModalOpen(false);
      fetchSubmissions();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to submit evaluation.');
    } finally {
      setEvaluating(false);
    }
  };

  const filtered = submissions.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      s.project_title.toLowerCase().includes(term) ||
      s.team_name.toLowerCase().includes(term) ||
      s.hackathon_title.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'ALL' || s.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Submissions & Evaluation</h1>
          <p className="page-subtitle">Review team project codebases, assign scores, and publish qualitative feedback</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ padding: 0 }}>
        {/* Filters */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, minWidth: '250px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by project title, team, or hackathon..."
              className="form-control"
              style={{ border: 'none', padding: '0.35rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="form-control"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Evaluation</option>
              <option value="EVALUATED">Evaluated</option>
            </select>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Project Title & Team</th>
                <th>Hackathon</th>
                <th>Repository</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Score & Feedback</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading submissions from MySQL...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No matching submissions found.</td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.submission_id}>
                    <td>#{s.submission_id}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.project_title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>Team: {s.team_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Leader: {s.leader_name}</div>
                    </td>
                    <td>{s.hackathon_title}</td>
                    <td>
                      {s.github_link ? (
                        <a
                          href={s.github_link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem' }}
                        >
                          GitHub <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {s.submitted_at}
                    </td>
                    <td><Badge status={s.status} /></td>
                    <td>
                      {s.status === 'Evaluated' ? (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                            {s.score} / 100
                          </div>
                          {s.feedback && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              "{s.feedback}"
                            </div>
                          )}
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            by {s.evaluator_name || 'Admin'}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--warning)', fontStyle: 'italic' }}>
                          Awaiting score
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openEvalModal(s)}
                        className={`btn btn-sm ${s.status === 'Evaluated' ? 'btn-outline' : 'btn-primary'}`}
                      >
                        <Star size={13} />
                        {s.status === 'Evaluated' ? 'Re-Evaluate' : 'Evaluate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Evaluate: ${selectedSub?.project_title}`}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              form="eval-form"
              disabled={evaluating}
              className="btn btn-primary"
            >
              {evaluating ? 'Submitting...' : 'Save Evaluation'}
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

        <form id="eval-form" onSubmit={handleEvalSubmit}>
          <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div><strong>Team:</strong> {selectedSub?.team_name}</div>
            <div><strong>Hackathon:</strong> {selectedSub?.hackathon_title}</div>
            {selectedSub?.github_link && (
              <div>
                <strong>Repository:</strong>{' '}
                <a href={selectedSub.github_link} target="_blank" rel="noreferrer">
                  {selectedSub.github_link}
                </a>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="score">Score (0.00 to 100.00) *</label>
            <input
              id="score"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              className="form-control"
              placeholder="e.g. 92.50"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
            <span className="form-hint">Stored as DECIMAL(5,2) with MySQL CHECK constraint</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="feedback">Evaluation Feedback & Rubric Notes</label>
            <textarea
              id="feedback"
              className="form-control"
              placeholder="Constructive feedback on code quality, innovation, architecture..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
