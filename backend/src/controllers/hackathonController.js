const pool = require('../config/db');

/**
 * Get all hackathons with counts of teams and submissions
 */
const getAllHackathons = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        h.hackathon_id,
        h.title,
        h.description,
        h.start_date,
        h.end_date,
        h.registration_deadline,
        h.status,
        h.created_at,
        COUNT(DISTINCT t.team_id) AS total_teams,
        COUNT(DISTINCT s.submission_id) AS total_submissions
      FROM hackathons h
      LEFT JOIN teams t ON h.hackathon_id = t.hackathon_id
      LEFT JOIN submissions s ON t.team_id = s.team_id
      GROUP BY h.hackathon_id
      ORDER BY 
        CASE h.status 
          WHEN 'Ongoing' THEN 1 
          WHEN 'Upcoming' THEN 2 
          WHEN 'Completed' THEN 3 
        END,
        h.start_date ASC
    `;
    const [rows] = await pool.query(query);
    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single hackathon details by ID
 */
const getHackathonById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [hackathonRows] = await pool.query(
      `SELECT * FROM hackathons WHERE hackathon_id = ?`,
      [id]
    );

    if (hackathonRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hackathon not found.' });
    }

    const hackathon = hackathonRows[0];

    // Get teams associated with this hackathon
    const [teamRows] = await pool.query(
      `SELECT 
        t.team_id,
        t.team_name,
        t.created_at,
        (SELECT p.name FROM team_members tm JOIN participants p ON tm.participant_id = p.participant_id WHERE tm.team_id = t.team_id AND tm.role = 'Leader' LIMIT 1) AS leader_name,
        COUNT(tm.participant_id) AS member_count,
        s.submission_id,
        s.project_title,
        s.status AS submission_status,
        s.score
       FROM teams t
       LEFT JOIN team_members tm ON t.team_id = tm.team_id
       LEFT JOIN submissions s ON t.team_id = s.team_id
       WHERE t.hackathon_id = ?
       GROUP BY t.team_id
       ORDER BY t.created_at ASC`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...hackathon,
        teams: teamRows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new hackathon (Admin only)
 */
const createHackathon = async (req, res, next) => {
  try {
    const { title, description, start_date, end_date, registration_deadline, status } = req.body;

    if (!title || !start_date || !end_date || !registration_deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, end date, and registration deadline are required.'
      });
    }

    // Date validations
    if (registration_deadline > start_date) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline cannot be later than the hackathon start date.'
      });
    }

    if (start_date > end_date) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
      });
    }

    const validStatuses = ['Upcoming', 'Ongoing', 'Completed'];
    const hackathonStatus = validStatuses.includes(status) ? status : 'Upcoming';

    const [result] = await pool.query(
      `INSERT INTO hackathons (title, description, start_date, end_date, registration_deadline, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title.trim(), description ? description.trim() : null, start_date, end_date, registration_deadline, hackathonStatus]
    );

    return res.status(201).json({
      success: true,
      message: 'Hackathon created successfully.',
      hackathon_id: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing hackathon (Admin only)
 */
const updateHackathon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, start_date, end_date, registration_deadline, status } = req.body;

    const [existing] = await pool.query('SELECT * FROM hackathons WHERE hackathon_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Hackathon not found.' });
    }

    const current = existing[0];
    const newTitle = title !== undefined ? title.trim() : current.title;
    const newDesc = description !== undefined ? (description ? description.trim() : null) : current.description;
    const newStart = start_date || current.start_date;
    const newEnd = end_date || current.end_date;
    const newDeadline = registration_deadline || current.registration_deadline;
    const newStatus = status || current.status;

    // Validate dates
    if (newDeadline > newStart) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline cannot be later than the hackathon start date.'
      });
    }

    if (newStart > newEnd) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
      });
    }

    await pool.query(
      `UPDATE hackathons
       SET title = ?, description = ?, start_date = ?, end_date = ?, registration_deadline = ?, status = ?
       WHERE hackathon_id = ?`,
      [newTitle, newDesc, newStart, newEnd, newDeadline, newStatus, id]
    );

    return res.json({
      success: true,
      message: 'Hackathon updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a hackathon (Admin only)
 * Defaults to RESTRICT if teams are attached to protect integrity.
 * If cascade=true is requested, deletes teams and submissions inside an atomic transaction.
 */
const deleteHackathon = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const isCascade = req.query.cascade === 'true' || req.body?.cascade === true;

    const [existing] = await connection.query('SELECT * FROM hackathons WHERE hackathon_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Hackathon not found.' });
    }

    // Check if teams exist
    const [teamCount] = await connection.query(
      'SELECT COUNT(*) AS count FROM teams WHERE hackathon_id = ?',
      [id]
    );

    const count = teamCount[0].count;

    if (count > 0 && !isCascade) {
      return res.status(409).json({
        success: false,
        hasTeams: true,
        teamCount: count,
        hackathonTitle: existing[0].title,
        message: `Cannot delete hackathon: ${count} team(s) are registered. Delete or reassign teams first (Foreign Key RESTRICT).`
      });
    }

    await connection.beginTransaction();

    if (count > 0 && isCascade) {
      // Deleting teams cascades to team_members and submissions automatically via MySQL FK CASCADE
      await connection.query('DELETE FROM teams WHERE hackathon_id = ?', [id]);
    }

    await connection.query('DELETE FROM hackathons WHERE hackathon_id = ?', [id]);

    await connection.commit();

    return res.json({
      success: true,
      message: count > 0 && isCascade
        ? `Hackathon "${existing[0].title}" and all ${count} registered team(s) deleted successfully.`
        : `Hackathon "${existing[0].title}" deleted successfully.`
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllHackathons,
  getHackathonById,
  createHackathon,
  updateHackathon,
  deleteHackathon
};
