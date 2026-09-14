const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
    getLeaves, applyLeave, updateLeaveStatus, cancelLeave, deleteLeave
} = require('../controllers/leaveController');

router.use(protect);

router.get('/', getLeaves);
router.post('/', applyLeave);
router.put('/:id/cancel', cancelLeave);

// HR and Admin can review and delete leaves
router.use(authorize('admin', 'hr'));
router.put('/:id/status', updateLeaveStatus);
router.delete('/:id', deleteLeave);

module.exports = router;
