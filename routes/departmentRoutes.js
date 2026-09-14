const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
    getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment
} = require('../controllers/departmentController');

router.use(protect);

router.get('/', getDepartments);
router.get('/:id', getDepartment);

// Only admin and hr can modify departments
router.use(authorize('admin', 'hr'));
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

module.exports = router;
