const SalarySlip = require('../models/SalarySlip');
const Payroll = require('../models/Payroll');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getSalarySlips = async (req, res, next) => {
    try {
        const { employee, month, year, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (req.user.role === 'employee') filter.employee = req.user.employee;
        else if (employee) filter.employee = employee;
        if (month) filter.month = Number(month);
        if (year)  filter.year  = Number(year);

        const skip = (Number(page) - 1) * Number(limit);
        const total = await SalarySlip.countDocuments(filter);
        const slips = await SalarySlip.find(filter)
            .populate({ path: 'employee', populate: [{ path: 'department', select: 'name' }, { path: 'designation', select: 'name' }] })
            .populate('payroll')
            .sort({ year: -1, month: -1 })
            .skip(skip)
            .limit(Number(limit));

        sendSuccess(res, 200, 'Salary slips fetched.', {
            slips,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
        });
    } catch (error) { next(error); }
};

const getSalarySlip = async (req, res, next) => {
    try {
        const slip = await SalarySlip.findById(req.params.id)
            .populate({ path: 'employee', populate: [{ path: 'department', select: 'name' }, { path: 'designation', select: 'name' }] })
            .populate('payroll')
            .populate('generatedBy', 'name');

        if (!slip) return sendError(res, 404, 'Salary slip not found.');
        if (req.user.role === 'employee' && String(slip.employee._id) !== String(req.user.employee)) {
            return sendError(res, 403, 'Access denied.');
        }

        sendSuccess(res, 200, 'Salary slip fetched.', { slip });
    } catch (error) { next(error); }
};

const deleteSalarySlip = async (req, res, next) => {
    try {
        const slip = await SalarySlip.findByIdAndDelete(req.params.id);
        if (!slip) return sendError(res, 404, 'Salary slip not found.');
        sendSuccess(res, 200, 'Salary slip deleted.');
    } catch (error) { next(error); }
};

module.exports = { getSalarySlips, getSalarySlip, deleteSalarySlip };
