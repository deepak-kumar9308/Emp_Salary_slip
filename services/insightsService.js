const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { getMonthName } = require('./salaryService');

/**
 * SALARY HEALTH & SMART INSIGHTS
 * All insights are DATA-DRIVEN — backed by real MongoDB aggregation.
 */

// Department salary comparison
const getDepartmentSalaryComparison = async (month, year) => {
    return Payroll.aggregate([
        { $match: { month, year } },
        {
            $lookup: {
                from: 'employees', localField: 'employee', foreignField: '_id', as: 'emp'
            }
        },
        { $unwind: '$emp' },
        {
            $lookup: {
                from: 'departments', localField: 'emp.department', foreignField: '_id', as: 'dept'
            }
        },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: '$dept._id',
                deptName: { $first: '$dept.name' },
                avgSalary: { $avg: '$netSalary' },
                totalSalary: { $sum: '$netSalary' },
                maxSalary: { $max: '$netSalary' },
                minSalary: { $min: '$netSalary' },
                count: { $sum: 1 }
            }
        },
        { $sort: { avgSalary: -1 } }
    ]);
};

// Month-over-month salary change per employee
const getSalaryTrend = async (employeeId, months = 6) => {
    const now = new Date();
    const records = [];

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        records.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    const results = await Promise.all(records.map(async ({ month, year }) => {
        const p = await Payroll.findOne({ employee: employeeId, month, year });
        return {
            label: `${getMonthName(month).slice(0,3)} ${year}`,
            month, year,
            netSalary: p ? p.netSalary : null,
            grossSalary: p ? p.grossSalary : null,
            totalDeductions: p ? p.totalDeductions : null
        };
    }));

    return results;
};

// Employees with unusually high deductions (deduction > 30% of gross)
const getHighDeductionEmployees = async (month, year) => {
    return Payroll.aggregate([
        { $match: { month, year, grossSalary: { $gt: 0 } } },
        {
            $addFields: {
                deductionPct: { $multiply: [{ $divide: ['$totalDeductions', '$grossSalary'] }, 100] }
            }
        },
        { $match: { deductionPct: { $gt: 30 } } },
        {
            $lookup: { from: 'employees', localField: 'employee', foreignField: '_id', as: 'emp' }
        },
        { $unwind: '$emp' },
        {
            $project: {
                name: { $concat: ['$emp.firstName', ' ', '$emp.lastName'] },
                employeeId: '$emp.employeeId',
                grossSalary: 1, totalDeductions: 1, netSalary: 1, deductionPct: { $round: ['$deductionPct', 1] }
            }
        },
        { $sort: { deductionPct: -1 } }
    ]);
};

// Employees with frequent unpaid leave
const getFrequentUnpaidLeaveEmployees = async (month, year) => {
    return Payroll.aggregate([
        { $match: { month, year, unpaidLeaveDays: { $gt: 2 } } },
        { $lookup: { from: 'employees', localField: 'employee', foreignField: '_id', as: 'emp' } },
        { $unwind: '$emp' },
        {
            $project: {
                name: { $concat: ['$emp.firstName', ' ', '$emp.lastName'] },
                employeeId: '$emp.employeeId',
                unpaidLeaveDays: 1, netSalary: 1, basicSalary: '$emp.basicSalary'
            }
        },
        { $sort: { unpaidLeaveDays: -1 } }
    ]);
};

// Top earners and bottom earners
const getSalaryExtremes = async (month, year) => {
    const top = await Payroll.find({ month, year })
        .populate('employee', 'firstName lastName employeeId department')
        .sort({ netSalary: -1 })
        .limit(5);

    const bottom = await Payroll.find({ month, year })
        .populate('employee', 'firstName lastName employeeId department')
        .sort({ netSalary: 1 })
        .limit(5);

    return { top, bottom };
};

