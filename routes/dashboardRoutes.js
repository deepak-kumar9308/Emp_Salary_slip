const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getDashboard } = require('../controllers/dashboardController');

// Only admin and hr can access the main dashboard for now (employees have their own view logic in the frontend)
router.get('/', protect, authorize('admin', 'hr'), getDashboard);

module.exports = router;
