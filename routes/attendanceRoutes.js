const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
    getAttendance, markAttendance, updateAttendance, deleteAttendance, getMonthlyReport, bulkMarkAttendance
} = require('../controllers/attendanceController');

router.use(protect);

router.get('/', getAttendance);
router.get('/monthly-report', getMonthlyReport);

// Any authenticated user can mark attendance (typically they'd mark their own)
// In a real system, you might restrict who can mark for whom, but for this project we'll allow it and rely on the UI.
router.post('/', markAttendance);

// HR and Admin can update, delete, and bulk mark
router.use(authorize('admin', 'hr'));
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);
router.post('/bulk', bulkMarkAttendance);

module.exports = router;
