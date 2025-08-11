const mongoose = require('mongoose');

const Logs_AuthAttemptSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true
    },
    user: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true
    },
    endpoint: {
        type: String,
        required: true
    },
    attemptType: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Logs_AuthAttempt', Logs_AuthAttemptSchema, 'logs_authattempt')