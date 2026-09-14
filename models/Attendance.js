const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Employee is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half Day', 'Work From Home', 'Late', 'Holiday', 'Weekend'],
        required: [true, 'Status is required']
    },
    checkIn: {
        type: String, // "HH:MM" format
        default: null
    },
    checkOut: {
        type: String,
        default: null
    },
    workingHours: {
        type: Number,
        default: 0,
        min: 0
    },
    remarks: {
        type: String,
        trim: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Prevent duplicate attendance for same employee + date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Auto-calculate working hours before save
attendanceSchema.pre('save', function () {
    if (this.checkIn && this.checkOut) {
        const [inH, inM] = this.checkIn.split(':').map(Number);
        const [outH, outM] = this.checkOut.split(':').map(Number);
        const totalMin = (outH * 60 + outM) - (inH * 60 + inM);
        this.workingHours = totalMin > 0 ? +(totalMin / 60).toFixed(2) : 0;
    }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
