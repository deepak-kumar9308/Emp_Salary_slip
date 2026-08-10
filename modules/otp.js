const otpStore = new Map();

function generateOTP() {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
}

function saveOTP(email, otp, userData) {
    otpStore.set(email.toLowerCase(), {
        otp: otp,
        userData: userData,
        expiresAt: Date.now() + 5 * 60 * 1000
    });
}

function verifyOTP(email, enteredOTP) {
    const key = email.toLowerCase();

    const data = otpStore.get(key);

    if (!data) {
        return {
            success: false,
            message: "OTP not found. Please request a new OTP."
        };
    }

    if (Date.now() > data.expiresAt) {
        otpStore.delete(key);

        return {
            success: false,
            message: "OTP has expired. Please request a new OTP."
        };
    }

    if (data.otp !== enteredOTP) {
        return {
            success: false,
            message: "Invalid OTP."
        };
    }

    otpStore.delete(key);

    return {
        success: true,
        userData: data.userData
    };
}

function deleteOTP(email) {
    otpStore.delete(email.toLowerCase());
}

module.exports = {
    generateOTP,
    saveOTP,
    verifyOTP,
    deleteOTP
};