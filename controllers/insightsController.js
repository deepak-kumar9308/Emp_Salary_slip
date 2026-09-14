const {
    getDepartmentSalaryComparison, getSalaryTrend, getHighDeductionEmployees,
    getFrequentUnpaidLeaveEmployees, getSalaryExtremes, getPayrollCostTrend,
    generateEmployeeInsights, generateForecast
} = require('../services/insightsService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getInsights = async (req, res, next) => {
    try {
        const now = new Date();
        const month = Number(req.query.month) || now.getMonth() + 1;
        const year  = Number(req.query.year)  || now.getFullYear();

        const [deptComparison, highDeductions, unpaidLeave, extremes, costTrend] = await Promise.all([
            getDepartmentSalaryComparison(month, year),
            getHighDeductionEmployees(month, year),
            getFrequentUnpaidLeaveEmployees(month, year),
            getSalaryExtremes(month, year),
            getPayrollCostTrend(6)
        ]);

        sendSuccess(res, 200, 'Insights fetched.', {
            month, year,
            departmentComparison: deptComparison,
            highDeductionAlerts: highDeductions,
            frequentUnpaidLeave: unpaidLeave,
            salaryExtremes: extremes,
            payrollCostTrend: costTrend
        });
    } catch (error) { next(error); }
};

const getEmployeeInsights = async (req, res, next) => {
    try {
        const empId = req.params.employeeId || req.user.employee;
        if (!empId) return sendError(res, 400, 'Employee ID is required.');

        const months = Number(req.query.months) || 6;
        const [insights, trend] = await Promise.all([
            generateEmployeeInsights(empId),
            getSalaryTrend(empId, months)
        ]);

        sendSuccess(res, 200, 'Employee insights fetched.', { insights, salaryTrend: trend });
    } catch (error) { next(error); }
};

const getForecast = async (req, res, next) => {
    try {
        const months = Number(req.query.months) || 6;
        const forecast = await generateForecast(months);
        if (!forecast) return sendError(res, 404, 'Not enough payroll data to generate forecast. Need at least 2 months of data.');
        sendSuccess(res, 200, 'Salary forecast generated.', { forecast });
    } catch (error) { next(error); }
};

module.exports = { getInsights, getEmployeeInsights, getForecast };