// Monthly payroll expense trend (last N months)
const getPayrollCostTrend = async (months = 6) => {
    const now = new Date();
    const fromDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    return Payroll.aggregate([
        {
            $match: {
                $expr: {
                    $gte: [
                        { $dateFromParts: { year: '$year', month: '$month', day: 1 } },
                        fromDate
                    ]
                }
            }
        },
        {
            $group: {
                _id: { month: '$month', year: '$year' },
                totalCost: { $sum: '$netSalary' },
                totalGross: { $sum: '$grossSalary' },
                totalDeductions: { $sum: '$totalDeductions' },
                employeeCount: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
            $addFields: {
                label: {
                    $let: {
                        vars: {
                            months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                        },
                        in: {
                            $concat: [
                                { $arrayElemAt: ['$$months', { $subtract: ['$_id.month', 1] }] },
                                ' ', { $toString: '$_id.year' }
                            ]
                        }
                    }
                }
            }
        }
    ]);
};

// Generate smart narrative insights for one employee
const generateEmployeeInsights = async (employeeId) => {
    const insights = [];
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear  = now.getFullYear();
    const prevMonth = thisMonth === 1 ? 12 : thisMonth - 1;
    const prevYear  = thisMonth === 1 ? thisYear - 1 : thisYear;

    const current  = await Payroll.findOne({ employee: employeeId, month: thisMonth, year: thisYear });
    const previous = await Payroll.findOne({ employee: employeeId, month: prevMonth, year: prevYear });

    if (current && previous) {
        const change = current.netSalary - previous.netSalary;
        const changePct = ((change / previous.netSalary) * 100).toFixed(1);
        const direction = change >= 0 ? 'increased' : 'decreased';
        const icon = change >= 0 ? '📈' : '📉';

        insights.push({
            type: 'salary_change',
            icon,
            title: `Net Salary ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
            message: `Net salary ${direction} by ${Math.abs(changePct)}% compared to last month (${getMonthName(prevMonth)} → ${getMonthName(thisMonth)}).`,
            value: Math.abs(change).toFixed(0)
        });

        if (current.unpaidLeaveDays > 0) {
            const emp = await Employee.findById(employeeId);
            const basicSalary = emp ? emp.basicSalary || 0 : 0;
            const perDay = (basicSalary / 26).toFixed(0);
            insights.push({
                type: 'leave_impact',
                icon: '🏖️',
                title: 'Unpaid Leave Impact',
                message: `${current.unpaidLeaveDays} unpaid leave day(s) caused a salary deduction of approximately ₹${(current.unpaidLeaveDays * perDay).toLocaleString('en-IN')}.`,
                value: current.unpaidLeaveDays
            });
        }

        if (current.bonus > 0) {
            insights.push({
                type: 'bonus',
                icon: '🎁',
                title: 'Bonus Received',
                message: `A bonus of ₹${current.bonus.toLocaleString('en-IN')} was added this month.`,
                value: current.bonus
            });
        }

        const deductionPct = ((current.totalDeductions / current.grossSalary) * 100).toFixed(1);
        if (deductionPct > 25) {
            insights.push({
                type: 'high_deduction',
                icon: '⚠️',
                title: 'High Deduction Alert',
                message: `Total deductions are ${deductionPct}% of gross salary this month, which is above the 25% threshold.`,
                value: deductionPct
            });
        }
    } else if (!current) {
        insights.push({ type: 'info', icon: '📋', title: 'No Payroll', message: 'Payroll not yet generated for this month.' });
    }

    return insights;
};

// Salary forecast using simple linear regression on recent months
const generateForecast = async (months = 4) => {
    const trend = await getPayrollCostTrend(months);
    if (trend.length < 2) return null;

    const n = trend.length;
    const x = trend.map((_, i) => i);
    const y = trend.map(t => t.totalCost);

    const sumX  = x.reduce((a, b) => a + b, 0);
    const sumY  = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const nextX     = n;
    const forecast  = intercept + slope * nextX;

    const lastEntry = trend[trend.length - 1];
    const nextMonth = lastEntry._id.month === 12 ? 1 : lastEntry._id.month + 1;
    const nextYear  = lastEntry._id.month === 12 ? lastEntry._id.year + 1 : lastEntry._id.year;

    return {
        forecast: Math.max(0, +forecast.toFixed(2)),
        forecastLabel: `${getMonthName(nextMonth)} ${nextYear}`,
        basedOn: trend.map(t => ({ label: t.label, total: t.totalCost })),
        note: 'This is an estimate based on linear trend analysis of recent payroll data. Actual payroll may differ.'
    };
};

module.exports = {
    getDepartmentSalaryComparison,
    getSalaryTrend,
    getHighDeductionEmployees,
    getFrequentUnpaidLeaveEmployees,
    getSalaryExtremes,
    getPayrollCostTrend,
    generateEmployeeInsights,
    generateForecast
};
