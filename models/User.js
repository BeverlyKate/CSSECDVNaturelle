const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    generatedUserID: {
        type: ObjectId,
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    },
    securityQuestion: {
        type: String,
        required: false
    },
    securityAnswer: {
        type: String,
        required: false
    }
})

// for MongoDB collection "users"
//const User = model("users", userSchema, "users");
module.exports = mongoose.model('User', UserSchema, "users");
