const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
    getDesignations, getDesignation, createDesignation, updateDesignation, deleteDesignation
} = require('../controllers/designationController');

router.use(protect);

router.get('/', getDesignations);
router.get('/:id', getDesignation);

// Only admin and hr can modify designations
router.use(authorize('admin', 'hr'));
router.post('/', createDesignation);
router.put('/:id', updateDesignation);
router.delete('/:id', deleteDesignation);

module.exports = router;
