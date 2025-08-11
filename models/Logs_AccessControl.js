const mongoose = require('mongoose');

const Logs_AccessControlSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    userType: {
        type: String,
        required: false
    },
    endpoint: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Logs_AccessControl', Logs_AccessControlSchema, 'logs_accesscontrol')