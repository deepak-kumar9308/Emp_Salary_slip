# Complete Employee Management & Salary System (EMS)

A full-featured, professional Node.js backend system tailored for HR, Payroll, and Employee Management, backed by MongoDB.

## Features

*   **Role-Based Access Control (RBAC):** Distinct interfaces and permissions for Admin/HR and standard Employees.
*   **Employee Management:** Complete CRUD operations for employees with soft/hard delete and department/designation assignments.
*   **Attendance Tracking:** Mark attendance (Present, Absent, Late, WFH) with duplicate prevention and monthly aggregation.
*   **Leave Management:** Request leaves, HR approval workflow, and automatic employee status updates (e.g., setting to "On Leave").
*   **Automated Payroll Generation:** 
    *   Generates monthly payroll for all employees at the click of a button.
    *   Automatically calculates LOP (Loss of Pay) based on unpaid leaves and absences.
    *   Handles Basic Salary, HRA, Conveyance, PF, Professional Tax, TDS, and more.
*   **PDF Salary Slips:** Automatic generation of professional PDF salary slips using Puppeteer.
*   **Smart Salary Insights:** AI-driven analytics, high deduction alerts, top earners, department salary comparisons, and a 6-month payroll linear regression forecast.
*   **Notification System:** Internal alerts for new employees, leave approvals, and generated salary slips.

## Technology Stack

*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Authentication:** JWT (JSON Web Tokens), bcryptjs
*   **File Uploads / PDF:** Multer (for profile photos), Puppeteer (for generating PDFs)
*   **Frontend:** Vanilla HTML/CSS/JS (fetch API)

## Installation

1.  **Clone the repository / open the folder.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Setup Environment Variables:**
    Create or update your `.env` file in the root directory:
    ```env
    PORT=3000
    MONGO_URI=mongodb://127.0.0.1:27017/ems_db
    JWT_SECRET=your_super_secret_jwt_key
    NODE_ENV=development
    COMPANY_NAME=Tech Innovations Inc.
    COMPANY_ADDRESS=123 Innovation Drive, Tech City
    ```
4.  **Create Uploads Directory:**
    Ensure there is an `uploads/` folder in the root directory for PDFs and Profile photos:
    ```bash
    mkdir uploads
    ```
5.  **Start the Server:**
    ```bash
    node server.js
    # or
    npm run dev # if you use nodemon
    ```

## Usage Flow

1.  Go to `http://localhost:3000/signup.html`.
2.  Create your first user and set the Role to **Admin**.
3.  Verify OTP (Default is mocked to succeed if OTP is sent, or check your console).
4.  You will be redirected to the **Admin Dashboard**.
5.  From the sidebar, navigate to **Departments** and create a department.
6.  Navigate to **Employees** and add an employee (you can choose to auto-create a user account for them).
7.  Navigate to **Attendance** and **Leaves** to add records.
8.  Navigate to **Payroll** and click **Generate Payroll** to process salaries.
9.  Navigate to **Smart Insights** to view analytics based on the generated payroll!
