const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getAttendance = async (req, res, next) => {
    try {
        const { employee, month, year, status, page = 1, limit = 30 } = req.query;
        const filter = {};

        // Employee can only see own attendance
        if (req.user.role === 'employee') {
            filter.employee = req.user.employee;
        } else if (employee) {
            filter.employee = employee;
        }

        if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end   = new Date(year, month, 0, 23, 59, 59);
            filter.date = { $gte: start, $lte: end };
        }
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Attendance.countDocuments(filter);

        const records = await Attendance.find(filter)
            .populate('employee', 'firstName lastName employeeId')
            .sort({ date: -1 })
            .skip(skip)
            .limit(Number(limit));

        sendSuccess(res, 200, 'Attendance fetched.', {
            attendance: records,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
        });
    } catch (error) { next(error); }
};

const markAttendance = async (req, res, next) => {
    try {
        const { employee, date, status, checkIn, checkOut, remarks } = req.body;

        // Normalize date to midnight
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Check for duplicate
        const existing = await Attendance.findOne({ employee, date: attendanceDate });
        if (existing) return sendError(res, 400, 'Attendance already marked for this employee on this date.');

        const record = await Attendance.create({
            employee, date: attendanceDate, status, checkIn, checkOut, remarks, markedBy: req.user._id
        });

        const populated = await Attendance.findById(record._id)
            .populate('employee', 'firstName lastName employeeId');

        sendSuccess(res, 201, 'Attendance marked.', { attendance: populated });
    } catch (error) { next(error); }
};

const updateAttendance = async (req, res, next) => {
    try {
        const { status, checkIn, checkOut, remarks } = req.body;
        const record = await Attendance.findByIdAndUpdate(
            req.params.id,
            { status, checkIn, checkOut, remarks },
            { new: true, runValidators: true }
        ).populate('employee', 'firstName lastName');

        if (!record) return sendError(res, 404, 'Attendance record not found.');
        sendSuccess(res, 200, 'Attendance updated.', { attendance: record });
    } catch (error) { next(error); }
};

const deleteAttendance = async (req, res, next) => {
    try {
        const record = await Attendance.findByIdAndDelete(req.params.id);
        if (!record) return sendError(res, 404, 'Attendance record not found.');
        sendSuccess(res, 200, 'Attendance record deleted.');
    } catch (error) { next(error); }
};

// GET /api/attendance/monthly-report  — summary for a month
const getMonthlyReport = async (req, res, next) => {
    try {
        const { month, year, employee } = req.query;
        if (!month || !year) return sendError(res, 400, 'Month and year are required.');

        const matchFilter = {
            date: {
                $gte: new Date(year, month - 1, 1),
                $lte: new Date(year, month, 0, 23, 59, 59)
            }
        };
        if (req.user.role === 'employee') matchFilter.employee = req.user.employee;
        else if (employee) matchFilter.employee = new (require('mongoose').Types.ObjectId)(employee);

        const report = await Attendance.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: { employee: '$employee', status: '$status' },
                    count: { $sum: 1 },
                    totalHours: { $sum: '$workingHours' }
                }
            },
            {
                $group: {
                    _id: '$_id.employee',
                    statuses: {
                        $push: { status: '$_id.status', count: '$count', totalHours: '$totalHours' }
                    },
                    totalDays: { $sum: '$count' }
                }
            },
            {
                $lookup: {
                    from: 'employees',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            { $unwind: '$employee' }
        ]);

        sendSuccess(res, 200, 'Monthly report fetched.', { report });
    } catch (error) { next(error); }
};

// POST /api/attendance/bulk  — mark for all employees at once
const bulkMarkAttendance = async (req, res, next) => {
    try {
        const { date, records } = req.body;
        // records = [{ employee, status, checkIn, checkOut }]
        if (!Array.isArray(records) || !records.length) return sendError(res, 400, 'Records array is required.');

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const ops = records.map(r => ({
            updateOne: {
                filter: { employee: r.employee, date: attendanceDate },
                update: { $set: { ...r, date: attendanceDate, markedBy: req.user._id } },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(ops);
        sendSuccess(res, 200, `Bulk attendance marked for ${records.length} employees.`);
    } catch (error) { next(error); }
};

module.exports = { getAttendance, markAttendance, updateAttendance, deleteAttendance, getMonthlyReport, bulkMarkAttendance };
