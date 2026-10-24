import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { Plus, Edit2, Trash2, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

export const AdminHackathons = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forceDeleteTarget, setForceDeleteTarget] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedId, setSelectedId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    status: 'Upcoming'
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHackathons = async () => {
    try {
      const res = await api.getHackathons();
      if (res.success) {
        setHackathons(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load hackathons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      registration_deadline: '',
      status: 'Upcoming'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (h) => {
    setModalMode('edit');
    setSelectedId(h.hackathon_id);
    setFormData({
      title: h.title,
      description: h.description || '',
      start_date: h.start_date,
      end_date: h.end_date,
      registration_deadline: h.registration_deadline,
      status: h.status
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    // Validation
    if (formData.registration_deadline > formData.start_date) {
      setModalError('Registration deadline cannot be later than the start date.');
      return;
    }
    if (formData.start_date > formData.end_date) {
      setModalError('End date cannot be earlier than the start date.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await api.createHackathon(formData);
        setSuccess('Hackathon created successfully.');
      } else {
        await api.updateHackathon(selectedId, formData);
        setSuccess('Hackathon updated successfully.');
      }
      setIsModalOpen(false);
      fetchHackathons();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to save hackathon.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete hackathon "${title}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    setForceDeleteTarget(null);

    try {
      await api.deleteHackathon(id);
      setSuccess(`Hackathon "${title}" deleted successfully.`);
      fetchHackathons();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete hackathon. Dependent records may exist.');
      if (err.data?.hasTeams || err.message?.includes('Foreign Key RESTRICT')) {
        setForceDeleteTarget({
          id,
          title: err.data?.hackathonTitle || title,
          count: err.data?.teamCount || 1
        });
      }
      setTimeout(() => setError(''), 8000);
    }
  };

  const handleForceCascadeDelete = async (id, title) => {
    if (!window.confirm(`WARNING: Are you absolutely sure?\n\nThis will permanently delete hackathon "${title}" along with ALL its registered teams, team members, and project submissions.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await api.deleteHackathon(id, true); // cascade = true
      setSuccess(res.message || `Hackathon "${title}" and all its dependent records were deleted successfully.`);
      setForceDeleteTarget(null);
      fetchHackathons();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to cascade delete hackathon.');
      setTimeout(() => setError(''), 6000);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hackathon Management</h1>
          <p className="page-subtitle">Schedule, update, and manage hackathon events</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={16} /> Create Hackathon
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{error}</div>
        </div>
      )}

      {forceDeleteTarget && (
        <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'flex-start', background: '#fff1f2', borderColor: '#fca5a5' }}>
          <div style={{ fontWeight: 600, color: '#9f1239' }}>
            Admin Override: Force Cascade Deletion
          </div>
          <div style={{ fontSize: '0.85rem', color: '#881337', lineHeight: 1.5 }}>
            Hackathon "<strong>{forceDeleteTarget.title}</strong>" contains <strong>{forceDeleteTarget.count}</strong> registered team(s).
            Would you like to force delete this hackathon along with all its teams, members, and project submissions?
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
            <button
              onClick={() => handleForceCascadeDelete(forceDeleteTarget.id, forceDeleteTarget.title)}
              className="btn btn-danger btn-sm"
              style={{ fontWeight: 600 }}
            >
              <Trash2 size={13} /> Force Delete Hackathon &amp; All Teams
            </button>
            <button
              onClick={() => setForceDeleteTarget(null)}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <div>{success}</div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title & Description</th>
                <th>Status</th>
                <th>Dates</th>
                <th>Register By</th>
                <th>Teams</th>
                <th>Submissions</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading hackathons...</td>
                </tr>
              ) : hackathons.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No hackathons found.</td>
                </tr>
              ) : (
                hackathons.map((h) => (
                  <tr key={h.hackathon_id}>
                    <td>#{h.hackathon_id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{h.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {h.description || 'No description'}
                      </div>
                    </td>
                    <td><Badge status={h.status} /></td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {h.start_date} <br />
                      <span style={{ color: 'var(--text-muted)' }}>to {h.end_date}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {h.registration_deadline}
                    </td>
                    <td>{h.total_teams}</td>
                    <td>{h.total_submissions}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => openEditModal(h)}
                          className="btn btn-outline btn-sm"
                          title="Edit Hackathon"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(h.hackathon_id, h.title)}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)' }}
                          title="Delete Hackathon"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create New Hackathon' : 'Edit Hackathon Details'}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              form="hackathon-form"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Hackathon' : 'Save Changes'}
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

        <form id="hackathon-form" onSubmit={handleModalSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. AI Innovation Sprint 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Overview of hackathon themes and goals..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Registration Deadline *</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.registration_deadline}
                onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
              />
              <span className="form-hint">Must be &le; Start Date</span>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
