const mongoose = require('mongoose');

const Logs_AuthAttemptSchema = new mongoose.Schema({
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
        required: true
    },
    endpoint: {
        type: String,
        required: true
    },
    validationRule: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Logs_AuthAttempt', Logs_AuthAttemptSchema, 'logs_authattempt')