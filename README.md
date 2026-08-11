# 💼 Employee Salary Management System

A simple and practical **Node.js Employee Salary Management System** that allows employees to register through a browser, verify their email using a **6-digit OTP**, log in, and view their calculated salary slip.
Also you can print the pdf in the pdf format
The project uses **Node.js, Nodemailer, Gmail SMTP, JSON file storage, HTML, CSS, and dotenv**.

---

## 🚀 Features

- 📝 Employee Signup
- 📧 Email OTP Verification
- 🔐 Employee Login
- 💾 Employee data stored in JSON file
- 💰 Automatic salary calculation
- 📊 Employee salary slip
- ⏱️ OTP expires after 5 minutes
- 🔒 Gmail credentials stored in `.env`
- 🌐 Browser-based application
- ⚡ Uses Node.js core HTTP module
- 📱 Simple responsive UI
- 🚫 No database required
- 🚫 No Express required

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| Node.js | Backend server |
| HTTP Module | Create web server |
| File System (`fs`) | Store employee data |
| Nodemailer | Send OTP emails |
| Gmail SMTP | Email delivery |
| dotenv | Environment variables |
| Querystring | Process form data |
| HTML | Frontend |
| CSS | User interface |
| JSON | Data storage |

---




## 📂 Project Structure

```text
EmployeeSalary/
│
├── server.js
├── users.json
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── node_modules/
