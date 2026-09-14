const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { sendOTPEmail } = require('../services/emailService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// In-memory OTP store (for demo; in production use Redis)
const otpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register  (Admin only — creates HR/Employee accounts)
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return sendError(res, 400, 'Email already registered.');

        const user = await User.create({ name, email, password, role: role || 'employee', emailVerified: true });

        // Notify admins
        const admins = await User.find({ role: 'admin' });
        if (admins.length) {
            await Notification.insertMany(admins.map(a => ({
                recipient: a._id,
                title: 'New User Registered',
                message: `${name} (${role || 'employee'}) has been added to the system.`,
                type: 'employee_added'
            })));
        }

        sendSuccess(res, 201, 'User created successfully.', {
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/send-otp  (signup OTP flow)
const sendOTP = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) return sendError(res, 400, 'Name, email and password are required.');

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return sendError(res, 400, 'Email already registered.');

        const otp = generateOTP();
        otpStore.set(email.toLowerCase(), {
            otp,
            userData: { name, email: email.toLowerCase(), password, role: role || 'employee' },
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        try {
            await sendOTPEmail(email, otp);
            console.log(`[EMAIL SENT] OTP successfully sent to ${email}`);
            sendSuccess(res, 200, 'OTP sent to your email. Valid for 5 minutes.');
        } catch (emailErr) {
            console.error('Email error:', emailErr.message);
            return sendError(res, 500, `Failed to send OTP email: ${emailErr.message}. Please verify your EMAIL_USER and App Password in .env.`);
        }
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/verify-otp
const verifyOTP = async (req, res, next) => {
    console.log('[DEBUG] verifyOTP called. typeof next:', typeof next);
    try {
        const { email, otp } = req.body;
        const key = email.toLowerCase();
        const data = otpStore.get(key);

        if (!data) return sendError(res, 400, 'OTP not found. Please request a new OTP.');
        if (Date.now() > data.expiresAt) {
            otpStore.delete(key);
            return sendError(res, 400, 'OTP has expired. Please request a new one.');
        }
        if (data.otp !== String(otp).trim()) return sendError(res, 400, 'Invalid OTP.');

        otpStore.delete(key);

        const user = await User.create({ ...data.userData, emailVerified: true });
        const token = generateToken(user._id);

        sendSuccess(res, 201, 'Email verified. Account created successfully.', {
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return sendError(res, 400, 'Email and password are required.');

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) return sendError(res, 401, 'Invalid email or password.');

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return sendError(res, 401, 'Invalid email or password.');

        if (!user.emailVerified) return sendError(res, 403, 'Please verify your email first.');
        if (!user.isActive) return sendError(res, 403, 'Your account has been deactivated. Contact admin.');

        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id);

        // Load linked employee if exists
        let employee = null;
        if (user.employee) {
            employee = await Employee.findById(user.employee)
                .populate('department', 'name')
                .populate('designation', 'name');
        }

        sendSuccess(res, 200, 'Login successful.', {
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, employee }
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'employee',
            populate: [
                { path: 'department', select: 'name code' },
                { path: 'designation', select: 'name' }
            ]
        });
        sendSuccess(res, 200, 'User fetched.', { user });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/logout
const logout = (req, res) => {
    res.clearCookie('token');
    sendSuccess(res, 200, 'Logged out successfully.');
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return sendError(res, 400, 'Current password is incorrect.');

        user.password = newPassword;
        await user.save();

        sendSuccess(res, 200, 'Password changed successfully.');
    } catch (error) {
        next(error);
    }
};

module.exports = { register, sendOTP, verifyOTP, login, getMe, logout, changePassword };
