const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hackarena_jwt_secure_key_2026_super_secret_hash_change_in_production';

/**
 * Authentication middleware to verify JWT from HTTP-only cookie or Bearer header
 */
const authenticate = (req, res, next) => {
  let token = req.cookies?.token;

  // Fallback to Authorization header if provided (useful for API testing)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
};

/**
 * Role-based authorization middleware for Admin endpoints
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required.'
    });
  }
  next();
};

/**
 * Role-based authorization middleware for Participant endpoints
 */
const requireParticipant = (req, res, next) => {
  if (!req.user || req.user.role !== 'participant') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Participant privileges required.'
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireParticipant,
  JWT_SECRET
};
