const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const SalarySlip = require('../models/SalarySlip');
const { generateSalarySlipPDF } = require('../utils/pdfGenerator');
const { sendError } = require('../utils/responseHelper');
const path = require('path');

// ... existing routes (assume they are required from controller)
const {
    getSalarySlips, getSalarySlip, deleteSalarySlip
} = require('../controllers/salarySlipController');

router.use(protect);

router.get('/', getSalarySlips);
router.get('/:id', getSalarySlip);

// Download PDF Route
router.get('/:id/download', async (req, res, next) => {
    try {
        const slip = await SalarySlip.findById(req.params.id)
            .populate({ path: 'employee', populate: [{ path: 'department', select: 'name' }, { path: 'designation', select: 'name' }] });

        if (!slip) return sendError(res, 404, 'Salary slip not found.');
        if (req.user.role === 'employee' && String(slip.employee._id) !== String(req.user.employee)) {
            return sendError(res, 403, 'Access denied.');
        }

        // If PDF doesn't exist, generate it
        if (!slip.pdfPath) {
            const companyInfo = {
                name: process.env.COMPANY_NAME || 'Company Name',
                address: process.env.COMPANY_ADDRESS || 'Company Address'
            };
            const pdfUrl = await generateSalarySlipPDF(slip, companyInfo);
            if (pdfUrl) {
                slip.pdfPath = pdfUrl;
                slip.isDownloaded = true;
                await slip.save();
            } else {
                return sendError(res, 500, 'Failed to generate PDF.');
            }
        } else {
            slip.isDownloaded = true;
            await slip.save();
        }

        const filePath = path.join(__dirname, '..', slip.pdfPath);
        res.download(filePath);

    } catch (error) { next(error); }
});

// Only admin and hr can delete salary slips
router.use(authorize('admin', 'hr'));
router.delete('/:id', deleteSalarySlip);

module.exports = router;
