const User = require("../models/User");
const bcrypt = require("bcrypt");

const InCartService = require("../models/InCartService");
const Reservation = require("../models/Reservation");
const Notification = require("../models/Notification");
const dateHelper = require("../utils/dateHelper");

const {logAuthAttempt,Status,UserType,AttemptType,} = require("../utils/util-log-auth-attempt");
const {logInputValidation,ValidationRule,} = require("../utils/util-log-input-validation");

let generatedId = [];

const controller = {
  getLogin: function (req, res) {
    if (!req.session.logged_in) {
      res.render("login", { layout: "index", active: { login: true } });
    } else if (req.session.logged_in.type !== "customer") {
      let pre_text = "You need to logout as a";
      if (
        req.session.logged_in.type === "employee" ||
        req.session.logged_in.type === "admin"
      )
        pre_text += "n";
      pre_text += " ";

      res.render("login", {
        layout: "index",
        active: { login: true },
        logged_in: req.session.logged_in,
        snackbar: {
          type: "error",
          persistent: true,
          text:
            pre_text +
            req.session.logged_in.type +
            " before you can login as a customer.",
          action: {
            text: "LOGOUT",
            link: "/logout?next=%2Flogin",
          },
        },
      });
    } else {
      res.redirect("/");
    }
  },

  postLogin: async function (req, res) {
    let email = req.body.email;
    let password = req.body.password;

    if (email === undefined || password === undefined) {
      res.render("login", {
        layout: "index",
        active: { login: true },
        error: "Please enter your email and password.",
      });
      return;
    }

    let result = await User.findOne({ email: email });

    if (result == null) {
      await logAuthAttempt(
        email,
        Status.Fail,
        UserType.Customer,
        req.path,
        AttemptType.LoginAttempt
      );
      res.render("login", {
        layout: "index",
        active: { login: true },
        error: "Incorrect email address or password!",
      });
      return;
    }

    let passwordCompare = await bcrypt.compare(password, result.password);

    if (!passwordCompare) {
      await logAuthAttempt(
        email,
        Status.Fail,
        UserType.Customer,
        req.path,
        AttemptType.LoginAttempt
      );
      await Notification.create({
        receiver: result._id,
        type: "Failed Authorization Attempt",
        timestamp: new Date(),
        title: "Failed login",
        body:
          "There was a failed login at " +
          dateHelper.formatDate(new Date()) +
          ".",
        isRead: false,
      });
      res.render("login", {
        layout: "index",
        active: { login: true },
        error: "Incorrect email address or password!",
      });
      return;
    }

    await logAuthAttempt(
      email,
      Status.Success,
      UserType.Customer,
      req.path,
      AttemptType.LoginAttempt
    );
    // console.log(result);
    await Notification.create({
      receiver: result._id,
      type: "Authorization Attempt",
      timestamp: new Date(),
      title: "Successful login",
      body:
        "There was a successful login at " +
        dateHelper.formatDate(new Date()) +
        ".",
      isRead: false,
    });

    req.session.logged_in = {
      state: true,
      type: "customer",
      user: {
        id: result._id,
        firstName: result.firstName,
        lastName: result.lastName,
        contactNumber: result.contactNumber,
        email: result.email,
      },
    };

    console.log(result);

    if (req.query.next) res.redirect(decodeURIComponent(req.query.next));
    else res.redirect("/");
  },

  getRegister: function (req, res) {
    res.render("register", { layout: "index", active: { login: true } });
  },

  postRegister: async function (req, res) {
    let userID;
    let firstName = req.body.first_name;
    let lastName = req.body.last_name;
    let email = req.body.email;
    let contactNumber = req.body.contact_number;
    let password = req.body.password;

    // Check if 'email' is empty
    if (email === "") {
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: "Please enter your email address!",
        form: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          contactNumber: contactNumber,
        },
      });
      return;
    }

    // Check if email is already in use by someone else
    let emailCheck = await User.findOne({ email: email }, "email");
    if (emailCheck != null && emailCheck.email === email) {
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: "Email address is already in use!",
        form: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          contactNumber: contactNumber,
        },
      });
      return;
    }

    // Check if 'firstName' is empty
    if (firstName === "") {
      const error_msg = "Please enter your first name!";
      await logInputValidation(
        email,
        req.path,
        "first_name",
        ValidationRule.Required,
        firstName,
        error_msg
      );
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: error_msg,
        form: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          contactNumber: contactNumber,
        },
      });
      return;
    }

    // Check if 'lastName' is empty
    if (lastName === "") {
      const error_msg = "Please enter your last name!";
      await logInputValidation(
        email,
        req.path,
        "last_name",
        ValidationRule.Required,
        lastName,
        error_msg
      );
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: error_msg,
        form: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          contactNumber: contactNumber,
        },
      });
      return;
    }

    // Check if 'contactNumber' is empty
    if (contactNumber === "") {
      const error_msg = "Please enter your contact number!";
      await logInputValidation(
        email,
        req.path,
        "contact_number",
        ValidationRule.Required,
        contactNumber,
        error_msg
      );
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: error_msg,
        form: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          contactNumber: contactNumber,
        },
      });
      return;
    }

    // Check if 'password' is empty
    if (password === "") {
      const error_msg = "Please enter your password!";
      await logInputValidation(
        email,
        req.path,
        "password",
        ValidationRule.Required,
        password,
        error_msg
      );
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: error_msg,
        form: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          contactNumber: contactNumber,
        },
      });
      return;
    }

    // Check if 'email' is valid
    const validEmailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!validEmailRegex.test(email)) {
      const error_msg = "Please enter a valid email address!";
      await logInputValidation(
        email,
        req.path,
        "email",
        ValidationRule.InvalidFormatEmail,
        email,
        error_msg
      );
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: error_msg,
        form: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          contactNumber: contactNumber,
        },
      });
      return;
    }

    // Check if 'contactNumber' is valid
    const validContactNumRegex = /^(09)\d{9}/;
    if (!validContactNumRegex.test(contactNumber)) {
      const error_msg = "Please follow the contact number format: 09XXXXXXXXX";
      await logInputValidation(
        email,
        req.path,
        "contact_number",
        ValidationRule.InvalidFormatPhone,
        contactNumber,
        error_msg
      );
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: error_msg,
        form: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          contactNumber: contactNumber,
        },
      });
      return;
    }

    // Check if 'password' contains at least 8 characters
    if (password.length < 8) {
      const error_msg = "Password must contain at least 8 characters!";
      await logInputValidation(
        email,
        req.path,
        "password",
        ValidationRule.InvalidLengthMin,
        password,
        error_msg
      );
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: error_msg,
        form: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          contactNumber: contactNumber,
        },
      });
      return;
    }

    const saltRounds = 10;

    let passwordHashed = await bcrypt.hash(password, saltRounds);

    let user = {
      generatedUserID: userID,
      firstName: firstName,
      lastName: lastName,
      email: email,
      contactNumber: contactNumber,
      password: passwordHashed,
    };

    let createdUser = await User.create(user);

    userID = createdUser._id;
    curr_date = new String(new Date());

    await User.updateOne(
      { _id: createdUser._id },
      { $set: { generatedUserID: userID } }
    );

    await Notification.create({
      receiver: userID,
      type: "Registration",
      timestamp: curr_date,
      title: "Welcome, " + createdUser.firstName + "!",
      body: "Thank you for taking your time to create an account with Salon Naturelle. You may now book reservations with us.",
      isRead: false,
    });

    req.session.logged_in = {
      state: true,
      type: "customer",
      user: {
        id: userID,
        firstName: user.firstName,
        lastName: user.lastName,
        contactNumber: user.contactNumber,
        email: user.email,
      },
    };

    //console.log(user);

    res.redirect("/");
  },

  getAddToCart: function (req, res) {
    res.render("partials/serviceform", {
      layout: "index",
      active: { login: true },
    });
  },

  postAddToCart: async function (req, res) {
    let detail = req.body.details;
    let pstaff = req.body.staff;
    let pservice = req.body.service;
    let employeeID = req.body.employeeID;

    let cart = {
      details: detail,
      preferredEmployee: pstaff,
      serviceTitle: pservice,
      employeeID: employeeID,
      status: "Pending",
    };

    // //console.log("Cart Object:", cart);

    try {
      const createdCart = await InCartService.create(cart);
      generatedId.push(createdCart._id);

      //console.log("Cart added to MongoDB successfully! Cart ID:", generatedId);
    } catch (error) {
      console.error("Error adding cart to MongoDB:", error);
    }

    res.redirect("/serviceform");

    // //console.log(generatedId);
  },

  postReserve: async function (req, res) {
    let userID = req.session.logged_in.user.id;

    let time = req.body.timestamp;
    let current = req.body.status;

    try {
      let reservation = {
        userID: userID,
        timestamp: time,
        services: generatedId,
        status: current,
      };

      //console.log("Reservation Details:", reservation);

      createdReservation = await Reservation.create(reservation);

      let populated = await Reservation.findById(createdReservation._id)
        .populate("services")
        .lean()
        .exec();

      // //console.log(populated);

      //console.log("Reservation added to MongoDB successfully!");
      curr_date = new String(new Date());
      await Notification.create({
        receiver: userID,
        type: "Reservation Pending",
        timestamp: curr_date,
        title: "Reservation is Pending",
        body: "Your reservation is now pending for approval. Please wait for future notifications about the status of your reservation.",
        reservationID: createdReservation._id,
        isRead: false,
      });

      //console.log(createdReservation);

      generatedId = [];
    } catch (error) {
      console.error("Error adding reservation to MongoDB:", error);
    }

    res.redirect("/reserve");
  },

  postDeleteOneCart: async function (req, res) {
    let cartsToDelete = await InCartService.findOne({
      _id: { $in: generatedId },
    });

    // Log the carts to be deleted
    //console.log("Carts to be deleted:", cartsToDelete);

    // Delete all carts that match the IDs in the generatedId array
    // await InCartService.deleteOne({ _id: { $in: generatedId } });

    // generatedId = [];

    res.redirect("/serviceform");
  },

  postDeleteAllCart: async function (req, res) {
    let cartsToDelete = await InCartService.find({ _id: { $in: generatedId } });

    // Log the carts to be deleted
    //console.log("Carts to be deleted:", cartsToDelete);

    // Delete all carts that match the IDs in the generatedId array
    await InCartService.deleteMany({ _id: { $in: generatedId } });

    generatedId = [];

    res.redirect("/serviceform");
  },
};

module.exports = controller;
