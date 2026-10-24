const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticate, requireParticipant, requireAdmin } = require('../middleware/auth');

// Participant endpoints
router.post('/', authenticate, requireParticipant, teamController.createTeam);
router.get('/my', authenticate, requireParticipant, teamController.getMyTeams);
router.get('/admin/all', authenticate, requireAdmin, teamController.getAllTeamsAdmin);
router.get('/:id', authenticate, teamController.getTeamById);
router.post('/:id/members', authenticate, requireParticipant, teamController.addMember);
router.delete('/:id', authenticate, teamController.deleteTeam);

module.exports = router;

