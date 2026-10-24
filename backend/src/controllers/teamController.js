const pool = require('../config/db');

/**
 * Create a team and assign the creator as Leader in an ACID transaction
 */
const createTeam = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { team_name, hackathon_id } = req.body;
    const participantId = req.user.id;

    if (!team_name || !hackathon_id) {
      return res.status(400).json({
        success: false,
        message: 'Team name and hackathon ID are required.'
      });
    }

    // 1. Verify hackathon exists and registration deadline has not passed
    const [hackathonRows] = await connection.query(
      `SELECT hackathon_id, title, registration_deadline, status, CURRENT_DATE() AS today 
       FROM hackathons WHERE hackathon_id = ?`,
      [hackathon_id]
    );

    if (hackathonRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hackathon not found.' });
    }

    const hackathon = hackathonRows[0];
    if (hackathon.today > hackathon.registration_deadline) {
      return res.status(400).json({
        success: false,
        message: `Registration deadline (${hackathon.registration_deadline}) has passed for this hackathon.`
      });
    }

    // 2. Check if the participant is already enrolled in any team for this hackathon
    const [existingParticipation] = await connection.query(
      `SELECT t.team_name 
       FROM team_members tm 
       JOIN teams t ON tm.team_id = t.team_id 
       WHERE tm.participant_id = ? AND t.hackathon_id = ?`,
      [participantId, hackathon_id]
    );

    if (existingParticipation.length > 0) {
      return res.status(409).json({
        success: false,
        message: `You are already a member of team "${existingParticipation[0].team_name}" for this hackathon. A participant may join only one team per hackathon.`
      });
    }

    // 3. Begin transaction
    await connection.beginTransaction();

    // Insert team
    const [teamResult] = await connection.query(
      `INSERT INTO teams (team_name, hackathon_id) VALUES (?, ?)`,
      [team_name.trim(), hackathon_id]
    );

    const teamId = teamResult.insertId;

    // Insert creator as Leader
    await connection.query(
      `INSERT INTO team_members (team_id, participant_id, role) VALUES (?, ?, 'Leader')`,
      [teamId, participantId]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Team created successfully with you as the Team Leader.',
      team: {
        team_id: teamId,
        team_name: team_name.trim(),
        hackathon_id,
        role: 'Leader'
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Get all teams that the logged-in participant belongs to
 */
const getMyTeams = async (req, res, next) => {
  try {
    const participantId = req.user.id;

    const query = `
      SELECT 
        t.team_id,
        t.team_name,
        t.created_at,
        tm_user.role AS my_role,
        h.hackathon_id,
        h.title AS hackathon_title,
        h.status AS hackathon_status,
        h.registration_deadline,
        h.start_date,
        h.end_date,
        s.submission_id,
        s.project_title,
        s.status AS submission_status,
        s.score,
        s.feedback
      FROM team_members tm_user
      JOIN teams t ON tm_user.team_id = t.team_id
      JOIN hackathons h ON t.hackathon_id = h.hackathon_id
      LEFT JOIN submissions s ON t.team_id = s.team_id
      WHERE tm_user.participant_id = ?
      ORDER BY t.created_at DESC
    `;

    const [teams] = await pool.query(query, [participantId]);

    // For each team, fetch all members
    for (const team of teams) {
      const [members] = await pool.query(
        `SELECT 
          p.participant_id,
          p.name,
          p.email,
          p.college,
          tm.role,
          tm.joined_at
         FROM team_members tm
         JOIN participants p ON tm.participant_id = p.participant_id
         WHERE tm.team_id = ?
         ORDER BY CASE tm.role WHEN 'Leader' THEN 1 ELSE 2 END, tm.joined_at ASC`,
        [team.team_id]
      );
      team.members = members;
    }

    return res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

/**
 * Get details of a single team by ID
 */
const getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [teamRows] = await pool.query(
      `SELECT 
        t.team_id,
        t.team_name,
        t.created_at,
        h.hackathon_id,
        h.title AS hackathon_title,
        h.status AS hackathon_status,
        h.registration_deadline,
        s.submission_id,
        s.project_title,
        s.description AS project_description,
        s.github_link,
        s.submitted_at,
        s.status AS submission_status,
        s.score,
        s.feedback
       FROM teams t
       JOIN hackathons h ON t.hackathon_id = h.hackathon_id
       LEFT JOIN submissions s ON t.team_id = s.team_id
       WHERE t.team_id = ?`,
      [id]
    );

    if (teamRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const team = teamRows[0];

    // Fetch members
    const [members] = await pool.query(
      `SELECT 
        p.participant_id,
        p.name,
        p.email,
        p.college,
        tm.role,
        tm.joined_at
       FROM team_members tm
       JOIN participants p ON tm.participant_id = p.participant_id
       WHERE tm.team_id = ?
       ORDER BY CASE tm.role WHEN 'Leader' THEN 1 ELSE 2 END, tm.joined_at ASC`,
      [id]
    );
    team.members = members;

    return res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a member to a team by email (Leader only)
 */
const addMember = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params; // team_id
    const { email } = req.body;
    const requesterId = req.user.id;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Participant email is required.' });
    }

    // 1. Verify requester is Leader of this team
    const [roleRows] = await connection.query(
      'SELECT role FROM team_members WHERE team_id = ? AND participant_id = ?',
      [id, requesterId]
    );

    if (roleRows.length === 0 || roleRows[0].role !== 'Leader') {
      return res.status(403).json({
        success: false,
        message: 'Only the designated Team Leader can add members to the team.'
      });
    }

    // 2. Fetch team & hackathon deadline info
    const [teamRows] = await connection.query(
      `SELECT t.hackathon_id, h.registration_deadline, CURRENT_DATE() AS today
       FROM teams t
       JOIN hackathons h ON t.hackathon_id = h.hackathon_id
       WHERE t.team_id = ?`,
      [id]
    );

    if (teamRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const teamInfo = teamRows[0];
    if (teamInfo.today > teamInfo.registration_deadline) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add members: The registration deadline for this hackathon has passed.'
      });
    }

    // 3. Find candidate participant by email
    const [participantRows] = await connection.query(
      'SELECT participant_id, name, email FROM participants WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (participantRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No registered participant was found with this email address.'
      });
    }

    const newParticipant = participantRows[0];

    // 4. Check if already in this team
    const [inTeamRows] = await connection.query(
      'SELECT 1 FROM team_members WHERE team_id = ? AND participant_id = ?',
      [id, newParticipant.participant_id]
    );

    if (inTeamRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Participant is already a member of this team.'
      });
    }

    // 5. Check if already in any team for this hackathon
    const [inHackathonRows] = await connection.query(
      `SELECT t.team_name 
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.team_id
       WHERE tm.participant_id = ? AND t.hackathon_id = ?`,
      [newParticipant.participant_id, teamInfo.hackathon_id]
    );

    if (inHackathonRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Participant is already enrolled in team "${inHackathonRows[0].team_name}" for this hackathon.`
      });
    }

    // 6. Insert new member as 'Member'
    await connection.query(
      `INSERT INTO team_members (team_id, participant_id, role) VALUES (?, ?, 'Member')`,
      [id, newParticipant.participant_id]
    );

    return res.status(201).json({
      success: true,
      message: `Successfully added ${newParticipant.name} to the team.`,
      member: {
        participant_id: newParticipant.participant_id,
        name: newParticipant.name,
        email: newParticipant.email,
        role: 'Member'
      }
    });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Get all teams for Admin view
 */
const getAllTeamsAdmin = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        t.team_id,
        t.team_name,
        t.created_at,
        h.hackathon_id,
        h.title AS hackathon_title,
        h.status AS hackathon_status,
        (
          SELECT p.name 
          FROM team_members tm 
          JOIN participants p ON tm.participant_id = p.participant_id 
          WHERE tm.team_id = t.team_id AND tm.role = 'Leader' 
          LIMIT 1
        ) AS leader_name,
        (
          SELECT p.email 
          FROM team_members tm 
          JOIN participants p ON tm.participant_id = p.participant_id 
          WHERE tm.team_id = t.team_id AND tm.role = 'Leader' 
          LIMIT 1
        ) AS leader_email,
        COUNT(DISTINCT tm.participant_id) AS member_count,
        s.submission_id,
        s.project_title,
        s.status AS submission_status,
        s.score
      FROM teams t
      JOIN hackathons h ON t.hackathon_id = h.hackathon_id
      LEFT JOIN team_members tm ON t.team_id = tm.team_id
      LEFT JOIN submissions s ON t.team_id = s.team_id
      GROUP BY t.team_id
      ORDER BY h.hackathon_id ASC, t.team_id ASC
    `;

    const [teams] = await pool.query(query);

    // Attach members list
    for (const team of teams) {
      const [members] = await pool.query(
        `SELECT p.participant_id, p.name, p.email, tm.role 
         FROM team_members tm 
         JOIN participants p ON tm.participant_id = p.participant_id 
         WHERE tm.team_id = ?`,
        [team.team_id]
      );
      team.members = members;
    }

    return res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete / Disband a team (Leader or Admin only)
 * Cascades to team_members and submissions automatically via MySQL FK constraints.
 */
const deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Fetch team details
    const [teamRows] = await pool.query(
      'SELECT team_id, team_name, hackathon_id FROM teams WHERE team_id = ?',
      [id]
    );

    if (teamRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const team = teamRows[0];

    // 2. Authorization check: must be Admin OR Leader of this team
    if (userRole !== 'admin') {
      const [roleRows] = await pool.query(
        'SELECT role FROM team_members WHERE team_id = ? AND participant_id = ?',
        [id, userId]
      );

      if (roleRows.length === 0 || roleRows[0].role !== 'Leader') {
        return res.status(403).json({
          success: false,
          message: 'Only the designated Team Leader can disband/delete the team.'
        });
      }
    }

    // 3. Check if team has an already evaluated submission
    const [subRows] = await pool.query(
      'SELECT submission_id, status FROM submissions WHERE team_id = ?',
      [id]
    );

    if (subRows.length > 0 && subRows[0].status === 'Evaluated' && userRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete team: The project submission has already been evaluated by administrators.'
      });
    }

    // 4. Delete the team (cascades to team_members and submissions via MySQL FK constraints)
    await pool.query('DELETE FROM teams WHERE team_id = ?', [id]);

    return res.json({
      success: true,
      message: `Team "${team.team_name}" has been successfully disbanded and deleted.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  getMyTeams,
  getTeamById,
  addMember,
  getAllTeamsAdmin,
  deleteTeam
};

