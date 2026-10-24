const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Register a new participant
 */
const registerParticipant = async (req, res, next) => {
  try {
    const { name, email, password, college, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if participant already exists
    const [existing] = await pool.query(
      'SELECT participant_id FROM participants WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A participant with this email address is already registered.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO participants (name, email, password_hash, college, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), passwordHash, college ? college.trim() : null, phone ? phone.trim() : null]
    );

    const participantId = result.insertId;

    // Generate token
    const token = jwt.sign(
      {
        id: participantId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: 'participant'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Participant registration successful.',
      user: {
        id: participantId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        college: college ? college.trim() : null,
        phone: phone ? phone.trim() : null,
        role: 'participant'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login for Participants
 */
const loginParticipant = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const [rows] = await pool.query(
      'SELECT participant_id, name, email, password_hash, college, phone FROM participants WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        id: user.participant_id,
        email: user.email,
        name: user.name,
        role: 'participant'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.participant_id,
        name: user.name,
        email: user.email,
        college: user.college,
        phone: user.phone,
        role: 'participant'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login for Administrators (No public registration endpoint)
 */
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin email and password are required.'
      });
    }

    const [rows] = await pool.query(
      'SELECT admin_id, name, email, password_hash FROM admins WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const token = jwt.sign(
      {
        id: admin.admin_id,
        email: admin.email,
        name: admin.name,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Admin authentication successful.',
      user: {
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
const logout = (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.json({
    success: true,
    message: 'Successfully logged out.'
  });
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (req.user.role === 'admin') {
      const [rows] = await pool.query(
        'SELECT admin_id AS id, name, email, created_at FROM admins WHERE admin_id = ?',
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
      }
      return res.json({ success: true, user: { ...rows[0], role: 'admin' } });
    } else {
      const [rows] = await pool.query(
        'SELECT participant_id AS id, name, email, college, phone, created_at FROM participants WHERE participant_id = ?',
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Participant not found.' });
      }
      return res.json({ success: true, user: { ...rows[0], role: 'participant' } });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerParticipant,
  loginParticipant,
  loginAdmin,
  logout,
  getMe
};
