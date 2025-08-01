const mongoose = require('mongoose');

const Logs_InputValidationSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    endpoint: {
        type: String,
        required: true
    },
    fieldName: {
        type: String,
        required: true
    },
    validationRule: {
        type: String,
        required: true
    },
    inputValue: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Logs_InputValidation', Logs_InputValidationSchema, 'logs_inputvalidation')