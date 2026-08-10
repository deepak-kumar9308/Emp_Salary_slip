require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");

const {
    generateOTP,
    saveOTP,
    verifyOTP
} = require("./modules/otp");

const {
    sendOTPEmail,
    verifyEmailConfiguration
} = require("./modules/email");

const {
    getUsers,
    addUser,
    findByEmail,
    findByUsername
} = require("./modules/users");

const {
    calculateSalary
} = require("./modules/salary");

const PORT = 3000;

let sessions = new Map();

function sendHTML(res, fileName) {

    const filePath = path.join(
        __dirname,
        "pages",
        fileName
    );

    fs.readFile(filePath, "utf8", (error, data) => {

        if (error) {

            res.writeHead(500, {
                "Content-Type": "text/plain"
            });

            res.end("Unable to load page.");

            return;
        }

        res.writeHead(200, {
            "Content-Type": "text/html"
        });

        res.end(data);
    });
}

function sendJSON(res, statusCode, data) {

    res.writeHead(statusCode, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(data));
}

function getRequestBody(req) {

    return new Promise((resolve, reject) => {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            resolve(
                querystring.parse(body)
            );

        });

        req.on("error", reject);
    });
}

function getSessionUser(req) {

    const cookies = req.headers.cookie;

    if (!cookies) {
        return null;
    }

    const sessionCookie = cookies
        .split(";")
        .find(cookie =>
            cookie.trim().startsWith("sessionId=")
        );

    if (!sessionCookie) {
        return null;
    }

    const sessionId = sessionCookie
        .split("=")[1];

    return sessions.get(sessionId) || null;
}

function createSession(res, user) {

    const sessionId =
        Date.now().toString() +
        Math.random().toString(36).substring(2);

    sessions.set(sessionId, user);

    res.setHeader(
        "Set-Cookie",
        `sessionId=${sessionId}; HttpOnly; Path=/`
    );
}

function redirect(res, location) {

    res.writeHead(302, {
        Location: location
    });

    res.end();
}

function validateSalaryInput(basic, pf) {

    const basicSalary = Number(basic);
    const pfAmount = Number(pf);

    if (
        !Number.isFinite(basicSalary) ||
        !Number.isFinite(pfAmount)
    ) {
        return false;
    }

    if (
        basicSalary < 0 ||
        pfAmount < 0
    ) {
        return false;
    }

    return true;
}

