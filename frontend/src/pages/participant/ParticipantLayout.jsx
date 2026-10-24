import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  UsersRound, 
  FolderGit2, 
  Trophy, 
  LogOut,
  UserCheck
} from 'lucide-react';

export const ParticipantLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Trophy size={20} />
            <span>HackArena</span>
          </div>
          <span className="sidebar-role-badge" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            Participant
          </span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/participant" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/participant/hackathons" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Browse Hackathons</span>
          </NavLink>

          <NavLink to="/participant/teams" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <UsersRound size={18} />
            <span>My Teams</span>
          </NavLink>

          <NavLink to="/participant/submissions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FolderGit2 size={18} />
            <span>My Submissions</span>
          </NavLink>

          <NavLink to="/participant/results" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Trophy size={18} />
            <span>Results & Ranking</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <span className="user-name">{user?.name || 'Student'}</span>
            <span className="user-email">{user?.email}</span>
            {user?.college && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.college}</span>
            )}
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: '0.25rem' }}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <UserCheck size={16} color="var(--success)" />
            <span>Participant Portal</span>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Welcome, <strong style={{ color: 'var(--text-main)' }}>{user?.name}</strong>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
