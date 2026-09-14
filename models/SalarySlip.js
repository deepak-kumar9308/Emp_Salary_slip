const mongoose = require('mongoose');

const salarySlipSchema = new mongoose.Schema({
    payroll: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payroll',
        required: true
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    slipNumber: {
        type: String,
        unique: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Snapshot of salary data at time of generation
    salarySnapshot: {
        type: mongoose.Schema.Types.Mixed
    },
    // PDF path if generated
    pdfPath: String,
    isDownloaded: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Unique slip per employee per month per year
salarySlipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('SalarySlip', salarySlipSchema);
