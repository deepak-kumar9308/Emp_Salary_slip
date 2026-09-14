const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
    getInsights, getEmployeeInsights, getForecast
} = require('../controllers/insightsController');

router.use(protect);

// Only admin and hr can view general insights and forecasts
router.get('/', authorize('admin', 'hr'), getInsights);
router.get('/forecast', authorize('admin', 'hr'), getForecast);

// Employees can view their own insights. HR/Admin can view any.
router.get('/employee', getEmployeeInsights);
router.get('/employee/:employeeId', getEmployeeInsights);

module.exports = router;
