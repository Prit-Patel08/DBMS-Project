const express = require('express');
const router = express.Router();
const hackathonController = require('../controllers/hackathonController');
const statsController = require('../controllers/statsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public endpoints
router.get('/', hackathonController.getAllHackathons);
router.get('/:id', hackathonController.getHackathonById);
router.get('/:id/leaderboard', statsController.getHackathonLeaderboard);

// Admin-only management endpoints
router.post('/', authenticate, requireAdmin, hackathonController.createHackathon);
router.put('/:id', authenticate, requireAdmin, hackathonController.updateHackathon);
router.delete('/:id', authenticate, requireAdmin, hackathonController.deleteHackathon);

module.exports = router;
