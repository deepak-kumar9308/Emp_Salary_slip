const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendLeaveStatusEmail } = require('../services/emailService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getLeaves = async (req, res, next) => {
    try {
        const { employee, status, leaveType, page = 1, limit = 10 } = req.query;
        const filter = {};

        if (req.user.role === 'employee') filter.employee = req.user.employee;
        else if (employee) filter.employee = employee;

        if (status) filter.status = status;
        if (leaveType) filter.leaveType = leaveType;

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Leave.countDocuments(filter);
        const leaves = await Leave.find(filter)
            .populate('employee', 'firstName lastName employeeId email')
            .populate('reviewedBy', 'name')
            .sort({ appliedDate: -1 })
            .skip(skip)
            .limit(Number(limit));

        sendSuccess(res, 200, 'Leave requests fetched.', {
            leaves,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
        });
    } catch (error) { next(error); }
};

const applyLeave = async (req, res, next) => {
    try {
        const { employee, leaveType, startDate, endDate, reason } = req.body;

        // If employee role, force to their own ID
        const empId = req.user.role === 'employee' ? req.user.employee : employee;
        if (!empId) return sendError(res, 400, 'Employee is required.');

        const start = new Date(startDate);
        const end   = new Date(endDate);
        if (end < start) return sendError(res, 400, 'End date cannot be before start date.');

        const msPerDay = 86400000;
        const numberOfDays = Math.ceil((end - start) / msPerDay) + 1;

        const leave = await Leave.create({ employee: empId, leaveType, startDate: start, endDate: end, numberOfDays, reason });

        // Notify HR and admin
        const managers = await User.find({ role: { $in: ['admin', 'hr'] } });
        const emp = await Employee.findById(empId);
        if (managers.length && emp) {
            await Notification.insertMany(managers.map(m => ({
                recipient: m._id,
                title: 'New Leave Request',
                message: `${emp.firstName} ${emp.lastName} applied for ${leaveType} (${numberOfDays} day${numberOfDays > 1 ? 's' : ''}).`,
                type: 'leave_applied',
                link: '/pages/leaves.html'
            })));
        }

        sendSuccess(res, 201, 'Leave applied successfully.', { leave });
    } catch (error) { next(error); }
};

const updateLeaveStatus = async (req, res, next) => {
    try {
        const { status, rejectionReason } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) return sendError(res, 400, 'Status must be Approved or Rejected.');

        const leave = await Leave.findById(req.params.id).populate('employee', 'firstName lastName email status user');
        if (!leave) return sendError(res, 404, 'Leave request not found.');
        if (leave.status !== 'Pending') return sendError(res, 400, 'Only pending leave can be reviewed.');

        leave.status = status;
        leave.reviewedBy = req.user._id;
        leave.reviewedAt = Date.now();
        if (status === 'Rejected' && rejectionReason) leave.rejectionReason = rejectionReason;

        // Update employee status if approved
        if (status === 'Approved') {
            await Employee.findByIdAndUpdate(leave.employee._id, { status: 'On Leave' });
        }

        await leave.save();

        // Notify the employee
        if (leave.employee.user) {
            await Notification.create({
                recipient: leave.employee.user,
                title: `Leave ${status}`,
                message: `Your ${leave.leaveType} request has been ${status}.${status === 'Rejected' ? ` Reason: ${rejectionReason}` : ''}`,
                type: status === 'Approved' ? 'leave_approved' : 'leave_rejected',
                link: '/pages/leaves.html'
            });
        }

        // Send email notification (don't block on failure)
        try {
            await sendLeaveStatusEmail(
                leave.employee.email,
                `${leave.employee.firstName} ${leave.employee.lastName}`,
                leave.leaveType,
                status,
                rejectionReason
            );
        } catch (_) {}

        sendSuccess(res, 200, `Leave ${status.toLowerCase()} successfully.`, { leave });
    } catch (error) { next(error); }
};

const cancelLeave = async (req, res, next) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return sendError(res, 404, 'Leave request not found.');

        // Employee can only cancel own pending leaves
        if (req.user.role === 'employee') {
            if (String(leave.employee) !== String(req.user.employee)) return sendError(res, 403, 'Access denied.');
        }
        if (leave.status !== 'Pending') return sendError(res, 400, 'Only pending leaves can be cancelled.');

        leave.status = 'Cancelled';
        await leave.save();
        sendSuccess(res, 200, 'Leave cancelled.', { leave });
    } catch (error) { next(error); }
};

const deleteLeave = async (req, res, next) => {
    try {
        const leave = await Leave.findByIdAndDelete(req.params.id);
        if (!leave) return sendError(res, 404, 'Leave request not found.');
        sendSuccess(res, 200, 'Leave deleted.');
    } catch (error) { next(error); }
};

module.exports = { getLeaves, applyLeave, updateLeaveStatus, cancelLeave, deleteLeave };
