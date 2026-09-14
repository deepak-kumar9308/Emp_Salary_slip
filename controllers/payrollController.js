const Payroll = require('../models/Payroll');
const SalarySlip = require('../models/SalarySlip');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { calculateSalaryComponents, applyAttendanceImpact, mergeOverrides, getMonthName } = require('../services/salaryService');
const { sendSalaryGeneratedEmail } = require('../services/emailService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// GET /api/payroll
const getPayrolls = async (req, res, next) => {
    try {
        const { employee, month, year, paymentStatus, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (req.user.role === 'employee') filter.employee = req.user.employee;
        else if (employee) filter.employee = employee;
        if (month) filter.month = Number(month);
        if (year)  filter.year  = Number(year);
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Payroll.countDocuments(filter);
        const payrolls = await Payroll.find(filter)
            .populate('employee', 'firstName lastName employeeId department designation')
            .sort({ year: -1, month: -1 })
            .skip(skip)
            .limit(Number(limit));

        sendSuccess(res, 200, 'Payrolls fetched.', {
            payrolls,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
        });
    } catch (error) { next(error); }
};

// POST /api/payroll/generate  — generate payroll for one or all employees
const generatePayroll = async (req, res, next) => {
    try {
        const { month, year, employeeId, overrides } = req.body;
        if (!month || !year) return sendError(res, 400, 'Month and year are required.');

        const workingDays = 26; // Standard working days per month
        const startDate = new Date(year, month - 1, 1);
        const endDate   = new Date(year, month, 0, 23, 59, 59);

        // Fetch employees (all or specific)
        const empFilter = { status: 'Active' };
        if (employeeId) empFilter._id = employeeId;
        const employees = await Employee.find(empFilter);

        if (!employees.length) return sendError(res, 404, 'No active employees found.');

        const results = [];
        const errors  = [];

        for (const emp of employees) {
            try {
                // Check if payroll already exists
                const existing = await Payroll.findOne({ employee: emp._id, month: Number(month), year: Number(year) });
                if (existing) {
                    errors.push({ employee: emp.employeeId, message: 'Payroll already generated.' });
                    continue;
                }

                // Get attendance for month
                const attendanceRecords = await Attendance.find({
                    employee: emp._id, date: { $gte: startDate, $lte: endDate }
                });

                const presentDays = attendanceRecords.filter(a =>
                    ['Present', 'Work From Home', 'Half Day'].includes(a.status)
                ).length;
                const absentDays = attendanceRecords.filter(a => a.status === 'Absent').length;
                const lateCount  = attendanceRecords.filter(a => a.status === 'Late').length;

                // Get unpaid leave days
                const unpaidLeaves = await Leave.find({
                    employee: emp._id,
                    leaveType: 'Unpaid Leave',
                    status: 'Approved',
                    startDate: { $gte: startDate },
                    endDate:   { $lte: endDate }
                });
                const unpaidLeaveDays = unpaidLeaves.reduce((acc, l) => acc + l.numberOfDays, 0);

                // Calculate salary
                let components = calculateSalaryComponents(emp.basicSalary);
                components = applyAttendanceImpact(components, workingDays, presentDays, unpaidLeaveDays);

                // Apply per-employee overrides if provided
                const empOverrides = overrides && overrides[String(emp._id)] ? overrides[String(emp._id)] : {};
                components = mergeOverrides(components, empOverrides);

                const payroll = await Payroll.create({
                    employee: emp._id, month: Number(month), year: Number(year),
                    workingDays, presentDays, absentDays, lateCount, unpaidLeaveDays,
                    generatedBy: req.user._id,
                    ...components
                });

                // Generate salary slip
                const slipNum = `SLIP-${year}${String(month).padStart(2,'0')}-${emp.employeeId}`;
                await SalarySlip.create({
                    payroll: payroll._id, employee: emp._id,
                    month: Number(month), year: Number(year),
                    slipNumber: slipNum,
                    generatedBy: req.user._id,
                    salarySnapshot: {
                        employee: {
                            name: `${emp.firstName} ${emp.lastName}`,
                            employeeId: emp.employeeId,
                            email: emp.email
                        },
                        ...components,
                        workingDays, presentDays, absentDays, unpaidLeaveDays,
                        month: Number(month), year: Number(year)
                    }
                });

                // Notify employee
                if (emp.user) {
                    const empUser = await User.findById(emp.user);
                    if (empUser) {
                        await Notification.create({
                            recipient: empUser._id,
                            title: 'Salary Slip Available',
                            message: `Your salary slip for ${getMonthName(month)} ${year} is ready. Net Salary: ₹${components.netSalary.toLocaleString('en-IN')}.`,
                            type: 'salary_generated',
                            link: '/pages/salary-slip.html'
                        });

                        // Email notification
                        try {
                            await sendSalaryGeneratedEmail(emp.email, emp.firstName, getMonthName(month), year, components.netSalary);
                        } catch (_) {}
                    }
                }

                results.push({ employee: emp.employeeId, name: `${emp.firstName} ${emp.lastName}`, payroll });
            } catch (empErr) {
                errors.push({ employee: emp.employeeId, message: empErr.message });
            }
        }

        sendSuccess(res, 201, `Payroll generated for ${results.length} employee(s).`, { results, errors });
    } catch (error) { next(error); }
};

const getPayroll = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id)
            .populate({ path: 'employee', populate: [{ path: 'department', select: 'name' }, { path: 'designation', select: 'name' }] });
        if (!payroll) return sendError(res, 404, 'Payroll record not found.');
        if (req.user.role === 'employee' && String(payroll.employee._id) !== String(req.user.employee)) {
            return sendError(res, 403, 'Access denied.');
        }
        sendSuccess(res, 200, 'Payroll fetched.', { payroll });
    } catch (error) { next(error); }
};

const updatePayroll = async (req, res, next) => {
    try {
        const { paymentStatus, paymentDate, bonus, overtime, otherEarnings, insurance, loanAdvance, otherDeductions, remarks } = req.body;

        const payroll = await Payroll.findById(req.params.id);
        if (!payroll) return sendError(res, 404, 'Payroll not found.');

        // Recalculate if earnings/deductions changed
        const overrides = { bonus, overtime, otherEarnings, insurance, loanAdvance, otherDeductions };
        let base = calculateSalaryComponents(payroll.basicSalary);
        base = applyAttendanceImpact(base, payroll.workingDays, payroll.presentDays, payroll.unpaidLeaveDays);
        const updated = mergeOverrides({ ...base, pf: payroll.pf, professionalTax: payroll.professionalTax, tds: payroll.tds }, overrides);

        Object.assign(payroll, updated, { paymentStatus, paymentDate, remarks });
        await payroll.save();

        sendSuccess(res, 200, 'Payroll updated.', { payroll });
    } catch (error) { next(error); }
};

const deletePayroll = async (req, res, next) => {
    try {
        await Payroll.findByIdAndDelete(req.params.id);
        await SalarySlip.findOneAndDelete({ payroll: req.params.id });
        sendSuccess(res, 200, 'Payroll deleted.');
    } catch (error) { next(error); }
};

module.exports = { getPayrolls, generatePayroll, getPayroll, updatePayroll, deletePayroll };
