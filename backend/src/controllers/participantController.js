const pool = require('../config/db');

/**
 * Get all participants (Admin only)
 * Password hashes are strictly omitted from the projection.
 */
const getAllParticipants = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        p.participant_id,
        p.name,
        p.email,
        p.college,
        p.phone,
        p.created_at,
        COUNT(DISTINCT tm.team_id) AS teams_joined
      FROM participants p
      LEFT JOIN team_members tm ON p.participant_id = tm.participant_id
      GROUP BY p.participant_id
      ORDER BY p.name ASC
    `;
    const [rows] = await pool.query(query);
    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllParticipants
};
