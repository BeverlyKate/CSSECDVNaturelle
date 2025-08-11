const UserType = {
    Customer: "customer",
    Admin: "admin",
    Employee: "employee"
};

async function logAccessControl(userId, userType, endpoint) {
    const Logs_AccessControl = require("../models/Logs_AccessControl");

    try {
        const log = new Logs_AccessControl({
            timestamp: new Date(),
            userId: userId,
            userType: userType,
            endpoint: endpoint,
        });
        await log.save();
    } catch (error) {
        console.error("Error saving access control log:", error);
    }
}

module.exports = {logAccessControl, UserType};