const server = http.createServer(
    async (req, res) => {

        try {

            /*
            ========================================
            HOME
            ========================================
            */

            if (
                req.method === "GET" &&
                req.url === "/"
            ) {

                redirect(res, "/login.html");

                return;
            }

            /*
            ========================================
            SIGNUP PAGE
            ========================================
            */

            if (
                req.method === "GET" &&
                (
                    req.url === "/signup" ||
                    req.url === "/signup.html"
                )
            ) {

                sendHTML(res, "signup.html");

                return;
            }

            /*
            ========================================
            OTP PAGE
            ========================================
            */

            if (
                req.method === "GET" &&
                (
                    req.url === "/verify-otp" ||
                    req.url === "/verify-otp.html"
                )
            ) {

                sendHTML(res, "verify-otp.html");

                return;
            }

            /*
            ========================================
            LOGIN PAGE
            ========================================
            */

            if (
                req.method === "GET" &&
                (
                    req.url === "/login" ||
                    req.url === "/login.html"
                )
            ) {

                sendHTML(res, "login.html");

                return;
            }

            /*
            ========================================
            SALARY PAGE
            ========================================
            */

            if (
                req.method === "GET" &&
                (
                    req.url === "/salary-slip" ||
                    req.url === "/salary-slip.html"
                )
            ) {

                const user =
                    getSessionUser(req);

                if (!user) {

                    redirect(
                        res,
                        "/login.html"
                    );

                    return;
                }

                sendHTML(
                    res,
                    "salary-slip.html"
                );

                return;
            }

            /*
            ========================================
            USER DATA API
            ========================================
            */

            if (
                req.method === "GET" &&
                req.url === "/api/user"
            ) {

                const user =
                    getSessionUser(req);

                if (!user) {

                    sendJSON(res, 401, {
                        success: false,
                        message: "Not logged in."
                    });

                    return;
                }

                const salary =
                    calculateSalary(
                        user.basic,
                        user.pf
                    );

                sendJSON(res, 200, {

                    success: true,

                    user: {
                        name: user.name,
                        email: user.email,
                        username: user.username
                    },

                    salary
                });

                return;
            }

            /*
            ========================================
            SEND OTP
            ========================================
            */

            if (
                req.method === "POST" &&
                req.url === "/send-otp"
            ) {

                const body =
                    await getRequestBody(req);

                const name =
                    String(body.name || "").trim();

                const email =
                    String(body.email || "")
                        .trim()
                        .toLowerCase();

                const username =
                    String(body.username || "")
                        .trim();

                const password =
                    String(body.password || "");

                const basic =
                    String(body.basic || "").trim();

                const pf =
                    String(body.pf || "").trim();

                /*
                Validate input
                */

                if (
                    !name ||
                    !email ||
                    !username ||
                    !password ||
                    !basic ||
                    !pf
                ) {

                    sendJSON(res, 400, {
                        success: false,
                        message:
                            "Please fill all fields."
                    });

                    return;
                }

                /*
                Basic email validation
                */

                const emailPattern =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (
                    !emailPattern.test(email)
                ) {

                    sendJSON(res, 400, {
                        success: false,
                        message:
                            "Please enter a valid email."
                    });

                    return;
                }

                /*
                Salary validation
                */

                if (
                    !validateSalaryInput(
                        basic,
                        pf
                    )
                ) {

                    sendJSON(res, 400, {
                        success: false,
                        message:
                            "Enter valid salary values."
                    });

                    return;
                }

                /*
                Check existing email
                */

                if (findByEmail(email)) {

                    sendJSON(res, 400, {
                        success: false,
                        message:
                            "Email already registered."
                    });

                    return;
                }

                /*
                Check existing username
                */

                if (
                    findByUsername(username)
                ) {

                    sendJSON(res, 400, {
                        success: false,
                        message:
                            "Username already exists."
                    });

                    return;
                }

                /*
                Generate OTP
                */

                const otp =
                    generateOTP();

                /*
                Temporary user data
                */

                const userData = {

                    name,

                    email,

                    username,

                    password,

                    basic: Number(basic),

                    pf: Number(pf),

                    emailVerified: true
                };

                /*
                Save OTP
                */

                saveOTP(
                    email,
                    otp,
                    userData
                );

                /*
                Send email
                */

                try {

                    await sendOTPEmail(
                        email,
                        otp
                    );

                    console.log(
                        `OTP sent to ${email}`
                    );

                    sendJSON(res, 200, {

                        success: true,

                        message:
                            "OTP sent successfully."

                    });

                } catch (error) {

                    console.log(
                        "Email error:",
                        error.message
                    );

                    sendJSON(res, 500, {

                        success: false,

                        message:
                            "Unable to send OTP. Check Gmail configuration."

                    });
                }

                return;
            }

            /*
            ========================================
            VERIFY OTP
            ========================================
            */

            if (
                req.method === "POST" &&
                req.url === "/verify-otp"
            ) {

                const body =
                    await getRequestBody(req);

                const email =
                    String(body.email || "")
                        .trim()
                        .toLowerCase();

                const otp =
                    String(body.otp || "")
                        .trim();

                if (!email || !otp) {

                    sendJSON(res, 400, {

                        success: false,

                        message:
                            "Email and OTP are required."

                    });

                    return;
                }

                const result =
                    verifyOTP(
                        email,
                        otp
                    );

                if (!result.success) {

                    sendJSON(res, 400, result);

                    return;
                }

                /*
                Save verified user
                */

                addUser(
                    result.userData
                );

                sendJSON(res, 200, {

                    success: true,

                    message:
                        "Email verified successfully. Account created.",

                    redirect:
                        "/login.html"

                });

                return;
            }

            /*
            ========================================
            LOGIN
            ========================================
            */

            if (
                req.method === "POST" &&
                req.url === "/login"
            ) {

                const body =
                    await getRequestBody(req);

                const username =
                    String(body.username || "")
                        .trim();

                const password =
                    String(body.password || "");

                if (
                    !username ||
                    !password
                ) {

                    sendJSON(res, 400, {

                        success: false,

                        message:
                            "Username and password are required."

                    });

                    return;
                }

                const user =
                    findByUsername(
                        username
                    );

                if (!user) {

                    sendJSON(res, 401, {

                        success: false,

                        message:
                            "Invalid username or password."

                    });

                    return;
                }

                if (
                    user.password !== password
                ) {

                    sendJSON(res, 401, {

                        success: false,

                        message:
                            "Invalid username or password."

                    });

                    return;
                }

                if (
                    user.emailVerified !== true
                ) {

                    sendJSON(res, 403, {

                        success: false,

                        message:
                            "Please verify your email first."

                    });

                    return;
                }

                /*
                Create session
                */

                createSession(
                    res,
                    user
                );

                sendJSON(res, 200, {

                    success: true,

                    message:
                        "Login successful.",

                    redirect:
                        "/salary-slip.html"

                });

                return;
            }

            /*
            ========================================
            LOGOUT
            ========================================
            */

            if (
                req.method === "GET" &&
                req.url === "/logout"
            ) {

                const cookies =
                    req.headers.cookie;

                if (cookies) {

                    const sessionCookie =
                        cookies
                            .split(";")
                            .find(cookie =>
                                cookie
                                    .trim()
                                    .startsWith(
                                        "sessionId="
                                    )
                            );

                    if (sessionCookie) {

                        const sessionId =
                            sessionCookie
                                .split("=")[1];

                        sessions.delete(
                            sessionId
                        );
                    }
                }

                res.setHeader(
                    "Set-Cookie",
                    "sessionId=; HttpOnly; Path=/; Max-Age=0"
                );

                redirect(
                    res,
                    "/login.html"
                );

                return;
            }

            /*
            ========================================
            404
            ========================================
            */

            res.writeHead(404, {
                "Content-Type": "text/html"
            });

            res.end(`
                <h1>404 - Page Not Found</h1>
                <p>The requested page does not exist.</p>
            `);

        } catch (error) {

            console.log(
                "Server error:",
                error
            );

            sendJSON(res, 500, {

                success: false,

                message:
                    "Internal server error."

            });
        }
    }
);

server.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================"
        );
        console.log(
            "   Employee Salary Management"
        );
        console.log(
            "================================"
        );
        console.log("");

        console.log(
            `Server running at http://localhost:${PORT}`
        );

        verifyEmailConfiguration();
    }
);