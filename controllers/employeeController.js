const Employee = require('../models/Employee');
const User = require('../models/User');
const Notification = require('../models/Notification');
const generateEmployeeId = require('../utils/generateEmployeeId');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// GET /api/employees  — list with search, filter, pagination
const getEmployees = async (req, res, next) => {
    try {
        const { search, department, designation, status, employmentType, page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const filter = {};
        if (department)      filter.department    = department;
        if (designation)     filter.designation   = designation;
        if (status)          filter.status        = status;
        if (employmentType)  filter.employmentType = employmentType;
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName:  { $regex: search, $options: 'i' } },
                { email:     { $regex: search, $options: 'i' } },
                { employeeId:{ $regex: search, $options: 'i' } }
            ];
        }

        // Employee role can only see themselves
        if (req.user.role === 'employee') {
            filter._id = req.user.employee;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Employee.countDocuments(filter);

        const employees = await Employee.find(filter)
            .populate('department', 'name code')
            .populate('designation', 'name')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));

        sendSuccess(res, 200, 'Employees fetched.', {
            employees,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
        });
    } catch (error) { next(error); }
};

// GET /api/employees/:id
const getEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate('department', 'name code')
            .populate('designation', 'name minSalary maxSalary')
            .populate('user', 'name email role lastLogin');

        if (!employee) return sendError(res, 404, 'Employee not found.');

        // Employee can only view own profile
        if (req.user.role === 'employee' && String(employee._id) !== String(req.user.employee)) {
            return sendError(res, 403, 'Access denied.');
        }

        sendSuccess(res, 200, 'Employee fetched.', { employee });
    } catch (error) { next(error); }
};

// POST /api/employees
const createEmployee = async (req, res, next) => {
    try {
        const {
            firstName, lastName, email, phone, dateOfBirth, gender,
            address, department, designation, joiningDate, employmentType,
            basicSalary, bankName, bankAccountNumber, bankIFSC,
            // User account fields (optional)
            createAccount, userPassword, userRole
        } = req.body;

        // Check duplicate email
        const existing = await Employee.findOne({ email: email.toLowerCase() });
        if (existing) return sendError(res, 400, 'An employee with this email already exists.');

        const employeeId = await generateEmployeeId();
        const profilePhoto = req.file ? `/uploads/${req.file.filename}` : null;

        const employee = await Employee.create({
            employeeId, firstName, lastName, email: email.toLowerCase(),
            phone, dateOfBirth, gender, address, department, designation,
            joiningDate, employmentType, basicSalary, bankName,
            bankAccountNumber, bankIFSC, profilePhoto
        });

        // Optionally create a User account linked to this employee
        if (createAccount === 'true' || createAccount === true) {
            if (!userPassword) return sendError(res, 400, 'Password is required to create user account.');
            const user = await User.create({
                name: `${firstName} ${lastName}`,
                email: email.toLowerCase(),
                password: userPassword,
                role: userRole || 'employee',
                employee: employee._id,
                emailVerified: true
            });
            employee.user = user._id;
            await employee.save();
        }

        // Notify admins and HR
        const managers = await User.find({ role: { $in: ['admin', 'hr'] } });
        if (managers.length) {
            await Notification.insertMany(managers.map(m => ({
                recipient: m._id,
                title: 'New Employee Added',
                message: `${firstName} ${lastName} (${employeeId}) has joined the team.`,
                type: 'employee_added',
                link: `/pages/employee-profile.html?id=${employee._id}`
            })));
        }

        const populated = await Employee.findById(employee._id)
            .populate('department', 'name code')
            .populate('designation', 'name');

        sendSuccess(res, 201, 'Employee created successfully.', { employee: populated });
    } catch (error) { next(error); }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res, next) => {
    try {
        const allowedFields = [
            'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address',
            'department', 'designation', 'employmentType', 'basicSalary',
            'bankName', 'bankAccountNumber', 'bankIFSC', 'status'
        ];

        const updates = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
        if (req.file) updates.profilePhoto = `/uploads/${req.file.filename}`;

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).populate('department', 'name').populate('designation', 'name');

        if (!employee) return sendError(res, 404, 'Employee not found.');

        sendSuccess(res, 200, 'Employee updated successfully.', { employee });
    } catch (error) { next(error); }
};

// DELETE /api/employees/:id  (soft delete — set status to Terminated)
const deleteEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return sendError(res, 404, 'Employee not found.');

        employee.status = 'Terminated';
        await employee.save();

        // Deactivate linked user account
        if (employee.user) {
            await User.findByIdAndUpdate(employee.user, { isActive: false });
        }

        sendSuccess(res, 200, 'Employee deactivated (terminated).');
    } catch (error) { next(error); }
};

// DELETE /api/employees/:id/hard  — permanent delete (admin only)
const hardDeleteEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) return sendError(res, 404, 'Employee not found.');
        if (employee.user) await User.findByIdAndDelete(employee.user);
        sendSuccess(res, 200, 'Employee permanently deleted.');
    } catch (error) { next(error); }
};

// GET /api/employees/stats/summary
const getEmployeeStats = async (req, res, next) => {
    try {
        const stats = await Employee.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await Employee.countDocuments();
        const byDept = await Employee.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            { $project: { name: '$dept.name', count: 1 } }
        ]);

        sendSuccess(res, 200, 'Stats fetched.', { total, statusBreakdown: stats, byDepartment: byDept });
    } catch (error) { next(error); }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, hardDeleteEmployee, getEmployeeStats };
