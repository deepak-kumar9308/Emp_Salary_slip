const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
    getPayrolls, generatePayroll, getPayroll, updatePayroll, deletePayroll
} = require('../controllers/payrollController');

router.use(protect);

router.get('/', getPayrolls);
router.get('/:id', getPayroll);

// Only admin and hr can generate and modify payrolls
router.use(authorize('admin', 'hr'));
router.post('/generate', generatePayroll);
router.put('/:id', updatePayroll);
router.delete('/:id', deletePayroll);

module.exports = router;
