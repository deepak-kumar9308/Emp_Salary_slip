require("dotenv").config();

const http = require("http");
const fs = require("fs");
const nodemailer = require("nodemailer");
const querystring = require("querystring");


const PORT = 3000;

// ======================================================
// GMAIL CONFIGURATION
// ======================================================

// IMPORTANT:
// Replace these with your Gmail and Gmail APP PASSWORD.
//
// Do NOT use your normal Gmail password.
//
// Example:
// user: "yourname@gmail.com"
// pass: "abcd efgh ijkl mnop"

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ======================================================
// TEMPORARY OTP STORAGE
// ======================================================

// OTPs are stored temporarily in server memory.
//
// Example:
// pendingUsers[email] = {
//     name,
//     username,
//     password,
//     basic,
//     pf,
//     otp,
//     otpExpiry
// }

const pendingUsers = {};


// ======================================================
// READ USERS
// ======================================================

function getUsers() {

    if (!fs.existsSync("users.json")) {
        fs.writeFileSync("users.json", "[]");
    }

    return JSON.parse(
        fs.readFileSync("users.json", "utf8")
    );
}


// ======================================================
// SAVE USERS
// ======================================================

function saveUsers(users) {

    fs.writeFileSync(
        "users.json",
        JSON.stringify(users, null, 2)
    );
}


// ======================================================
// GENERATE OTP
// ======================================================

function generateOTP() {

    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
}


// ======================================================
// SEND OTP EMAIL
// ======================================================

async function sendOTPEmail(email, otp) {

    const mailOptions = {
        from: `"Employee Salary System" <${process.env.EMAIL_USER}>`,

        to: email,

        subject: "Employee Salary System - Email Verification",

        html: `
            <div style="
                font-family: Arial;
                max-width: 500px;
                margin: auto;
                padding: 30px;
                background: #f5f5f5;
            ">

                <div style="
                    background: white;
                    padding: 25px;
                    border-radius: 10px;
                    text-align: center;
                ">

                    <h2>Employee Salary System</h2>

                    <p>Your email verification OTP is:</p>

                    <h1 style="
                        color: #2563eb;
                        letter-spacing: 8px;
                    ">
                        ${otp}
                    </h1>

                    <p>
                        This OTP is valid for
                        <b>5 minutes</b>.
                    </p>

                    <p>
                        Do not share this OTP with anyone.
                    </p>

                </div>

            </div>
        `
    };

    return transporter.sendMail(mailOptions);
}


// ======================================================
// HTML HEADER
// ======================================================

function htmlStart(title) {

    return `
        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <meta name="viewport"
                  content="width=device-width, initial-scale=1.0">

            <title>${title}</title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    font-family: Arial, sans-serif;
                    background: #f4f6f8;
                }

                .container {
                    width: 420px;
                    max-width: 90%;
                    margin: 50px auto;
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                }

                h1, h2 {
                    text-align: center;
                }

                label {
                    display: block;
                    margin-top: 15px;
                    font-weight: bold;
                }

                input {
                    width: 100%;
                    padding: 12px;
                    margin-top: 7px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 15px;
                }

                button {
                    width: 100%;
                    padding: 12px;
                    margin-top: 20px;
                    border: none;
                    border-radius: 6px;
                    background: #2563eb;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                }

                button:hover {
                    background: #1d4ed8;
                }

                .link {
                    display: block;
                    text-align: center;
                    margin-top: 20px;
                }

                .success {
                    color: green;
                    text-align: center;
                }

                .error {
                    color: red;
                    text-align: center;
                }

                .otp {
                    text-align: center;
                    font-size: 28px;
                    letter-spacing: 8px;
                }

                .salary-slip {
                    width: 600px;
                    max-width: 95%;
                    margin: 40px auto;
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                }

                .salary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 15px 5px;
                    border-bottom: 1px solid #ddd;
                    font-size: 17px;
                }

                .total {
                    font-size: 22px;
                    font-weight: bold;
                    margin-top: 10px;
                }

                .logout {
                    display: block;
                    text-align: center;
                    margin-top: 25px;
                }

            </style>

        </head>

        <body>
    `;
}


// ======================================================
// HTML FOOTER
// ======================================================

function htmlEnd() {

    return `
        </body>
        </html>
    `;
}


// ======================================================
// CREATE SERVER
// ======================================================

