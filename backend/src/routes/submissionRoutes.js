const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate, requireParticipant, requireAdmin } = require('../middleware/auth');

// Participant endpoints
router.post('/', authenticate, requireParticipant, submissionController.createSubmission);
router.put('/:id', authenticate, requireParticipant, submissionController.updateSubmission);
router.get('/my', authenticate, requireParticipant, submissionController.getMySubmissions);

// Admin endpoints
router.get('/admin', authenticate, requireAdmin, submissionController.getAllSubmissionsAdmin);
router.put('/admin/:id/evaluate', authenticate, requireAdmin, submissionController.evaluateSubmission);

module.exports = router;
