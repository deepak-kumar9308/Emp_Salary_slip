const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required']
    },
    designation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Designation',
        required: [true, 'Designation is required']
    },
    joiningDate: {
        type: Date,
        required: [true, 'Joining date is required']
    },
    employmentType: {
        type: String,
        enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'],
        default: 'Full-Time'
    },
    // Salary
    basicSalary: {
        type: Number,
        required: [true, 'Basic salary is required'],
        min: [0, 'Salary cannot be negative']
    },
    // Bank details
    bankName: String,
    bankAccountNumber: String,
    bankIFSC: String,
    // Profile photo
    profilePhoto: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'On Leave', 'Resigned', 'Terminated'],
        default: 'Active'
    }
}, { timestamps: true });

// Virtual: full name
employeeSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

// Indexes for search performance
employeeSchema.index({ firstName: 'text', lastName: 'text', email: 'text', employeeId: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);
