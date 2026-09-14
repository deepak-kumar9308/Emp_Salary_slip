/**
 * Salary Calculation Service
 * All salary math happens HERE — never trust frontend values
 */

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];

/**
 * Calculate full salary structure from basic salary
 */
const calculateSalaryComponents = (basicSalary) => {
    const basic = Math.max(0, Number(basicSalary) || 0);

    // Earnings
    const hra                = +(basic * 0.20).toFixed(2);       // 20% of basic
    const conveyanceAllowance = +(basic * 0.05).toFixed(2);      // 5% of basic
    const medicalAllowance   = 1500;                              // flat ₹1500
    const specialAllowance   = +(basic * 0.10).toFixed(2);       // 10% of basic

    const grossSalary = +(basic + hra + conveyanceAllowance + medicalAllowance + specialAllowance).toFixed(2);

    // Deductions
    const pf             = +(basic * 0.12).toFixed(2);            // 12% of basic (PF)
    const professionalTax = basic <= 10000 ? 0 : basic <= 20000 ? 150 : 200; // Slab-based
    const tds            = +(grossSalary * 0.05).toFixed(2);      // 5% TDS on gross

    const totalDeductions = +(pf + professionalTax + tds).toFixed(2);
    const netSalary       = +(grossSalary - totalDeductions).toFixed(2);

    return {
        basicSalary: basic,
        hra,
        conveyanceAllowance,
        medicalAllowance,
        specialAllowance,
        bonus: 0,
        overtime: 0,
        otherEarnings: 0,
        grossSalary,
        pf,
        professionalTax,
        tds,
        insurance: 0,
        loanAdvance: 0,
        otherDeductions: 0,
        totalDeductions,
        netSalary
    };
};

/**
 * Apply attendance-based deductions to salary
 * Unpaid leave deducts proportional daily salary
 */
const applyAttendanceImpact = (components, workingDays, presentDays, unpaidLeaveDays) => {
    if (!workingDays || workingDays <= 0) return components;

    const perDaySalary = +(components.basicSalary / workingDays).toFixed(2);
    const unpaidDeduction = +(perDaySalary * unpaidLeaveDays).toFixed(2);

    const adjusted = { ...components };
    adjusted.otherDeductions = +(adjusted.otherDeductions + unpaidDeduction).toFixed(2);
    adjusted.totalDeductions = +(adjusted.totalDeductions + unpaidDeduction).toFixed(2);
    adjusted.netSalary = +(adjusted.grossSalary - adjusted.totalDeductions).toFixed(2);

    return adjusted;
};

/**
 * Merge custom overrides (bonus, overtime, extra deductions) into components
 */
const mergeOverrides = (components, overrides = {}) => {
    const merged = { ...components };

    if (overrides.bonus)           merged.bonus         = +Number(overrides.bonus).toFixed(2);
    if (overrides.overtime)        merged.overtime      = +Number(overrides.overtime).toFixed(2);
    if (overrides.otherEarnings)   merged.otherEarnings = +Number(overrides.otherEarnings).toFixed(2);
    if (overrides.insurance)       merged.insurance     = +Number(overrides.insurance).toFixed(2);
    if (overrides.loanAdvance)     merged.loanAdvance   = +Number(overrides.loanAdvance).toFixed(2);
    if (overrides.otherDeductions) merged.otherDeductions = +Number(overrides.otherDeductions).toFixed(2);

    // Recalculate totals
    merged.grossSalary = +(
        merged.basicSalary + merged.hra + merged.conveyanceAllowance +
        merged.medicalAllowance + merged.specialAllowance +
        merged.bonus + merged.overtime + merged.otherEarnings
    ).toFixed(2);

    merged.totalDeductions = +(
        merged.pf + merged.professionalTax + merged.tds +
        merged.insurance + merged.loanAdvance + merged.otherDeductions
    ).toFixed(2);

    merged.netSalary = +(merged.grossSalary - merged.totalDeductions).toFixed(2);

    return merged;
};

const getMonthName = (monthNum) => MONTHS[monthNum - 1] || '';

module.exports = {
    calculateSalaryComponents,
    applyAttendanceImpact,
    mergeOverrides,
    getMonthName,
    MONTHS
};
