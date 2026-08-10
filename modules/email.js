require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOTPEmail(email, otp) {

    const mailOptions = {
        from: `"Employee Salary System" <${process.env.EMAIL_USER}>`,

        to: email,

        subject: "Employee Salary System - Email Verification OTP",

        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial, sans-serif;
">

    <div style="
        max-width:500px;
        margin:40px auto;
        background:white;
        border-radius:15px;
        padding:30px;
        text-align:center;
        box-shadow:0 5px 20px rgba(0,0,0,0.1);
    ">

        <h1 style="margin-bottom:10px;">
            Employee Salary System
        </h1>

        <p style="color:#666;">
            Email Verification
        </p>

        <p>
            Your verification OTP is:
        </p>

        <div style="
            font-size:35px;
            font-weight:bold;
            letter-spacing:10px;
            margin:25px 0;
        ">
            ${otp}
        </div>

        <p>
            This OTP is valid for
            <strong>5 minutes</strong>.
        </p>

        <p style="color:#777;">
            Do not share this OTP with anyone.
        </p>

        <hr>

        <p style="font-size:12px;color:#999;">
            Employee Salary Management System
        </p>

    </div>

</body>
</html>
`
    };

    await transporter.sendMail(mailOptions);
}

async function verifyEmailConfiguration() {
    try {
        await transporter.verify();

        console.log("Email service connected successfully.");
        return true;

    } catch (error) {
        console.log("Email configuration error:");
        console.log(error.message);

        return false;
    }
}

module.exports = {
    sendOTPEmail,
    verifyEmailConfiguration
};