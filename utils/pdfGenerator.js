const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateSalarySlipPDF = async (salarySlip, companyInfo) => {
    try {
        // Create an HTML template for the salary slip
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 20px; }
                .company-name { font-size: 24px; font-weight: bold; color: #667eea; }
                .company-address { font-size: 12px; color: #777; margin-top: 5px; }
                .title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; background: #f0f0ff; padding: 10px; }
                .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
                .info-table td { padding: 5px; }
                .info-table td:nth-child(odd) { font-weight: bold; color: #555; width: 15%; }
                .info-table td:nth-child(even) { width: 35%; }
                .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .salary-table th { background-color: #f7f8fc; }
                .salary-table th:last-child, .salary-table td:last-child { text-align: right; }
                .net-salary { background-color: #eef7ee; font-size: 16px; font-weight: bold; text-align: right; padding: 15px; border: 1px solid #ddd; border-top: none; }
                .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
                .sig-box { text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 5px; }
                .footer { text-align: center; font-size: 10px; color: #999; margin-top: 40px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">${companyInfo.name}</div>
                <div class="company-address">${companyInfo.address}</div>
            </div>

            <div class="title">Salary Slip for ${salarySlip.month} / ${salarySlip.year}</div>

            <table class="info-table">
                <tr>
                    <td>Employee ID:</td><td>${salarySlip.salarySnapshot.employee.employeeId}</td>
                    <td>Name:</td><td>${salarySlip.salarySnapshot.employee.name}</td>
                </tr>
                <tr>
                    <td>Department:</td><td>${salarySlip.employee?.department?.name || 'N/A'}</td>
                    <td>Designation:</td><td>${salarySlip.employee?.designation?.name || 'N/A'}</td>
                </tr>
                <tr>
                    <td>Slip Number:</td><td>${salarySlip.slipNumber}</td>
                    <td>Generated On:</td><td>${new Date(salarySlip.generatedAt).toLocaleDateString()}</td>
                </tr>
                <tr>
                    <td>Working Days:</td><td>${salarySlip.salarySnapshot.workingDays}</td>
                    <td>Present Days:</td><td>${salarySlip.salarySnapshot.presentDays}</td>
                </tr>
            </table>

            <table class="salary-table">
                <tr>
                    <th colspan="2">Earnings</th>
                    <th colspan="2">Deductions</th>
                </tr>
                <tr>
                    <td>Basic Salary</td><td>₹${salarySlip.salarySnapshot.basicSalary.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td>PF</td><td>₹${salarySlip.salarySnapshot.pf.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <td>HRA</td><td>₹${salarySlip.salarySnapshot.hra.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td>Professional Tax</td><td>₹${salarySlip.salarySnapshot.professionalTax.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <td>Conveyance</td><td>₹${salarySlip.salarySnapshot.conveyanceAllowance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td>TDS</td><td>₹${salarySlip.salarySnapshot.tds.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <td>Medical</td><td>₹${salarySlip.salarySnapshot.medicalAllowance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td>Insurance</td><td>₹${salarySlip.salarySnapshot.insurance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <td>Special</td><td>₹${salarySlip.salarySnapshot.specialAllowance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td>Loan/Advance</td><td>₹${salarySlip.salarySnapshot.loanAdvance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <td>Bonus/Other</td><td>₹${(salarySlip.salarySnapshot.bonus + salarySlip.salarySnapshot.otherEarnings + salarySlip.salarySnapshot.overtime).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td>Other Deductions</td><td>₹${salarySlip.salarySnapshot.otherDeductions.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <th>Gross Earnings</th><th>₹${salarySlip.salarySnapshot.grossSalary.toLocaleString('en-IN', {minimumFractionDigits: 2})}</th>
                    <th>Total Deductions</th><th>₹${salarySlip.salarySnapshot.totalDeductions.toLocaleString('en-IN', {minimumFractionDigits: 2})}</th>
                </tr>
            </table>

            <div class="net-salary">
                Net Salary Payable: ₹${salarySlip.salarySnapshot.netSalary.toLocaleString('en-IN', {minimumFractionDigits: 2})}
            </div>

            <div class="signatures">
                <div class="sig-box">Employee Signature</div>
                <div class="sig-box">Authorized Signatory</div>
            </div>

            <div class="footer">This is a system generated salary slip and does not require a physical signature.</div>
        </body>
        </html>
        `;

        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const fileName = `${salarySlip.slipNumber}.pdf`;
        const filePath = path.join(__dirname, '..', 'uploads', fileName);

        await page.pdf({ path: filePath, format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
        await browser.close();

        return `/uploads/${fileName}`;

    } catch (error) {
        console.error('PDF Generation Error:', error);
        return null;
    }
};

module.exports = { generateSalarySlipPDF };
