const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/admin/dashboard', authenticate, requireAdmin, statsController.getAdminDashboardStats);

module.exports = router;
