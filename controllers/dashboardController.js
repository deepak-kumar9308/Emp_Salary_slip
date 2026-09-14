const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const SalarySlip = require('../models/SalarySlip');
const { sendSuccess } = require('../utils/responseHelper');

const getDashboard = async (req, res, next) => {
    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year  = now.getFullYear();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Employee stats
        const totalEmployees  = await Employee.countDocuments();
        const activeEmployees = await Employee.countDocuments({ status: 'Active' });
        const onLeave         = await Employee.countDocuments({ status: 'On Leave' });
        const totalDepts      = await Department.countDocuments({ isActive: true });

        // Today's attendance
        const todayPresent = await Attendance.countDocuments({ date: today, status: { $in: ['Present', 'Work From Home', 'Late'] } });
        const todayAbsent  = await Attendance.countDocuments({ date: today, status: 'Absent' });

        // Pending leave requests
        const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

        // Current month payroll
        const payrollAgg = await Payroll.aggregate([
            { $match: { month, year } },
            { $group: { _id: null, totalNet: { $sum: '$netSalary' }, count: { $sum: 1 } } }
        ]);
        const currentPayroll = payrollAgg[0] || { totalNet: 0, count: 0 };

        // Recent employees (last 5)
        const recentEmployees = await Employee.find()
            .populate('department', 'name')
            .populate('designation', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName employeeId department designation joiningDate status profilePhoto');

        // Recent salary slips (last 5)
        const recentSlips = await SalarySlip.find()
            .populate('employee', 'firstName lastName employeeId')
            .sort({ generatedAt: -1 })
            .limit(5);

        // Employees by department (for chart)
        const byDepartment = await Employee.aggregate([
            { $match: { status: 'Active' } },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$dept.name', 'Unassigned'] }, count: 1 } },
            { $sort: { count: -1 } }
        ]);

        // Monthly payroll trend (last 6 months)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const payrollTrend = await Payroll.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { month: '$month', year: '$year' }, total: { $sum: '$netSalary' }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        sendSuccess(res, 200, 'Dashboard data fetched.', {
            stats: { totalEmployees, activeEmployees, onLeave, totalDepts, todayPresent, todayAbsent, pendingLeaves },
            currentPayroll,
            recentEmployees,
            recentSlips,
            charts: { byDepartment, payrollTrend }
        });
    } catch (error) { next(error); }
};

module.exports = { getDashboard };
