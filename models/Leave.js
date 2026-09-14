const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Employee is required']
    },
    leaveType: {
        type: String,
        enum: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Emergency Leave', 'Unpaid Leave'],
        required: [true, 'Leave type is required']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    numberOfDays: {
        type: Number,
        required: true,
        min: [0.5, 'Minimum 0.5 day leave required']
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        default: 'Pending'
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    rejectionReason: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Validate endDate >= startDate
leaveSchema.pre('save', function () {
    if (this.endDate < this.startDate) {
        throw new Error('End date cannot be before start date');
    }
});

module.exports = mongoose.model('Leave', leaveSchema);
