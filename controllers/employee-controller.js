const Employee = require('../models/Employee')
const ServiceCollection = require('../models/ServiceCollection.js');
const Service = require('../models/Service.js');
const SpecialService = require('../models/SpecialService.js');
const Reservation = require('../models/Reservation.js');
const Notification = require('../models/Notification');
const InCartService = require('../models/InCartService.js');
const bcrypt = require('bcrypt');
const {ObjectId} = require('mongodb');
const {formatDate} = require("../utils/dateHelper.js");
const dateHelper = require("../utils/dateHelper.js");
const accountTimeout= require("../utils/accountTimeout.js");
const {logInputValidation, ValidationRule} = require("../utils/util-log-input-validation");
const {logAuthAttempt, Status, UserType, AttemptType} = require("../utils/util-log-auth-attempt");
const {logAccessControl} = require("../utils/util-log-access-control");
const Admin = require("../models/Admin");

const controller = {
    getEmployeeLogin: async function (req, res, next) {
        if (!req.session.logged_in) {
            let renderData = { layout: "no-sidebar" };
            
            // Check if employee was redirected after password reset
            if (req.query.reset === 'success') {
                renderData.success = 'Password has been reset successfully! You can now log in with your new password.';
            }
            
            res.render("login-employee", renderData);
        } else if (req.session.logged_in.type !== "employee") {
            let pre_text = "You need to logout as a";
            if (
                req.session.logged_in.type === "employee" ||
                req.session.logged_in.type === "admin"
            )
                pre_text += "n";
            pre_text += " ";

            res.render("login-employee", {
                layout: "no-sidebar",
                logged_in: req.session.logged_in,
                snackbar: {
                    type: "error",
                    persistent: true,
                    text:
                        pre_text +
                        req.session.logged_in.type +
                        " before you can login as an employee.",
                    action: {
                        text: "LOGOUT",
                        link: "/logout?next=%2Femployee",
                    },
                },
            });
        } else {
            next();
        }
    },

    postEmployeeLogin: async function (req, res) {
        let email = req.body.email;
        let password = req.body.password;
        let message;
        let currentTime= new Date();

        if (email === undefined || password === undefined) {
            res.render("login-employee", {
                layout: "employee-no-sidebar",
                active: {login: true},
                error: "Please enter your email and password.",
            });
            return;
        }

        let result = await Employee.findOne({email: email});

        if (result == null) {
            await logAuthAttempt(email, Status.Fail, UserType.Employee, req.path, AttemptType.LoginAttempt);
            res.render("login-employee", {
                layout: "employee-no-sidebar",
                active: {login: true},
                error: "Incorrect email or password.",
                showForgotPassword: true,
                attemptedEmail: email,
            });
            return;
        }

        if (result.changedPassword) {
            let passwordCompare = await bcrypt.compare(password, result.password);
            if(currentTime>result.timeoutEnd){
                if (!passwordCompare) {
                    await logAuthAttempt(email, Status.Fail, UserType.Employee, req.path, AttemptType.LoginAttempt);
                    accountTimeout.handleFailedAttempt(result);
                    message= accountTimeout.timeOutMessage(result);
            
                    console.log(message);
                    console.log("numAttempts: "+result.numAttempts +" timeoutEnd: "+result.timeoutEnd);
                    
                    res.render("login-employee", {
                        layout: "employee-no-sidebar",
                        active: {login: true},
                        error: message,
                        showForgotPassword: true,
                        attemptedEmail: email,
                    });
                    await Employee.findByIdAndUpdate(result._id, {lastFailedLogin: new Date(),});
                    return;
                }
            }
        } else {
            if(currentTime>result.timeoutEnd){
                if (result.password != password) {
                    await logAuthAttempt(email, Status.Fail, UserType.Employee, req.path, AttemptType.LoginAttempt);
                    accountTimeout.handleFailedAttempt(result);
                    message= accountTimeout.timeOutMessage(result);
            
                    console.log(message);
                    console.log("numAttempts: "+result.numAttempts +" timeoutEnd: "+result.timeoutEnd);
                    
                    res.render("login-employee", {
                        layout: "employee-no-sidebar",
                        active: {login: true},
                        error: message,
                        showForgotPassword: true,
                        attemptedEmail: email,
                    });
                    await Employee.findByIdAndUpdate(result._id, {lastFailedLogin: new Date(),});
                    return;
                }
            }
            
        }

        if(currentTime > result.timeoutEnd){
            await logAuthAttempt(email, Status.Success, UserType.Employee, req.path, AttemptType.LoginAttempt);
            await Employee.findByIdAndUpdate(result._id, {lastLogin: new Date()});
            accountTimeout.resetAttempts(result);
        }else{
            message= accountTimeout.timeOutMessage(result);

            console.log(message);
            console.log("numAttempts: "+result.numAttempts +" timeoutEnd: "+result.timeoutEnd);
            console.log(currentTime);
            console.log(result.timeOutMessage);
            console.log(currentTime>result.timeoutEnd);
            
            res.render("login-employee", {
                layout: "employee-no-sidebar",
                active: {login: true},
                error: message,
                showForgotPassword: true,
                attemptedEmail: email,
            });
            return;
        }
        
        let employee_name = result.firstName + " " + result.lastName;
        
        if (!result.changedPassword) {
            req.session.first_time = {
                user: {
                    id: result._id,
                    name: employee_name,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    email: result.email,
                    contactNumber: result.contactNumber,
                    employee_changedPassword: result.changedPassword,
                },
            };

            first_time_login_id = result._id;
            res.redirect("/employee/first-time-login");
        } else {
            req.session.logged_in = {
                state: true,
                type: "employee",
                user: {
                    id: result._id,
                    name: employee_name,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    email: result.email,
                    contactNumber: result.contactNumber,
                    employee_changedPassword: result.changedPassword,
                    lastLogin: result.lastLogin,
                    lastFailedLogin: result.lastFailedLogin,
                },
            };

            res.redirect("/employee");
        }
    },

    getEmployeeFirstTimeLogin: function (req, res) {
        //////console.log(req.session.first_time);
        if (req.session.first_time) {
            res.render("employee-first-time-login", {
                layout: "employee-no-sidebar",
                logged_in: {state: "valid"},
            });
        } else if (!req.session.first_time) {
            res.render("employee-first-time-login", {
                layout: "employee-no-sidebar",
                logged_in: {state: "invalid"},
                snackbar: {
                    type: "error",
                    persistent: true,
                    text: "You are an unauthorized user.",
                    action: {
                        text: "GO BACK",
                        link: "/employee",
                    },
                },
            });
        } else {
            res.redirect("/employee");
        }
    },

    postEmployeeFirstTimeLogin: async function (req, res, next) {
        let password = req.body.password;

        if (password === undefined) {
            res.render("employee-first-time-login", {
                layout: "employee-no-sidebar",
                active: {login: true},
                error: "Please enter a new password.",
            });
            return;
        }

        if (password.length < 8) {
            res.render("employee-first-time-login", {
                layout: "employee-no-sidebar",
                active: {login: true},
                error: "Password should be at least 8 characters!",
            });
            return;
        }

        const saltRounds = 10;

        let passwordHashed = await bcrypt.hash(password, saltRounds);

        await Employee.updateOne(
            {_id: req.session.first_time.user.id},
            {password: passwordHashed, changedPassword: true}
        );
        let result = await Employee.findOne({
            _id: req.session.first_time.user.id,
        });
        let employee_name = result.firstName + " " + result.lastName;

        //////console.log(result);
        req.session.logged_in = {
            state: true,
            type: "employee",
            user: {
                id: result._id,
                name: employee_name,
                firstName: result.firstName,
                lastName: result.lastName,
                email: result.email,
                contactNumber: result.contactNumber,
                employee_changedPassword: result.changedPassword,
                lastLogin: result.lastLogin,
                lastFailedLogin: result.lastFailedLogin,
            },
        };

        delete req.session.first_time;

        res.redirect("/employee");
    },

    getEmployeeDashboard: function (req, res, next) {
        if (!req.session.logged_in || req.session.logged_in.type !== "employee") {
            next();
            return;
        }

        //console.log("=============================DASHBOARD==============================");
        //console.log(req.session.logged_in);
        res.render("employee-reservations", {
            layout: "employee",
            logged_in: req.session.logged_in,
            active: {employee_home: true},
            page_context: "reservations",
            helpers: {
                formatDate: dateHelper.formatDate,
            },
        });
    },

    getRequestTempPassword: async function (req, res, next) {
        let employee = await Employee.findOne({_id: req.query.id});

        let password = {
            password: employee.password,
        };

        res.send(password);
    },

    getEmployeeReservations: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "employee") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let reservations = await Reservation.find({})
            .populate("services")
            .populate("userID", "firstName lastName")
            .exec();
        let employee_id = new ObjectId(req.query.id);
        const filteredReservations = reservations.filter((reservation) => {
            let foundMatch = false;
            reservation.services.forEach((service) => {
                //////console.log(service);
                if (service.employeeID == undefined) {
                    foundMatch = false;
                } else if (service.employeeID.equals(employee_id)) {
                    foundMatch = true;
                }
            });
            //////console.log(foundMatch);
            return foundMatch;
        });
        ////console.log(filteredReservations);
        res.send(filteredReservations);
    },

    getEmployeeServicesOfReservation: async function (req, res) {
        const reservation = await Reservation.findOne(
            {_id: req.query.reservation_id},
            "services"
        )
            .populate("services")
            .exec();
        let employee_id = new ObjectId(req.query.employee_id);
        const filteredServices = reservation.services.filter((service) => {
            let foundMatch = false;
            if (service.employeeID == undefined) {
                foundMatch = false;
            } else if (service.employeeID.equals(employee_id)) {
                foundMatch = true;
            }
            return foundMatch;
        });

        let filteredReservation = {
            _id: reservation._id,
            services: filteredServices,
        };

        res.send(filteredReservation);
    },

    postUpdateServiceStatus: async function (req, res) {
        await InCartService.updateOne(
            {_id: req.body.id},
            {status: req.body.service_status}
        );
        let service = await InCartService.findOne({_id: req.body.id});
        let reservation = await Reservation.findOne({
            _id: req.body.reservation_id,
        });
        userID = reservation.userID;

        curr_date = new String(new Date());
        let notif_title = "";
        let notif_body = "";
        let notif_type = "";

        if (req.body.service_status == "Pending") {
            notif_type = "Employee Set Pending";
            notif_title = "Service Request has been set to Pending";
            notif_body =
                "Your service request for " +
                service.serviceTitle +
                " was set to Pending by " +
                service.preferredEmployee;
        } else if (req.body.service_status == "Approved") {
            notif_type = "Employee Set Approved";
            notif_title = "Service Request has been Approved";
            notif_body =
                "Good news! Your service request for " +
                service.serviceTitle +
                " has been approved by " +
                service.preferredEmployee;
        } else if (req.body.service_status == "Cancelled") {
            notif_type = "Employee Set Cancelled";
            notif_title = "Service Request has been Cancelled";
            notif_body =
                "Sorry, dear customer. Your service request for " +
                service.serviceTitle +
                " has been cancelled by " +
                service.preferredEmployee;
        }

        let notification = await Notification.create({
            receiver: userID,
            type: notif_type,
            timestamp: curr_date,
            title: notif_title,
            body: notif_body,
            reservationID: req.body.reservation_id,
            reason: req.body.reason,
            isRead: false,
        });
        //////console.log(notification);

        res.sendStatus(200);
    },

    getEmployeeSettings: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "employee") {
            res.redirect("/employee");
            return;
        }

        // Fetch employee's current security questions
        const employee = await Employee.findById(req.session.logged_in.user.id, 'securityQuestion1 securityQuestion2');

        res.render("employee-settings", {
            layout: "employee",
            logged_in: req.session.logged_in,
            employee: employee,
            page_context: "settings",
            helpers: {
                formatDate: dateHelper.formatDate,
            },
        });
    },

    postEmployeeSettings: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== "employee") {
                res.sendStatus(401); // HTTP 401: Unauthorized
                return;
            }

            let employee_id = req.session.logged_in.user.id;
            let fname = req.body.fname;
            let lname = req.body.lname;
            let email = req.body.email;
            let contact = req.body.contact;

            if (fname === "") {
                res.status(400).send({ error: "Please enter your first name." });
                return;
            }

            if (lname === "") {
                res.status(400).send({ error: "Please enter your last name." });
                return;
            }

            if (email === "") {
                res.status(400).send({ error: "Please enter your email address." });
                return;
            }

            if (contact === "") {
                res.status(400).send({ error: "Please enter your contact number." });
                return;
            }

            const validEmailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            let isEmailValid = validEmailRegex.test(email);

            if (!isEmailValid) {
                res.status(400).send({ error: "Please enter a valid email address." });
                return;
            }

            const validContactNumRegex = /^(09)\d{9}/;
            let isContactNumValid = validContactNumRegex.test(contact);

            if (!isContactNumValid) {
                res.status(400).send({ error: "Please enter a valid contact number." });
                return;
            }

            // Check if email is already taken by another employee
            const existingEmployee = await Employee.findOne({ 
                email: email, 
                _id: { $ne: employee_id } 
            });
            
            if (existingEmployee) {
                res.status(400).send({ error: "This email address is already in use by another employee account." });
                return;
            }

            // Update employee profile
            await Employee.updateOne(
                { _id: employee_id },
                {
                    firstName: fname,
                    lastName: lname,
                    email: email,
                    contactNumber: contact,
                }
            );

            // Update session data
            let employee_name = fname + " " + lname;
            req.session.logged_in.user = {
                id: employee_id,
                name: employee_name,
                firstName: fname,
                lastName: lname,
                email: email,
                contactNumber: contact,
                employee_changedPassword: req.session.logged_in.user.employee_changedPassword,
                lastLogin: req.session.logged_in.user.lastLogin,
                lastFailedLogin: req.session.logged_in.user.lastFailedLogin,
            };

            res.sendStatus(200);
        } catch (error) {
            console.error('Error updating employee profile settings:', error);
            res.status(500).send({ error: "An error occurred while updating your profile settings." });
        }
    },

    updateEmployeeSecurityQuestions: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== 'employee') {
                return res.status(401).json({ success: false, message: 'Unauthorized access.' });
            }

            const { question1, answer1, question2, answer2 } = req.body;
            const employeeId = req.session.logged_in.user.id;

            // Validate that at least one question and answer is provided
            if ((!question1 || !answer1) && (!question2 || !answer2)) {
                return res.status(400).json({ success: false, message: 'At least one security question and answer must be provided.' });
            }

            // Hash the answers
            const saltRounds = 10;
            let hashedAnswer1 = null;
            let hashedAnswer2 = null;

            if (answer1) {
                hashedAnswer1 = await bcrypt.hash(answer1, saltRounds);
            }

            if (answer2) {
                hashedAnswer2 = await bcrypt.hash(answer2, saltRounds);
            }

            // Update employee security questions
            await Employee.updateOne(
                { _id: employeeId },
                {
                    securityQuestion1: question1 || null,
                    securityAnswer1: hashedAnswer1,
                    securityQuestion2: question2 || null,
                    securityAnswer2: hashedAnswer2
                }
            );

            res.json({ success: true, message: 'Security questions updated successfully.' });
        } catch (error) {
            console.error('Error updating employee security questions:', error);
            res.status(500).json({ success: false, message: 'An error occurred while updating security questions.' });
        }
    },

    checkEmployeeSecurityQuestions: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== 'employee') {
                return res.status(401).json({ success: false, message: 'Unauthorized access.' });
            }

            const employeeId = req.session.logged_in.user.id;
            const employee = await Employee.findById(employeeId, 'securityQuestion1 securityQuestion2');

            if (!employee) {
                return res.status(404).json({ success: false, message: 'Employee not found.' });
            }

            // Check if employee has security questions set up
            if (!employee.securityQuestion1 && !employee.securityQuestion2) {
                return res.json({ 
                    success: false, 
                    message: 'No security questions are set up. Please set up security questions first.',
                    hasQuestions: false
                });
            }

            res.json({ 
                success: true, 
                question1: employee.securityQuestion1 || null,
                question2: employee.securityQuestion2 || null,
                hasQuestions: true
            });
        } catch (error) {
            console.error('Error checking employee security questions:', error);
            res.status(500).json({ success: false, message: 'An error occurred while checking security questions.' });
        }
    },

    changeEmployeePasswordSettings: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== 'employee') {
                return res.status(401).json({ success: false, message: 'Unauthorized access.' });
            }

            const { newPassword } = req.body;
            const employeeId = req.session.logged_in.user.id;

            if (!newPassword) {
                return res.status(400).json({ success: false, message: 'New password is required.' });
            }

            // Validate password strength
            if (newPassword.length < 8) {
                return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
            }

            if (!/[A-Z]/.test(newPassword)) {
                return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter.' });
            }

            if (!/[a-z]/.test(newPassword)) {
                return res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter.' });
            }

            if (!/[0-9]/.test(newPassword)) {
                return res.status(400).json({ success: false, message: 'Password must contain at least one number.' });
            }

            // Get employee
            const employee = await Employee.findById(employeeId);

            if (!employee) {
                return res.status(404).json({ success: false, message: 'Employee not found.' });
            }

            const minTimeBetweenPasswordChanges = 24 * 60 * 60 * 1000; // 1 day in milliseconds
            const now = new Date();

            if (employee.lastPasswordChange && (now.getTime() - employee.lastPasswordChange.getTime() < minTimeBetweenPasswordChanges)) {
                return res.status(400).json({ success: false, message: 'You can only change your password once every 1 day.' });
            } else {
                await Admin.updateOne({_id: employeeId}, {lastPasswordChange: now});
            }

            // Hash the new password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update employee password
            await Employee.updateOne(
                { _id: employeeId },
                {
                    password: hashedPassword,
                    changedPassword: true
                }
            );

            // Update session with new password change status
            req.session.logged_in.user.employee_changedPassword = true;

            res.json({ success: true, message: 'Password changed successfully.' });
        } catch (error) {
            console.error('Error changing employee password in settings:', error);
            res.status(500).json({ success: false, message: 'An error occurred while changing your password. Please try again.' });
        }
    },

    // Legacy method - keeping for backward compatibility but updating
    postEmployeeSettingsOld: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "employee") {
            res.sendStatus(401); // HTTP 401: Unauthorized
            return;
        }

        let employee_id = req.body.id;
        let fname = req.body.fname;
        let lname = req.body.lname;
        let email = req.body.email;
        let contactNumber = req.body.contactNumber;
        let current_password = req.body.current_password;
        let new_password = req.body.new_password;

        if (fname === "") {
            res.status(400).send({error: "Please enter a first name."});
            return;
        }

        if (lname === "") {
            res.status(400).send({error: "Please enter a last name."});
            return;
        }

        const validEmailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (email.value === "" || !validEmailRegex.test(email)) {
            res.status(400).send({error: "Please enter a valid email."});
            return;
        }

        const validContactNumRegex = /^(09)\d{9}/;
        if (contactNumber === "" || !validContactNumRegex.test(contactNumber)) {
            res.status(400).send({error: "Please enter a valid contact number."});
            return;
        }

        if (current_password === "") {
            res.status(400).send({error: "Please enter your current password"});
            return;
        }

        let comparePassword = await Employee.findOne({_id: employee_id});

        let matched = await bcrypt.compare(
            current_password,
            comparePassword.password
        );

        if (!matched) {
            await logAuthAttempt(email, Status.Fail, UserType.Employee, req.path, AttemptType.PasswordVerification);
            res.status(403).send({error: "Current password is incorrect!"});
            return;
        }

        await logAuthAttempt(email, Status.Success, UserType.Employee, req.path, AttemptType.PasswordVerification);

        if (new_password !== "") {
            if (new_password.length < 8) {
                res.status(403).send({error: "Password must contain at least 8 characters!"});
                return;
            }

            let passwordHashed = await bcrypt.hash(new_password, 10);

            await Employee.updateOne(
                {_id: employee_id},
                {
                    firstName: fname,
                    lastName: lname,
                    email: email,
                    contactNumber: contactNumber,
                    password: passwordHashed,
                }
            );

            let employee_name = fname + " " + lname;

            req.session.logged_in = {
                state: true,
                type: "employee",
                user: {
                    id: employee_id,
                    name: employee_name,
                    firstName: fname,
                    lastName: lname,
                    email: email,
                    contactNumber: contactNumber,
                    employee_changedPassword: true,
                    lastLogin: result.lastLogin,
                    lastFailedLogin: result.lastFailedLogin,
                },
            };

            res.sendStatus(200);
            return;
        }

        await Employee.updateOne(
            {_id: employee_id},
            {
                firstName: fname,
                lastName: lname,
                email: email,
                contactNumber: contactNumber,
            }
        );

        let employee_name = fname + " " + lname;

        req.session.logged_in = {
            state: true,
            type: "employee",
            user: {
                id: employee_id,
                name: employee_name,
                firstName: fname,
                lastName: lname,
                email: email,
                contactNumber: contactNumber,
                employee_changedPassword: true,
                lastLogin: result.lastLogin,
                lastFailedLogin: result.lastFailedLogin,
            },
        };

        res.sendStatus(200);
    },

    getEmployeeSecurityQuestions: async function (req, res) {
        const email = req.query.email;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        try {
            const employee = await Employee.findOne({ email: email }, 'securityQuestion1 securityQuestion2');
            
            if (!employee) {
                return res.status(404).json({ success: false, message: 'No employee account found with this email address.' });
            }

            // Check if employee has any security questions
            if (!employee.securityQuestion1 && !employee.securityQuestion2) {
                return res.status(404).json({ success: false, message: 'No security questions are set up for this account. Please contact your administrator.' });
            }

            res.json({ 
                success: true, 
                question1: employee.securityQuestion1 || null,
                question2: employee.securityQuestion2 || null
            });
        } catch (error) {
            console.error('Error fetching employee security questions:', error);
            res.status(500).json({ success: false, message: 'An error occurred while fetching the security questions.' });
        }
    },

    postEmployeeSecurityAnswers: async function (req, res) {
        const { email, answer1, answer2 } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        if (!answer1 && !answer2) {
            return res.status(400).json({ success: false, message: 'At least one security answer is required.' });
        }

        try {
            const employee = await Employee.findOne({ email: email }, 'securityQuestion1 securityQuestion2 securityAnswer1 securityAnswer2');
            
            if (!employee) {
                return res.status(404).json({ success: false, message: 'No employee account found with this email address.' });
            }

            // Check security answers (using bcrypt comparison)
            let isCorrect1 = false;
            let isCorrect2 = false;

            // If answer1 is provided and employee has securityAnswer1, check it
            if (answer1 && employee.securityAnswer1) {
                isCorrect1 = await bcrypt.compare(answer1, employee.securityAnswer1);
            }
            
            // If answer2 is provided and employee has securityAnswer2, check it
            if (answer2 && employee.securityAnswer2) {
                isCorrect2 = await bcrypt.compare(answer2, employee.securityAnswer2);
            }

            // At least one answer must be correct, and if both are provided, both must be correct
            let isCorrect = false;
            if (answer1 && answer2) {
                // Both answers provided - both must be correct
                isCorrect = isCorrect1 && isCorrect2;
            } else if (answer1) {
                // Only answer1 provided
                isCorrect = isCorrect1;
            } else if (answer2) {
                // Only answer2 provided
                isCorrect = isCorrect2;
            }

            if (!isCorrect) {
                return res.status(400).json({ success: false, message: 'Incorrect security answers. Please try again.' });
            }

            // Generate a reset token
            const resetToken = require('crypto').randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

            // Update employee with reset token
            await Employee.updateOne(
                { email: email },
                { 
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: resetExpires 
                }
            );

            res.json({ success: true, resetToken: resetToken });
        } catch (error) {
            console.error('Error verifying employee security answers:', error);
            res.status(500).json({ success: false, message: 'An error occurred while verifying the answers.' });
        }
    },

    verifyEmployeeSecurityAnswers: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== 'employee') {
                return res.status(401).json({ success: false, message: 'Unauthorized access.' });
            }

            const { email, answer1, answer2 } = req.body;
            
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required.' });
            }

            if (!answer1 && !answer2) {
                return res.status(400).json({ success: false, message: 'At least one security answer is required.' });
            }

            // Verify that the email matches the logged-in employee
            if (email !== req.session.logged_in.user.email) {
                return res.status(403).json({ success: false, message: 'Access denied.' });
            }

            const employee = await Employee.findOne({ email: email }, 'securityQuestion1 securityQuestion2 securityAnswer1 securityAnswer2');
            
            if (!employee) {
                return res.status(404).json({ success: false, message: 'No employee account found with this email address.' });
            }

            // Check security answers (using bcrypt comparison)
            let isCorrect1 = false;
            let isCorrect2 = false;

            // If answer1 is provided and employee has securityAnswer1, check it
            if (answer1 && employee.securityAnswer1) {
                isCorrect1 = await bcrypt.compare(answer1, employee.securityAnswer1);
            }
            
            // If answer2 is provided and employee has securityAnswer2, check it
            if (answer2 && employee.securityAnswer2) {
                isCorrect2 = await bcrypt.compare(answer2, employee.securityAnswer2);
            }

            // At least one answer must be correct, and if both are provided, both must be correct
            let isCorrect = false;
            if (answer1 && answer2) {
                // Both answers provided - both must be correct
                isCorrect = isCorrect1 && isCorrect2;
            } else if (answer1) {
                // Only answer1 provided
                isCorrect = isCorrect1;
            } else if (answer2) {
                // Only answer2 provided
                isCorrect = isCorrect2;
            }

            if (!isCorrect) {
                return res.status(400).json({ success: false, message: 'Incorrect security answers. Please try again.' });
            }

            // For settings verification, we don't need to generate tokens
            // Just confirm that the verification was successful
            res.json({ success: true, message: 'Security answers verified successfully.' });
        } catch (error) {
            console.error('Error verifying employee security answers for settings:', error);
            res.status(500).json({ success: false, message: 'An error occurred while verifying the answers.' });
        }
    },

    getEmployeeResetPassword: async function (req, res) {
        const token = req.query.token;
        
        if (!token) {
            return res.render('login-employee', {
                layout: 'employee-no-sidebar',
                error: 'Invalid reset link. Please try the forgot password process again.'
            });
        }

        try {
            // Find employee with this reset token and check if it's still valid
            const employee = await Employee.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });
            
            if (!employee) {
                return res.render('login-employee', {
                    layout: 'employee-no-sidebar',
                    error: 'Reset link has expired or is invalid. Please try the forgot password process again.'
                });
            }

            // Render the reset password form
            res.render('reset-password-employee', {
                layout: 'employee-no-sidebar',
                token: token,
                isEmployee: true
            });
        } catch (error) {
            console.error('Error validating employee reset token:', error);
            res.render('login-employee', {
                layout: 'employee-no-sidebar',
                error: 'An error occurred. Please try again.'
            });
        }
    },

    postEmployeeResetPassword: async function (req, res) {
        const { token, newPassword, confirmPassword } = req.body;
        
        // Validate input
        if (!token || !newPassword || !confirmPassword) {
            return res.render('reset-password-employee', {
                layout: 'employee-no-sidebar',
                token: token,
                isEmployee: true,
                error: 'All fields are required.'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('reset-password-employee', {
                layout: 'employee-no-sidebar',
                token: token,
                isEmployee: true,
                error: 'Passwords do not match.'
            });
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return res.render('reset-password-employee', {
                layout: 'employee-no-sidebar',
                token: token,
                isEmployee: true,
                error: 'Password must be at least 8 characters long.'
            });
        }

        if (!/[A-Z]/.test(newPassword)) {
            return res.render('reset-password-employee', {
                layout: 'employee-no-sidebar',
                token: token,
                isEmployee: true,
                error: 'Password must contain at least one uppercase letter.'
            });
        }

        if (!/[a-z]/.test(newPassword)) {
            return res.render('reset-password-employee', {
                layout: 'employee-no-sidebar',
                token: token,
                isEmployee: true,
                error: 'Password must contain at least one lowercase letter.'
            });
        }

        if (!/[0-9]/.test(newPassword)) {
            return res.render('reset-password-employee', {
                layout: 'employee-no-sidebar',
                token: token,
                isEmployee: true,
                error: 'Password must contain at least one number.'
            });
        }

        try {
            // Find employee with valid reset token
            const employee = await Employee.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });
            
            if (!employee) {
                return res.render('reset-password-employee', {
                    layout: 'employee-no-sidebar',
                    token: token,
                    isEmployee: true,
                    error: 'Reset link has expired or is invalid. Please try the forgot password process again.'
                });
            }

            // Hash the new password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update employee password and clear reset token
            await Employee.updateOne(
                { _id: employee._id },
                {
                    password: hashedPassword,
                    resetPasswordToken: undefined,
                    resetPasswordExpires: undefined,
                    changedPassword: true // Mark as changed password
                }
            );

            // Redirect to employee login with success message
            res.redirect('/employee?reset=success');

        } catch (error) {
            console.error('Error resetting employee password:', error);
            res.render('reset-password-employee', {
                layout: 'employee-no-sidebar',
                token: token,
                isEmployee: true,
                error: 'An error occurred while resetting your password. Please try again.'
            });
        }
    },

    getCurrentEmployeeSecurityQuestions: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== 'employee') {
                return res.status(401).json({ success: false, message: 'Unauthorized access.' });
            }

            const email = req.query.email;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required.' });
            }

            // Verify that the email matches the logged-in employee
            if (email !== req.session.logged_in.user.email) {
                return res.status(403).json({ success: false, message: 'Access denied.' });
            }

            const employee = await Employee.findOne({ email: email }, 'securityQuestion1 securityQuestion2');
            
            if (!employee) {
                return res.status(404).json({ success: false, message: 'Employee not found.' });
            }

            res.json({ 
                success: true, 
                question1: employee.securityQuestion1 || null,
                question2: employee.securityQuestion2 || null
            });
        } catch (error) {
            console.error('Error getting current employee security questions:', error);
            res.status(500).json({ success: false, message: 'An error occurred while retrieving security questions.' });
        }
    },
};

module.exports = controller;