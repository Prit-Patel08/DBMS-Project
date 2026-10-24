const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Admin-only listing of participants
router.get('/', authenticate, requireAdmin, participantController.getAllParticipants);

module.exports = router;
