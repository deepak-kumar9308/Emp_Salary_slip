const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
    getEmployees, getEmployee, createEmployee,
    updateEmployee, deleteEmployee, hardDeleteEmployee, getEmployeeStats
} = require('../controllers/employeeController');

// Multer config for profile photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'emp-' + unique + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed.'));
    }
});

router.use(protect);

router.get('/stats/summary', authorize('admin', 'hr'), getEmployeeStats);
router.get('/', getEmployees);
router.get('/:id', getEmployee);
router.post('/', authorize('admin', 'hr'), upload.single('profilePhoto'), createEmployee);
router.put('/:id', authorize('admin', 'hr'), upload.single('profilePhoto'), updateEmployee);
router.delete('/:id', authorize('admin', 'hr'), deleteEmployee);
router.delete('/:id/hard', authorize('admin'), hardDeleteEmployee);

module.exports = router;
