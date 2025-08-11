const UserType = {
    Customer: "customer",
    Admin: "admin",
    Employee: "employee"
};

const Status = {
    Success: "success",
    Fail: "fail"
};

const AttemptType = {
    LoginAttempt: "login_attempt",
    PasswordVerification: "password_verification"
};

async function logAuthAttempt(user, status, userType, endpoint, attemptType) {
    const Logs_AuthAttempt = require('../models/Logs_AuthAttempt');

    try {
        const log = new Logs_AuthAttempt({
            timestamp: new Date(),
            user: user,
            status: status,
            userType: userType,
            endpoint: endpoint,
            attemptType: attemptType
        });
        //console.log("util: " + log.userId);
        await log.save();
        //console.log("Authentication attempt log saved successfully.");
    } catch (error) {
        console.error("Error saving authentication attempt log:", error);
    }
}

module.exports = {logAuthAttempt, UserType, Status, AttemptType}