import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UsersRound, 
  FolderGit2, 
  Trophy, 
  LogOut,
  Shield
} from 'lucide-react';

export const AdminLayout = () => {
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
          <span className="sidebar-role-badge">Admin</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/hackathons" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Hackathons</span>
          </NavLink>

          <NavLink to="/admin/participants" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Participants</span>
          </NavLink>

          <NavLink to="/admin/teams" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <UsersRound size={18} />
            <span>Teams</span>
          </NavLink>

          <NavLink to="/admin/submissions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FolderGit2 size={18} />
            <span>Submissions</span>
          </NavLink>

          <NavLink to="/admin/leaderboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Trophy size={18} />
            <span>Leaderboard</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <span className="user-name">{user?.name || 'Administrator'}</span>
            <span className="user-email">{user?.email}</span>
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
            <Shield size={16} color="var(--primary)" />
            <span>Admin Console</span>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Logged in as <strong style={{ color: 'var(--text-main)' }}>{user?.name}</strong>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