const server = http.createServer((req, res) => {


    // ==================================================
    // HOME PAGE
    // ==================================================

    if (req.method === "GET" && req.url === "/") {

        res.writeHead(302, {
            "Location": "/login"
        });

        res.end();

        return;
    }


    // ==================================================
    // SIGNUP PAGE
    // ==================================================

    if (req.method === "GET" && req.url === "/signup") {

        res.writeHead(200, {
            "Content-Type": "text/html; charset=UTF-8"
        });

        res.end(

            htmlStart("Employee Signup") +

            `

            <div class="container">

                <h2>
                    Employee Signup
                </h2>

                <form method="POST"
                      action="/send-otp">

                    <label>
                        Employee Name
                    </label>

                    <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        required
                    >


                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        required
                    >


                    <label>
                        Username
                    </label>

                    <input
                        type="text"
                        name="username"
                        placeholder="Create username"
                        required
                    >


                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        name="password"
                        placeholder="Create password"
                        required
                    >


                    <label>
                        Basic Salary
                    </label>

                    <input
                        type="number"
                        name="basic"
                        placeholder="Enter basic salary"
                        required
                    >


                    <label>
                        PF Deduction
                    </label>

                    <input
                        type="number"
                        name="pf"
                        placeholder="Enter PF deduction"
                        required
                    >


                    <button type="submit">
                        Send OTP
                    </button>

                </form>


                <a class="link"
                   href="/login">

                    Already have an account?
                    Login

                </a>

            </div>

            ` +

            htmlEnd()
        );

        return;
    }


    // ==================================================
    // SEND OTP
    // ==================================================

    if (req.method === "POST" && req.url === "/send-otp") {

        let body = "";

        req.on("data", chunk => {

            body += chunk;

        });


        req.on("end", async () => {

            const data = querystring.parse(body);

            const name = data.name;
            const email = data.email;
            const username = data.username;
            const password = data.password;

            const basic = Number(data.basic);
            const pf = Number(data.pf);


            // ------------------------------------------
            // CHECK DATA
            // ------------------------------------------

            if (
                !name ||
                !email ||
                !username ||
                !password ||
                !basic ||
                pf < 0
            ) {

                res.writeHead(200, {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                });

                res.end(

                    htmlStart("Signup Error") +

                    `
                    <div class="container">

                        <h2 class="error">
                            Invalid Information
                        </h2>

                        <p>
                            Please fill all fields correctly.
                        </p>

                        <a class="link"
                           href="/signup">
                            Go Back
                        </a>

                    </div>
                    ` +

                    htmlEnd()
                );

                return;
            }


            // ------------------------------------------
            // GET USERS
            // ------------------------------------------

            const users = getUsers();


            // ------------------------------------------
            // CHECK EMAIL
            // ------------------------------------------

            const emailExists = users.find(
                user =>
                    user.email.toLowerCase() ===
                    email.toLowerCase()
            );


            if (emailExists) {

                res.writeHead(200, {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                });

                res.end(

                    htmlStart("Signup Error") +

                    `
                    <div class="container">

                        <h2 class="error">
                            Email Already Registered
                        </h2>

                        <p>
                            This email is already registered.
                        </p>

                        <a class="link"
                           href="/login">
                            Go to Login
                        </a>

                    </div>
                    ` +

                    htmlEnd()
                );

                return;
            }


            // ------------------------------------------
            // CHECK USERNAME
            // ------------------------------------------

            const usernameExists = users.find(
                user =>
                    user.username.toLowerCase() ===
                    username.toLowerCase()
            );


            if (usernameExists) {

                res.writeHead(200, {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                });

                res.end(

                    htmlStart("Signup Error") +

                    `
                    <div class="container">

                        <h2 class="error">
                            Username Already Exists
                        </h2>

                        <p>
                            Please choose another username.
                        </p>

                        <a class="link"
                           href="/signup">
                            Go Back
                        </a>

                    </div>
                    ` +

                    htmlEnd()
                );

                return;
            }


            // ------------------------------------------
            // GENERATE OTP
            // ------------------------------------------

            const otp = generateOTP();

            const otpExpiry =
                Date.now() + (5 * 60 * 1000);


            // ------------------------------------------
            // SAVE TEMPORARY USER
            // ------------------------------------------

            pendingUsers[email.toLowerCase()] = {

                name,
                email,
                username,
                password,
                basic,
                pf,

                otp,

                otpExpiry
            };


            // ------------------------------------------
            // SEND EMAIL
            // ------------------------------------------

            try {

                await sendOTPEmail(email, otp);


                console.log(
                    `OTP sent to ${email}`
                );


                // --------------------------------------
                // OTP PAGE
                // --------------------------------------

                res.writeHead(200, {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                });


                res.end(

                    htmlStart("Verify Email") +

                    `

                    <div class="container">

                        <h2>
                            Verify Your Email
                        </h2>

                        <p style="text-align:center;">
                            OTP sent to:
                        </p>

                        <p style="
                            text-align:center;
                            font-weight:bold;
                        ">
                            ${email}
                        </p>


                        <form method="POST"
                              action="/verify-otp">

                            <input
                                type="hidden"
                                name="email"
                                value="${email}"
                            >


                            <label>
                                Enter 6-Digit OTP
                            </label>

                            <input
                                class="otp"
                                type="text"
                                name="otp"
                                maxlength="6"
                                pattern="[0-9]{6}"
                                placeholder="000000"
                                required
                            >


                            <button type="submit">
                                Verify OTP
                            </button>

                        </form>


                        <p style="
                            text-align:center;
                            margin-top:20px;
                        ">

                            OTP is valid for
                            <b>5 minutes</b>.

                        </p>

                    </div>

                    ` +

                    htmlEnd()
                );


            } catch (error) {

                console.log(error);


                delete pendingUsers[email.toLowerCase()];


                res.writeHead(200, {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                });


                res.end(

                    htmlStart("Email Error") +

                    `

                    <div class="container">

                        <h2 class="error">
                            Unable to Send OTP
                        </h2>

                        <p>
                            Please check your Gmail
                            configuration.
                        </p>

                        <a class="link"
                           href="/signup">

                            Try Again

                        </a>

                    </div>

                    ` +

                    htmlEnd()
                );
            }

        });

        return;
    }


    // ==================================================
    // VERIFY OTP
    // ==================================================

    if (req.method === "POST" && req.url === "/verify-otp") {

        let body = "";

        req.on("data", chunk => {

            body += chunk;

        });


        req.on("end", () => {

            const data = querystring.parse(body);

            const email =
                data.email.toLowerCase();

            const enteredOTP =
                data.otp;


            // ------------------------------------------
            // FIND PENDING USER
            // ------------------------------------------

            const pendingUser =
                pendingUsers[email];


            if (!pendingUser) {

                res.writeHead(200, {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                });

                res.end(

                    htmlStart("OTP Error") +

                    `

                    <div class="container">

                        <h2 class="error">
                            OTP Not Found
                        </h2>

                        <p>
                            Please signup again
                            and request a new OTP.
                        </p>

                        <a class="link"
                           href="/signup">
                            Signup Again
                        </a>

                    </div>

                    ` +

                    htmlEnd()
                );

                return;
            }


            // ------------------------------------------
            // CHECK OTP EXPIRY
            // ------------------------------------------

            if (Date.now() > pendingUser.otpExpiry) {

                delete pendingUsers[email];


                res.writeHead(200, {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                });

                res.end(

                    htmlStart("OTP Expired") +

                    `

                    <div class="container">

                        <h2 class="error">
                            OTP Expired
                        </h2>

                        <p>
                            Your OTP has expired.
                        </p>

                        <a class="link"
                           href="/signup">
                            Request New OTP
                        </a>

                    </div>

                    ` +

                    htmlEnd()
                );

                return;
            }


            // ------------------------------------------
            // CHECK OTP
            // ------------------------------------------

            if (enteredOTP !== pendingUser.otp) {

                res.writeHead(200, {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                });

                res.end(

                    htmlStart("Invalid OTP") +

                    `

                    <div class="container">

                        <h2 class="error">
                            Invalid OTP
                        </h2>

                        <p>
                            The OTP you entered is incorrect.
                        </p>

                        <a class="link"
                           href="/signup">
                            Signup Again
                        </a>

                    </div>

                    ` +

                    htmlEnd()
                );

                return;
            }


            // ------------------------------------------
            // OTP VERIFIED
            // ------------------------------------------

            const users = getUsers();


            const newUser = {

                name: pendingUser.name,

                email: pendingUser.email,

                username: pendingUser.username,

                password: pendingUser.password,

                basic: pendingUser.basic,

                pf: pendingUser.pf,

                emailVerified: true
            };


            users.push(newUser);


            // ------------------------------------------
            // SAVE USER
            // ------------------------------------------

            saveUsers(users);


            // ------------------------------------------
            // DELETE TEMPORARY USER
            // ------------------------------------------

            delete pendingUsers[email];


            // ------------------------------------------
            // SUCCESS PAGE
            // ------------------------------------------

            res.writeHead(200, {
                "Content-Type":
                    "text/html; charset=UTF-8"
            });


            res.end(

                htmlStart("Signup Successful") +

                `

                <div class="container">

                    <h2 class="success">
                        ✓ Email Verified
                    </h2>

                    <p style="
                        text-align:center;
                    ">
                        Your account has been
                        created successfully.
                    </p>

                    <p style="
                        text-align:center;
                    ">
                        You can now login and
                        view your salary slip.
                    </p>


                    <a class="link"
                       href="/login">

                        Go to Login

                    </a>

                </div>

                ` +

                htmlEnd()
            );

        });

        return;
    }


    // ==================================================
    // LOGIN PAGE
    // ==================================================

    if (req.method === "GET" && req.url === "/login") {

        res.writeHead(200, {
            "Content-Type":
                "text/html; charset=UTF-8"
        });


        res.end(

            htmlStart("Employee Login") +

            `

            <div class="container">

                <h2>
                    Employee Login
                </h2>


                <form method="POST"
                      action="/login">


                    <label>
                        Username
                    </label>

                    <input
                        type="text"
                        name="username"
                        placeholder="Enter username"
                        required
                    >


                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        required
                    >


                    <button type="submit">
                        Login
                    </button>

                </form>


                <a class="link"
                   href="/signup">

                    Create New Account

                </a>

            </div>

            ` +

            htmlEnd()
        );

        return;
    }


    // ==================================================
    // LOGIN PROCESS
    // ==================================================

    if (req.method === "POST" && req.url === "/login") {

        let body = "";

        req.on("data", chunk => {

            body += chunk;

        });


        req.on("end", () => {

            const data = querystring.parse(body);

            const users = getUsers();


            // ------------------------------------------
            // FIND USER
            // ------------------------------------------

            const employee = users.find(

                user =>

                    user.username.toLowerCase() ===
                    data.username.toLowerCase()

                    &&

                    user.password ===
                    data.password

            );


            // ------------------------------------------
            // INVALID LOGIN
            // ------------------------------------------

            if (!employee) {

                res.writeHead(200, {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                });


                res.end(

                    htmlStart("Login Failed") +

                    `

                    <div class="container">

                        <h2 class="error">
                            Invalid Login
                        </h2>

                        <p style="
                            text-align:center;
                        ">
                            Username or password
                            is incorrect.
                        </p>

                        <a class="link"
                           href="/login">

                            Try Again

                        </a>

                    </div>

                    ` +

                    htmlEnd()
                );

                return;
            }


            // ------------------------------------------
            // SALARY CALCULATION
            // ------------------------------------------

            const basic =
                employee.basic;

            const hra =
                basic * 0.20;

            const da =
                basic * 0.10;

            const netSalary =
                basic +
                hra +
                da -
                employee.pf;


            // ------------------------------------------
            // SALARY SLIP
            // ------------------------------------------

            res.writeHead(200, {
                "Content-Type":
                    "text/html; charset=UTF-8"
            });


            res.end(

                htmlStart("Salary Slip") +

                `

                <div class="salary-slip">

                    <h1>
                        Employee Salary Slip
                    </h1>

                    <hr>


                    <div class="salary-row">

                        <span>
                            Employee Name
                        </span>

                        <span>
                            ${employee.name}
                        </span>

                    </div>


                    <div class="salary-row">

                        <span>
                            Email
                        </span>

                        <span>
                            ${employee.email}
                        </span>

                    </div>


                    <div class="salary-row">

                        <span>
                            Username
                        </span>

                        <span>
                            ${employee.username}
                        </span>

                    </div>


                    <div class="salary-row">

                        <span>
                            Basic Salary
                        </span>

                        <span>
                            &#8377;${basic}
                        </span>

                    </div>


                    <div class="salary-row">

                        <span>
                            HRA (20%)
                        </span>

                        <span>
                            &#8377;${hra}
                        </span>

                    </div>


                    <div class="salary-row">

                        <span>
                            DA (10%)
                        </span>

                        <span>
                            &#8377;${da}
                        </span>

                    </div>


                    <div class="salary-row">

                        <span>
                            PF Deduction
                        </span>

                        <span>
                            &#8377;${employee.pf}
                        </span>

                    </div>


                    <hr>


                    <div class="salary-row total">

                        <span>
                            Net Salary
                        </span>

                        <span>
                            &#8377;${netSalary}
                        </span>

                    </div>


                    <a class="logout"
                       href="/login">

                        Logout

                    </a>

                </div>

                ` +

                htmlEnd()
            );

        });

        return;
    }


    // ==================================================
    // PAGE NOT FOUND
    // ==================================================

    res.writeHead(404, {
        "Content-Type":
            "text/html; charset=UTF-8"
    });


    res.end(`

        <h1>
            404 - Page Not Found
        </h1>

        <a href="/login">
            Go to Login
        </a>

    `);

});


// ======================================================
// START SERVER
// ======================================================

server.listen(PORT, () => {

    console.log("");
    console.log("==============================");
    console.log("Employee Salary System");
    console.log("==============================");
    console.log("");
    console.log(
        `Server running at http://localhost:${PORT}`
    );
    console.log("");

});