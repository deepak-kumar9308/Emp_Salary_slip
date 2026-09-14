const Department = require('../models/Department');
const Employee = require('../models/Employee');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getDepartments = async (req, res, next) => {
    try {
        const { search } = req.query;
        const filter = { isActive: true };
        if (search) filter.name = { $regex: search, $options: 'i' };

        const departments = await Department.find(filter)
            .populate('manager', 'firstName lastName employeeId')
            .sort('name');

        // Attach employee count
        const withCount = await Promise.all(departments.map(async (d) => {
            const count = await Employee.countDocuments({ department: d._id, status: 'Active' });
            return { ...d.toJSON(), employeeCount: count };
        }));

        sendSuccess(res, 200, 'Departments fetched.', { departments: withCount });
    } catch (error) { next(error); }
};

const getDepartment = async (req, res, next) => {
    try {
        const dept = await Department.findById(req.params.id).populate('manager', 'firstName lastName');
        if (!dept) return sendError(res, 404, 'Department not found.');
        const employeeCount = await Employee.countDocuments({ department: dept._id });
        sendSuccess(res, 200, 'Department fetched.', { department: { ...dept.toJSON(), employeeCount } });
    } catch (error) { next(error); }
};

const createDepartment = async (req, res, next) => {
    try {
        const { name, code, description, manager } = req.body;
        const dept = await Department.create({ name, code: code.toUpperCase(), description, manager });
        sendSuccess(res, 201, 'Department created.', { department: dept });
    } catch (error) { next(error); }
};

const updateDepartment = async (req, res, next) => {
    try {
        const { name, code, description, manager, isActive } = req.body;
        const dept = await Department.findByIdAndUpdate(
            req.params.id,
            { name, code: code?.toUpperCase(), description, manager, isActive },
            { new: true, runValidators: true }
        );
        if (!dept) return sendError(res, 404, 'Department not found.');
        sendSuccess(res, 200, 'Department updated.', { department: dept });
    } catch (error) { next(error); }
};

const deleteDepartment = async (req, res, next) => {
    try {
        const empCount = await Employee.countDocuments({ department: req.params.id, status: 'Active' });
        if (empCount > 0) return sendError(res, 400, `Cannot delete department with ${empCount} active employee(s). Reassign them first.`);
        const dept = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!dept) return sendError(res, 404, 'Department not found.');
        sendSuccess(res, 200, 'Department deactivated.');
    } catch (error) { next(error); }
};

module.exports = { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
