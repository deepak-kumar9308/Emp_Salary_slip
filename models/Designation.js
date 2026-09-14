const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Designation name is required'],
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required']
    },
    description: {
        type: String,
        trim: true
    },
    minSalary: {
        type: Number,
        min: [0, 'Minimum salary cannot be negative'],
        default: 0
    },
    maxSalary: {
        type: Number,
        min: [0, 'Maximum salary cannot be negative'],
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Designation', designationSchema);
