const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  lastFailedLogin: {
    type: Date,
    default: null,
  }, 
  numAttempts: {
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
  securityQuestion2: {
    type: String,
    default: null,
  },
  securityAnswer1: {
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
  }
});

// for MongoDB collection "users"
//const User = model("users", userSchema, "users");
module.exports = mongoose.model("Admin", AdminSchema, "admins");
