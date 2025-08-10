const User = require('../models/User');
const bcrypt = require('bcrypt');

const InCartService = require('../models/InCartService');
const Reservation = require('../models/Reservation');
const Notification = require('../models/Notification');

let generatedId = [];

const controller = {
    getLogin: function (req, res) {
        if (!req.session.logged_in) {
            res.render('login', { layout: 'index', active: { login: true } });
        } else if (req.session.logged_in.type !== "customer") {
            let pre_text = "You need to logout as a";
            if (req.session.logged_in.type === "employee" || req.session.logged_in.type === "admin") pre_text += "n";
            pre_text += " ";

            res.render('login', {
                layout: 'index',
                active: { login: true },
                logged_in: req.session.logged_in,
                snackbar: {
                    type: "error",
                    persistent: true,
                    text: pre_text + req.session.logged_in.type + " before you can login as a customer.",
                    action: {
                        text: "LOGOUT",
                        link: "/logout?next=%2Flogin"
                    }
                }
            });
        } else {
            res.redirect('/');
        }
    },

    postLogin: async function (req, res) {
        let email = req.body.email;
        let password = req.body.password;

        if (email === undefined || password === undefined) {
            res.render('login', {
                layout: 'index',
                active: { login: true },
                error: 'Please enter your email and password.'
            });
            return;
        }

        let result = await User.findOne({ email: email });

        if (result == null) {
            // Increment failed login attempts
            req.session.failedLoginAttempts = (req.session.failedLoginAttempts || 0) + 1;
            req.session.lastAttemptedEmail = email;
            
            res.render('login', {
                layout: 'index',
                active: { login: true },
                error: 'Incorrect email address or password!',
                showForgotPassword: req.session.failedLoginAttempts >= 1,
                attemptedEmail: email
            });
            return;
        }

        let passwordCompare = await bcrypt.compare(password, result.password);

        if (!passwordCompare) {
            // Increment failed login attempts
            req.session.failedLoginAttempts = (req.session.failedLoginAttempts || 0) + 1;
            req.session.lastAttemptedEmail = email;
            
            res.render('login', {
                layout: 'index',
                active: { login: true },
                error: 'Incorrect email address or password!',
                showForgotPassword: req.session.failedLoginAttempts >= 1,
                attemptedEmail: email
            });
            return;
        }

        // Reset failed attempts on successful login
        req.session.failedLoginAttempts = 0;
        req.session.lastAttemptedEmail = null;

        req.session.logged_in = {
            state: true,
            type: "customer",
            user: {
                id: result._id,
                firstName: result.firstName,
                lastName: result.lastName,
                contactNumber: result.contactNumber,
                email: result.email
            }
        }

        console.log(result);

        if (req.query.next) res.redirect(decodeURIComponent(req.query.next));
        else res.redirect('/');
    },

    getRegister: function (req, res) {
        res.render('register', { layout: 'index', active: { login: true } });
    },

    postRegister: async function (req, res) {
        let userID;
        let firstName = req.body.first_name;
        let lastName = req.body.last_name;
        let email = req.body.email;
        let contactNumber = req.body.contact_number;
        let password = req.body.password;

        // Check if 'email' is empty
        if (email === '') {
            res.render('register', {
                layout: 'index',
                active: { login: true },
                error: 'Please enter your email address!',
                form: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    contactNumber: contactNumber
                }
            });
            return;
        }

        // Check if email is already in use by someone else
        let emailCheck = await User.findOne({ email: email }, 'email');
        if (emailCheck != null && emailCheck.email === email) {
            res.render('register', {
                layout: 'index',
                active: { login: true },
                error: 'Email address is already in use!',
                form: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    contactNumber: contactNumber
                }
            });
            return;
        }

        // Check if 'firstName' is empty
        if (firstName === '') {
            res.render('register', {
                layout: 'index',
                active: { login: true },
                error: 'Please enter your first name!',
                form: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    contactNumber: contactNumber
                }
            });
            return;
        }

        // Check if 'lastName' is empty
        if (lastName === '') {
            res.render('register', {
                layout: 'index',
                active: { login: true },
                error: 'Please enter your last name!',
                form: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    contactNumber: contactNumber
                }
            });
            return;
        }

        // Check if 'contactNumber' is empty
        if (contactNumber === '') {
            res.render('register', {
                layout: 'index',
                active: { login: true },
                error: 'Please enter your contact number!',
                form: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    contactNumber: contactNumber
                }
            });
            return;
        }

        // Check if 'password' is empty
        if (password === '') {
            res.render('register', {
                layout: 'index',
                active: { login: true },
                error: 'Please enter your password!',
                form: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    contactNumber: contactNumber
                }
            });
            return;
        }

        // Check if 'email' is valid
        const validEmailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!validEmailRegex.test(email)) {
            res.render('register', {
                layout: 'index',
                active: { login: true },
                error: 'Please enter a valid email address!',
                form: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    contactNumber: contactNumber
                }
            });
            return;
        }

        // Check if 'contactNumber' is valid
        const validContactNumRegex = /^(09)\d{9}/;
        if (!validContactNumRegex.test(contactNumber)) {
            res.render('register', {
                layout: 'index',
                active: { login: true },
                error: 'Please follow the contact number format: 09XXXXXXXXX',
                form: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    contactNumber: contactNumber
                }
            });
            return;
        }

        // Check if 'password' contains at least 8 characters
        if (password.length < 8) {
            res.render('register', {
                layout: 'index',
                active: { login: true },
                error: 'Password must contain at least 8 characters!',
                form: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    contactNumber: contactNumber
                }
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
            password: passwordHashed
        }

        let createdUser = await User.create(user);

        userID = createdUser._id;
        curr_date = new String(new Date())

        await User.updateOne({ _id: createdUser._id }, { $set: { generatedUserID: userID } });

        await Notification.create({
            receiver: userID,
            type: "Registration",
            timestamp: curr_date,
            title: "Welcome, " + createdUser.firstName + "!",
            body: "Thank you for taking your time to create an account with Salon Naturelle. You may now book reservations with us.",
            isRead: false
        })

        req.session.logged_in = {
            state: true,
            type: "customer",
            user: {
                id: userID,
                firstName: user.firstName,
                lastName: user.lastName,
                contactNumber: user.contactNumber,
                email: user.email
            }
        }

        console.log(user);

        res.redirect('/');
    },

    getForgotPassword: function (req, res) {
        res.render('forget-password', {
            layout: 'index',
            active: { login: true }
        });
    },

    postForgotPassword: async function (req, res) {
        const { email } = req.body;

        try {
            const user = await User.findOne({ email: email });
            if (!user) {
                res.render('forget-password', {
                    layout: 'index',
                    active: { login: true },
                    error: 'No user found with that email address!'
                });
                return;
            }

            // Generate a password reset token
            const token = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            await user.save();

            // Send email with reset link
            const resetLink = `http://${req.headers.host}/reset-password/${token}`;
            await sendEmail({
                to: user.email,
                subject: 'Password Reset',
                html: `<p>You requested a password reset. Click the link below to reset your password:</p>
                       <a href="${resetLink}">${resetLink}</a>`
            });

            res.render('forget-password', {
                layout: 'index',
                active: { login: true },
                success: 'Password reset link sent to your email!'
            });
        } catch (error) {
            console.error("Error in postForgetPassword:", error);
            res.render('forget-password', {
                layout: 'index',
                active: { login: true },
                error: 'An error occurred while processing your request.'
            });
        }
    },

    getAddToCart: function (req, res) {
        res.render('partials/serviceform', { layout: 'index', active: { login: true } });
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
            status: "Pending"
        }

        // console.log("Cart Object:", cart);

        try {
            const createdCart = await InCartService.create(cart);
            generatedId.push(createdCart._id);

            console.log("Cart added to MongoDB successfully! Cart ID:", generatedId);


        } catch (error) {
            console.error("Error adding cart to MongoDB:", error);
        }

        res.redirect('/serviceform');


        // console.log(generatedId);

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
                status: current
            }

            console.log("Reservation Details:", reservation);

            createdReservation = await Reservation.create(reservation);

            let populated = await Reservation.findById(createdReservation._id).populate('services').lean().exec();

            // console.log(populated);

            console.log("Reservation added to MongoDB successfully!");
            curr_date = new String(new Date())
            await Notification.create({
                receiver: userID,
                type: "Reservation Pending",
                timestamp: curr_date,
                title: "Reservation is Pending",
                body: "Your reservation is now pending for approval. Please wait for future notifications about the status of your reservation.",
                reservationID: createdReservation._id,
                isRead: false
            })

            console.log(createdReservation);

            generatedId = [];


        } catch (error) {
            console.error("Error adding reservation to MongoDB:", error);
        }

        res.redirect('/reserve');

    },

    postDeleteOneCart: async function (req, res) {

        let cartsToDelete = await InCartService.findOne({ _id: { $in: generatedId } });

        // Log the carts to be deleted
        console.log("Carts to be deleted:", cartsToDelete);

        // Delete all carts that match the IDs in the generatedId array
        // await InCartService.deleteOne({ _id: { $in: generatedId } });

        // generatedId = [];

        res.redirect('/serviceform');
    },

    postDeleteAllCart: async function (req, res) {

        let cartsToDelete = await InCartService.find({ _id: { $in: generatedId } });

        // Log the carts to be deleted
        console.log("Carts to be deleted:", cartsToDelete);

        // Delete all carts that match the IDs in the generatedId array
        await InCartService.deleteMany({ _id: { $in: generatedId } });

        generatedId = [];

        res.redirect('/serviceform');
    },

    getSecurityQuestion: async function(req, res) {
        const { email } = req.query;
        
        try {
            const user = await User.findOne({ email: email });
            
            if (!user || (!user.securityQuestion1 && !user.securityQuestion2)) {
                res.json({ 
                    success: false, 
                    message: 'No security questions found for this account.' 
                });
                return;
            }

            // Return both questions if they exist
            const questions = [];
            if (user.securityQuestion1) {
                questions.push({ id: 1, question: user.securityQuestion1 });
            }
            if (user.securityQuestion2) {
                questions.push({ id: 2, question: user.securityQuestion2 });
            }

            res.json({ 
                success: true, 
                questions: questions 
            });
            
        } catch (error) {
            console.error(error);
            res.json({ 
                success: false, 
                message: 'An error occurred.' 
            });
        }
    },

    postSecurityAnswer: async function(req, res) {
        const { email, questionId, answer } = req.body;
        
        try {
            const user = await User.findOne({ email: email });
            
            if (!user) {
                res.json({ 
                    success: false, 
                    message: 'User not found.' 
                });
                return;
            }

            let correctAnswer = '';
            if (questionId === 1 && user.securityQuestion1) {
                correctAnswer = user.securityAnswer1;
            } else if (questionId === 2 && user.securityQuestion2) {
                correctAnswer = user.securityAnswer2;
            } else {
                res.json({ 
                    success: false, 
                    message: 'Security question not found.' 
                });
                return;
            }

            // Simple case-insensitive comparison
            if (answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
                // Generate reset token
                const token = crypto.randomBytes(32).toString('hex');
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                await user.save();

                res.json({ 
                    success: true, 
                    message: 'Security answer correct!',
                    resetToken: token
                });
            } else {
                res.json({ 
                    success: false, 
                    message: 'Incorrect security answer.' 
                });
            }
            
        } catch (error) {
            console.error(error);
            res.json({ 
                success: false, 
                message: 'An error occurred.' 
            });
        }
    }
}

module.exports = controller;