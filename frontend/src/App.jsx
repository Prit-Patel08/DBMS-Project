import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminLogin } from './pages/AdminLogin';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminHackathons } from './pages/admin/AdminHackathons';
import { AdminParticipants } from './pages/admin/AdminParticipants';
import { AdminTeams } from './pages/admin/AdminTeams';
import { AdminSubmissions } from './pages/admin/AdminSubmissions';
import { AdminLeaderboard } from './pages/admin/AdminLeaderboard';

// Participant Pages
import { ParticipantLayout } from './pages/participant/ParticipantLayout';
import { ParticipantDashboard } from './pages/participant/ParticipantDashboard';
import { ParticipantHackathons } from './pages/participant/ParticipantHackathons';
import { ParticipantTeams } from './pages/participant/ParticipantTeams';
import { ParticipantSubmissions } from './pages/participant/ParticipantSubmissions';
import { ParticipantResults } from './pages/participant/ParticipantResults';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/results/:id" element={<ParticipantResults />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="hackathons" element={<AdminHackathons />} />
            <Route path="participants" element={<AdminParticipants />} />
            <Route path="teams" element={<AdminTeams />} />
            <Route path="submissions" element={<AdminSubmissions />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
          </Route>

          {/* Participant Protected Routes */}
          <Route
            path="/participant"
            element={
              <ProtectedRoute requiredRole="participant">
                <ParticipantLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ParticipantDashboard />} />
            <Route path="hackathons" element={<ParticipantHackathons />} />
            <Route path="teams" element={<ParticipantTeams />} />
            <Route path="submissions" element={<ParticipantSubmissions />} />
            <Route path="results" element={<ParticipantResults />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
