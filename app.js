const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Static folders
app.use(express.static(path.join(__dirname, 'pages')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/designations', require('./routes/designationRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/salary-slips', require('./routes/salarySlipRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/insights', require('./routes/insightsRoutes'));

// Fallback for HTML pages (SPA-like routing for direct file access)
app.get('/:page.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', `${req.params.page}.html`));
});

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
