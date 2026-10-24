const pool = require('../config/db');

/**
 * Submit a project for a team (Leader only)
 */
const createSubmission = async (req, res, next) => {
  try {
    const { team_id, project_title, description, github_link } = req.body;
    const participantId = req.user.id;

    if (!team_id || !project_title) {
      return res.status(400).json({
        success: false,
        message: 'Team ID and project title are required.'
      });
    }

    // 1. Verify user is the Leader of this team
    const [roleRows] = await pool.query(
      'SELECT role FROM team_members WHERE team_id = ? AND participant_id = ?',
      [team_id, participantId]
    );

    if (roleRows.length === 0 || roleRows[0].role !== 'Leader') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the designated Team Leader may submit a project for the team.'
      });
    }

    // 2. Check hackathon lifecycle
    const [hackathonRows] = await pool.query(
      `SELECT h.title, h.status, h.end_date, CURRENT_DATE() AS today 
       FROM teams t 
       JOIN hackathons h ON t.hackathon_id = h.hackathon_id 
       WHERE t.team_id = ?`,
      [team_id]
    );

    if (hackathonRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team or hackathon not found.' });
    }

    const h = hackathonRows[0];
    if (h.status === 'Completed' || h.today > h.end_date) {
      return res.status(400).json({
        success: false,
        message: `Submissions are closed for this hackathon (Ended on ${h.end_date}).`
      });
    }

    // 3. Check for existing submission
    const [existing] = await pool.query(
      'SELECT submission_id FROM submissions WHERE team_id = ?',
      [team_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This team has already submitted a project. Use update to modify details.'
      });
    }

    // 4. Insert submission with status 'Pending'
    const [result] = await pool.query(
      `INSERT INTO submissions (team_id, project_title, description, github_link, status)
       VALUES (?, ?, ?, ?, 'Pending')`,
      [team_id, project_title.trim(), description ? description.trim() : null, github_link ? github_link.trim() : null]
    );

    return res.status(201).json({
      success: true,
      message: 'Project submitted successfully for evaluation.',
      submission_id: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing submission (Leader only; must be Pending)
 */
const updateSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { project_title, description, github_link } = req.body;
    const participantId = req.user.id;

    // 1. Fetch submission and verify ownership & status
    const [rows] = await pool.query(
      `SELECT s.submission_id, s.team_id, s.status, tm.role 
       FROM submissions s 
       LEFT JOIN team_members tm ON s.team_id = tm.team_id AND tm.participant_id = ? 
       WHERE s.submission_id = ?`,
      [participantId, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const sub = rows[0];

    if (sub.role !== 'Leader') {
      return res.status(403).json({
        success: false,
        message: 'Only the team leader may edit this submission.'
      });
    }

    if (sub.status === 'Evaluated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify project details: The submission has already been evaluated by an administrator.'
      });
    }

    await pool.query(
      `UPDATE submissions 
       SET project_title = ?, description = ?, github_link = ? 
       WHERE submission_id = ?`,
      [
        project_title ? project_title.trim() : sub.project_title,
        description !== undefined ? (description ? description.trim() : null) : sub.description,
        github_link !== undefined ? (github_link ? github_link.trim() : null) : sub.github_link,
        id
      ]
    );

    return res.json({
      success: true,
      message: 'Submission updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get submissions for teams the logged-in participant belongs to
 */
const getMySubmissions = async (req, res, next) => {
  try {
    const participantId = req.user.id;

    const query = `
      SELECT 
        s.submission_id,
        s.project_title,
        s.description,
        s.github_link,
        s.submitted_at,
        s.score,
        s.feedback,
        s.status,
        t.team_id,
        t.team_name,
        tm.role AS my_role,
        h.hackathon_id,
        h.title AS hackathon_title,
        h.status AS hackathon_status,
        a.name AS evaluator_name
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.team_id
      JOIN submissions s ON t.team_id = s.team_id
      JOIN hackathons h ON t.hackathon_id = h.hackathon_id
      LEFT JOIN admins a ON s.evaluated_by = a.admin_id
      WHERE tm.participant_id = ?
      ORDER BY s.submitted_at DESC
    `;

    const [rows] = await pool.query(query, [participantId]);
    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all submissions (Admin only)
 */
const getAllSubmissionsAdmin = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        s.submission_id,
        s.project_title,
        s.description,
        s.github_link,
        s.submitted_at,
        s.score,
        s.feedback,
        s.status,
        t.team_id,
        t.team_name,
        h.hackathon_id,
        h.title AS hackathon_title,
        (
          SELECT p.name 
          FROM team_members tm 
          JOIN participants p ON tm.participant_id = p.participant_id 
          WHERE tm.team_id = t.team_id AND tm.role = 'Leader' 
          LIMIT 1
        ) AS leader_name,
        a.admin_id AS evaluator_id,
        a.name AS evaluator_name
      FROM submissions s
      JOIN teams t ON s.team_id = t.team_id
      JOIN hackathons h ON t.hackathon_id = h.hackathon_id
      LEFT JOIN admins a ON s.evaluated_by = a.admin_id
      ORDER BY 
        CASE s.status WHEN 'Pending' THEN 1 ELSE 2 END,
        s.submitted_at DESC
    `;

    const [rows] = await pool.query(query);
    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Evaluate a submission (Admin only)
 * Uses stored procedure sp_evaluate_submission to execute evaluation transactionally
 */
const evaluateSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;
    const adminId = req.user.id;

    if (score === undefined || score === null || isNaN(score)) {
      return res.status(400).json({
        success: false,
        message: 'A valid numeric score is required.'
      });
    }

    const numScore = parseFloat(score);
    if (numScore < 0.00 || numScore > 100.00) {
      return res.status(400).json({
        success: false,
        message: 'Score must be between 0.00 and 100.00.'
      });
    }

    // Call stored procedure sp_evaluate_submission
    await pool.query(
      'CALL sp_evaluate_submission(?, ?, ?, ?)',
      [id, adminId, numScore, feedback ? feedback.trim() : null]
    );

    return res.json({
      success: true,
      message: 'Submission evaluated successfully.',
      evaluation: {
        submission_id: parseInt(id, 10),
        score: numScore,
        feedback: feedback ? feedback.trim() : null,
        status: 'Evaluated',
        evaluated_by: adminId
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubmission,
  updateSubmission,
  getMySubmissions,
  getAllSubmissionsAdmin,
  evaluateSubmission
};
