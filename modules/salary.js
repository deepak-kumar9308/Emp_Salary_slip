function calculateSalary(basic, pf) {

    basic = Number(basic);
    pf = Number(pf);

    const hra = basic * 0.20;
    const da = basic * 0.10;

    const grossSalary = basic + hra + da;

    const netSalary = grossSalary - pf;

    return {
        basic,
        hra,
        da,
        pf,
        grossSalary,
        netSalary
    };
}

module.exports = {
    calculateSalary
};