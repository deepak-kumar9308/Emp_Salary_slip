const Designation = require('../models/Designation');
const Employee = require('../models/Employee');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getDesignations = async (req, res, next) => {
    try {
        const { department, search } = req.query;
        const filter = { isActive: true };
        if (department) filter.department = department;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const designations = await Designation.find(filter)
            .populate('department', 'name code')
            .sort('name');
        sendSuccess(res, 200, 'Designations fetched.', { designations });
    } catch (error) { next(error); }
};

const getDesignation = async (req, res, next) => {
    try {
        const d = await Designation.findById(req.params.id).populate('department', 'name');
        if (!d) return sendError(res, 404, 'Designation not found.');
        sendSuccess(res, 200, 'Designation fetched.', { designation: d });
    } catch (error) { next(error); }
};

const createDesignation = async (req, res, next) => {
    try {
        const { name, department, description, minSalary, maxSalary } = req.body;
        const d = await Designation.create({ name, department, description, minSalary, maxSalary });
        sendSuccess(res, 201, 'Designation created.', { designation: d });
    } catch (error) { next(error); }
};

const updateDesignation = async (req, res, next) => {
    try {
        const { name, department, description, minSalary, maxSalary, isActive } = req.body;
        const d = await Designation.findByIdAndUpdate(
            req.params.id,
            { name, department, description, minSalary, maxSalary, isActive },
            { new: true, runValidators: true }
        );
        if (!d) return sendError(res, 404, 'Designation not found.');
        sendSuccess(res, 200, 'Designation updated.', { designation: d });
    } catch (error) { next(error); }
};

const deleteDesignation = async (req, res, next) => {
    try {
        const count = await Employee.countDocuments({ designation: req.params.id, status: 'Active' });
        if (count > 0) return sendError(res, 400, `${count} active employee(s) have this designation. Reassign first.`);
        const d = await Designation.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!d) return sendError(res, 404, 'Designation not found.');
        sendSuccess(res, 200, 'Designation deactivated.');
    } catch (error) { next(error); }
};

module.exports = { getDesignations, getDesignation, createDesignation, updateDesignation, deleteDesignation };
