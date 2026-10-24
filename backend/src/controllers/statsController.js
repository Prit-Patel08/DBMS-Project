const pool = require('../config/db');

/**
 * Get deterministic leaderboard rankings for a hackathon
 */
const getHackathonLeaderboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify hackathon exists
    const [hRows] = await pool.query(
      'SELECT hackathon_id, title, status FROM hackathons WHERE hackathon_id = ?',
      [id]
    );

    if (hRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hackathon not found.' });
    }

    const query = `
      SELECT 
        DENSE_RANK() OVER (ORDER BY s.score DESC, s.submitted_at ASC) AS rank_position,
        t.team_id,
        t.team_name,
        s.submission_id,
        s.project_title,
        s.description,
        s.github_link,
        s.score,
        s.submitted_at,
        a.name AS evaluated_by,
        (
          SELECT p.name 
          FROM team_members tm 
          JOIN participants p ON tm.participant_id = p.participant_id 
          WHERE tm.team_id = t.team_id AND tm.role = 'Leader' 
          LIMIT 1
        ) AS leader_name
      FROM submissions s
      JOIN teams t ON s.team_id = t.team_id
      JOIN admins a ON s.evaluated_by = a.admin_id
      WHERE t.hackathon_id = ? AND s.status = 'Evaluated'
      ORDER BY rank_position ASC, s.score DESC, s.submitted_at ASC
    `;

    const [rankings] = await pool.query(query, [id]);

    return res.json({
      success: true,
      hackathon: hRows[0],
      leaderboard: rankings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get comprehensive analytics for Admin Dashboard
 */
const getAdminDashboardStats = async (req, res, next) => {
  try {
    const [statsRows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM hackathons) AS total_hackathons,
        (SELECT COUNT(*) FROM participants) AS total_participants,
        (SELECT COUNT(*) FROM teams) AS total_teams,
        (SELECT COUNT(*) FROM submissions) AS total_submissions,
        (SELECT COUNT(*) FROM submissions WHERE status = 'Pending') AS pending_submissions,
        (SELECT COUNT(*) FROM submissions WHERE status = 'Evaluated') AS evaluated_submissions,
        (SELECT ROUND(AVG(score), 2) FROM submissions WHERE status = 'Evaluated') AS average_score
    `);

    // Top hackathons by participation
    const [hackathonStats] = await pool.query(`
      SELECT 
        h.hackathon_id,
        h.title,
        h.status,
        COUNT(DISTINCT t.team_id) AS total_teams,
        COUNT(DISTINCT s.submission_id) AS total_submissions,
        ROUND(AVG(s.score), 2) AS average_score
      FROM hackathons h
      LEFT JOIN teams t ON h.hackathon_id = t.hackathon_id
      LEFT JOIN submissions s ON t.team_id = s.team_id
      GROUP BY h.hackathon_id
      ORDER BY total_teams DESC
      LIMIT 6
    `);

    // Recent 5 submissions
    const [recentSubmissions] = await pool.query(`
      SELECT 
        s.submission_id,
        s.project_title,
        s.status,
        s.score,
        s.submitted_at,
        t.team_name,
        h.title AS hackathon_title
      FROM submissions s
      JOIN teams t ON s.team_id = t.team_id
      JOIN hackathons h ON t.hackathon_id = h.hackathon_id
      ORDER BY s.submitted_at DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        summary: statsRows[0],
        hackathons: hackathonStats,
        recent_submissions: recentSubmissions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHackathonLeaderboard,
  getAdminDashboardStats
};
