import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, LogIn, UserPlus, Shield } from 'lucide-react';

export const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="public-header">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
        <Trophy size={24} color="var(--primary)" />
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>HackArena</span>
      </Link>

      <nav className="public-nav">
        {user ? (
          <Link
            to={user.role === 'admin' ? '/admin' : '/participant'}
            className="btn btn-primary btn-sm"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">
              <LogIn size={15} />
              Participant Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              <UserPlus size={15} />
              Register
            </Link>
            <Link to="/admin/login" className="btn btn-outline btn-sm" style={{ borderStyle: 'dashed' }}>
              <Shield size={15} />
              Admin
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};
