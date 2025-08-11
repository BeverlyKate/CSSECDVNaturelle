const User = require("../models/User");
const bcrypt = require("bcrypt");

const InCartService = require("../models/InCartService");
const Reservation = require("../models/Reservation");
const Notification = require("../models/Notification");

let generatedId = [];

const controller = {
  getLogin: function (req, res) {
    if (!req.session.logged_in) {
      let renderData = { layout: "index", active: { login: true } };
      
      // Check if user was redirected after password reset
      if (req.query.reset === 'success') {
        renderData.success = 'Password has been reset successfully! You can now log in with your new password.';
      }
      
      res.render("login", renderData);
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
      res.render("login", {
        layout: "index",
        active: { login: true },
        error: "Incorrect email address or password!",
        showForgotPassword: true,
        attemptedEmail: email,
      });
      return;
    }

    let passwordCompare = await bcrypt.compare(password, result.password);

    if (!passwordCompare) {
      res.render("login", {
        layout: "index",
        active: { login: true },
        error: "Incorrect email address or password!",
        showForgotPassword: true,
        attemptedEmail: email,
      });
      return;
    }

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

    //console.log(result);

    // Don't redirect to reset password page after successful login
    if (req.query.next && !req.query.next.includes('reset-password')) {
      res.redirect(decodeURIComponent(req.query.next));
    } else {
      res.redirect("/");
    }
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
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: "Please enter your first name!",
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
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: "Please enter your last name!",
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
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: "Please enter your contact number!",
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
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: "Please enter your password!",
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
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: "Please enter a valid email address!",
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
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: "Please follow the contact number format: 09XXXXXXXXX",
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
      res.render("register", {
        layout: "index",
        active: { login: true },
        error: "Password must contain at least 8 characters!",
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

  getSecurityQuestions: async function (req, res) {
    const email = req.query.email;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    try {
      const user = await User.findOne({ email: email }, 'securityQuestion1 securityQuestion2');
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'No account found with this email address.' });
      }

      // Check if user has any security questions
      if (!user.securityQuestion1 && !user.securityQuestion2) {
        return res.status(404).json({ success: false, message: 'No security questions found for this account.' });
      }

      res.json({ 
        success: true, 
        question1: user.securityQuestion1 || null,
        question2: user.securityQuestion2 || null
      });
    } catch (error) {
      console.error('Error fetching security questions:', error);
      res.status(500).json({ success: false, message: 'An error occurred while fetching the security questions.' });
    }
  },

  postSecurityAnswers: async function (req, res) {
    const { email, answer1, answer2 } = req.body;
    
    // Debug: Log what we received
    console.log('Received body:', req.body);
    console.log('Email received:', email);
    console.log('Answer1:', answer1);
    console.log('Answer2:', answer2);
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    if (!answer1 && !answer2) {
      return res.status(400).json({ success: false, message: 'At least one security answer is required.' });
    }

    try {
      const user = await User.findOne({ email: email }, 'securityQuestion1 securityQuestion2 securityAnswer1 securityAnswer2');
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'No account found with this email address.' });
      }

      // Check security answers (using bcrypt comparison)
      let isCorrect = false;
      
      // If answer1 is provided and user has securityAnswer1, check it
      if (answer1 && user.securityAnswer1) {
        const answer1Match = await bcrypt.compare(answer1, user.securityAnswer1);
        if (answer1Match) {
          isCorrect = true;
        }
      }
      
      // If answer2 is provided and user has securityAnswer2, check it
      if (answer2 && user.securityAnswer2) {
        const answer2Match = await bcrypt.compare(answer2, user.securityAnswer2);
        if (answer2Match) {
          isCorrect = true;
        }
      }

      // If user provided answers for questions they don't have, check if answers match existing ones
      if (!isCorrect) {
        if (answer1 && user.securityAnswer2) {
          const crossMatch1 = await bcrypt.compare(answer1, user.securityAnswer2);
          if (crossMatch1) {
            isCorrect = true;
          }
        }
        if (answer2 && user.securityAnswer1) {
          const crossMatch2 = await bcrypt.compare(answer2, user.securityAnswer1);
          if (crossMatch2) {
            isCorrect = true;
          }
        }
      }

      if (!isCorrect) {
        return res.status(400).json({ success: false, message: 'Incorrect security answers.' });
      }

      // Generate a reset token
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      // Update user with reset token
      await User.updateOne(
        { email: email },
        { 
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires 
        }
      );

      res.json({ success: true, resetToken: resetToken });
    } catch (error) {
      console.error('Error verifying security answers:', error);
      res.status(500).json({ success: false, message: 'An error occurred while verifying the answers.' });
    }
  },

  getResetPassword: async function (req, res) {
    const token = req.query.token;
    
    if (!token) {
      return res.render('login', {
        layout: 'index',
        active: { login: true },
        error: 'Invalid reset link. Please try the forgot password process again.'
      });
    }

    try {
      // Find user with this reset token and check if it's still valid
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.render('login', {
          layout: 'index',
          active: { login: true },
          error: 'Reset link has expired or is invalid. Please try the forgot password process again.'
        });
      }

      // Render the reset password form
      res.render('reset-password', {
        layout: 'index',
        token: token
      });
    } catch (error) {
      console.error('Error validating reset token:', error);
      res.render('login', {
        layout: 'index',
        active: { login: true },
        error: 'An error occurred. Please try again.'
      });
    }
  },

  postResetPassword: async function (req, res) {
    const { token, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      return res.render('reset-password', {
        layout: 'index',
        token: token,
        error: 'All fields are required.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render('reset-password', {
        layout: 'index',
        token: token,
        error: 'Passwords do not match.'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.render('reset-password', {
        layout: 'index',
        token: token,
        error: 'Password must be at least 8 characters long.'
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.render('reset-password', {
        layout: 'index',
        token: token,
        error: 'Password must contain at least one uppercase letter.'
      });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.render('reset-password', {
        layout: 'index',
        token: token,
        error: 'Password must contain at least one lowercase letter.'
      });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.render('reset-password', {
        layout: 'index',
        token: token,
        error: 'Password must contain at least one number.'
      });
    }

    try {
      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.render('reset-password', {
          layout: 'index',
          token: token,
          error: 'Reset link has expired or is invalid. Please try the forgot password process again.'
        });
      }

      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password and clear reset token
      await User.updateOne(
        { _id: user._id },
        {
          password: hashedPassword,
          resetPasswordToken: undefined,
          resetPasswordExpires: undefined
        }
      );

      // Redirect to login with success message
      res.redirect('/login?reset=success');

    } catch (error) {
      console.error('Error resetting password:', error);
      res.render('reset-password', {
        layout: 'index',
        token: token,
        error: 'An error occurred while resetting your password. Please try again.'
      });
    }
  },
};

module.exports = controller;
