const Employee = require('../models/Employee');

const generateEmployeeId = async () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `EMP${year}`;

    // Find the last employee with this year's prefix
    const lastEmployee = await Employee.findOne(
        { employeeId: { $regex: `^${prefix}` } },
        { employeeId: 1 },
        { sort: { employeeId: -1 } }
    );

    let nextNum = 1;
    if (lastEmployee) {
        const lastNum = parseInt(lastEmployee.employeeId.replace(prefix, ''), 10);
        nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
};

module.exports = generateEmployeeId;
