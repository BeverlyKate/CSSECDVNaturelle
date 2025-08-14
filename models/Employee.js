const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  changedPassword: {
    type: Boolean,
    required: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  lastFailedLogin: {
    type: Date,
    default: null,
  }, numAttempts: {
    type: Number,
    default: 0,
  },
  timeoutEnd: {
    type: Date,
    default: null,
  },
  securityQuestion1: {
    type: String,
    default: null,
  },
  securityAnswer1: {
    type: String,
    default: null,
  },
  securityQuestion2: {
    type: String,
    default: null,
  },
  securityAnswer2: {
    type: String,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  lastPasswordChange: {
    type: Date,
    default: null
  },
  previousPasswords: {
    type: [String],
    default: []
  }
});

EmployeeSchema.methods.markLoginSuccess = async function () {
  this.lastLogin = new Date();
  await this.save();
};

EmployeeSchema.methods.markLoginFailure = async function () {
  this.lastFailedLogin = new Date();
  await this.save();
};

module.exports = mongoose.model("Employee", EmployeeSchema, "employees");
