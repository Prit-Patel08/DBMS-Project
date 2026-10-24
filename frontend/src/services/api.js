const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Universal fetch wrapper ensuring credentials (cookies) are sent
 */
const request = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include' // Sends HTTP-only auth cookies
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  adminLogin: (body) => request('/auth/admin/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me', { method: 'GET' }),

  // Hackathons
  getHackathons: () => request('/hackathons', { method: 'GET' }),
  getHackathonById: (id) => request(`/hackathons/${id}`, { method: 'GET' }),
  createHackathon: (body) => request('/hackathons', { method: 'POST', body }),
  updateHackathon: (id, body) => request(`/hackathons/${id}`, { method: 'PUT', body }),
  deleteHackathon: (id, cascade = false) => request(`/hackathons/${id}${cascade ? '?cascade=true' : ''}`, { method: 'DELETE' }),
  getLeaderboard: (id) => request(`/hackathons/${id}/leaderboard`, { method: 'GET' }),

  // Participants
  getParticipants: () => request('/participants', { method: 'GET' }),

  // Teams
  createTeam: (body) => request('/teams', { method: 'POST', body }),
  getMyTeams: () => request('/teams/my', { method: 'GET' }),
  getTeamById: (id) => request(`/teams/${id}`, { method: 'GET' }),
  addTeamMember: (teamId, body) => request(`/teams/${teamId}/members`, { method: 'POST', body }),
  getAllTeamsAdmin: () => request('/teams/admin/all', { method: 'GET' }),
  deleteTeam: (id) => request(`/teams/${id}`, { method: 'DELETE' }),

  // Submissions
  createSubmission: (body) => request('/submissions', { method: 'POST', body }),
  updateSubmission: (id, body) => request(`/submissions/${id}`, { method: 'PUT', body }),
  getMySubmissions: () => request('/submissions/my', { method: 'GET' }),
  getAllSubmissionsAdmin: () => request('/submissions/admin', { method: 'GET' }),
  evaluateSubmission: (id, body) => request(`/submissions/admin/${id}/evaluate`, { method: 'PUT', body }),

  // Analytics
  getAdminDashboard: () => request('/admin/dashboard', { method: 'GET' })
};
