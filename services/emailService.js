require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '')
    }
});

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin:0; padding:0; background:#f4f7fb; font-family:Arial,sans-serif; }
    .wrapper { max-width:560px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.1); }
    .header { background:linear-gradient(135deg,#667eea,#764ba2); padding:28px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:22px; }
    .body { padding:30px; }
    .body p { color:#444; line-height:1.6; }
    .otp-box { font-size:38px; font-weight:bold; letter-spacing:12px; text-align:center; padding:20px; color:#667eea; background:#f0f0ff; border-radius:10px; margin:20px 0; }
    .footer { padding:18px 30px; background:#f9f9f9; text-align:center; color:#999; font-size:12px; }
    .badge { display:inline-block; background:#eef7ee; color:#2d7a2d; border-radius:6px; padding:6px 14px; font-weight:bold; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>💼 Employee Management System</h1></div>
    <div class="body">${content}</div>
    <div class="footer">TechCorp Solutions Pvt. Ltd. | Do not reply to this email</div>
  </div>
</body>
</html>`;

const sendOTPEmail = async (email, otp) => {
    const content = `
      <p>Hello,</p>
      <p>Your email verification OTP is:</p>
      <div class="otp-box">${otp}</div>
      <p>This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>`;
    await transporter.sendMail({
        from: `"Employee Management System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Email Verification OTP',
        html: baseTemplate('OTP Verification', content)
    });
};

const sendLeaveStatusEmail = async (email, employeeName, leaveType, status, reason) => {
    const icon = status === 'Approved' ? '✅' : '❌';
    const content = `
      <p>Dear <strong>${employeeName}</strong>,</p>
      <p>Your <strong>${leaveType}</strong> request has been <span class="badge">${icon} ${status}</span>.</p>
      ${reason ? `<p><strong>Note:</strong> ${reason}</p>` : ''}
      <p>Please login to the portal to view details.</p>`;
    await transporter.sendMail({
        from: `"HR Department" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Leave Request ${status}`,
        html: baseTemplate('Leave Update', content)
    });
};

const sendSalaryGeneratedEmail = async (email, employeeName, month, year, netSalary) => {
    const content = `
      <p>Dear <strong>${employeeName}</strong>,</p>
      <p>Your salary slip for <strong>${month} ${year}</strong> has been generated.</p>
      <p>Net Salary: <span class="badge">₹${Number(netSalary).toLocaleString('en-IN')}</span></p>
      <p>Login to the portal to download your salary slip.</p>`;
    await transporter.sendMail({
        from: `"Payroll Department" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Salary Slip - ${month} ${year}`,
        html: baseTemplate('Salary Slip Available', content)
    });
};

const verifyEmailConfiguration = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email service connected successfully.');
        return true;
    } catch (error) {
        console.log('⚠️  Email configuration error:', error.message);
        return false;
    }
};

module.exports = {
    sendOTPEmail,
    sendLeaveStatusEmail,
    sendSalaryGeneratedEmail,
    verifyEmailConfiguration
};
