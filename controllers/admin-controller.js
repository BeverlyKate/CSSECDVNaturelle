const Admin = require("../models/Admin");
const Employee = require("../models/Employee");
const User = require("../models/User");
const ServiceCollection = require("../models/ServiceCollection.js");
const Service = require("../models/Service.js");
const SpecialService = require("../models/SpecialService.js");
const FAQ = require("../models/FAQ.js");
const Reservation = require("../models/Reservation.js");
const InCartService = require("../models/InCartService.js");
const bcrypt = require("bcrypt");
const Notification = require("../models/Notification");
const Logs_InputValidation = require("../models/Logs_InputValidation");
const Logs_AuthAttempt = require("../models/Logs_AuthAttempt");
const Logs_AccessControl = require("../models/Logs_AccessControl");
const {logInputValidation, ValidationRule} = require("../utils/util-log-input-validation");
const {logAuthAttempt, Status, UserType, AttemptType} = require("../utils/util-log-auth-attempt");
const {logAccessControl} = require("../utils/util-log-access-control");
const dateHelper = require("../utils/dateHelper.js");
const accountTimeout = require("../utils/accountTimeout.js")
function generateRandomPassword(length) {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
    let password = "";

    for (let i = 0; i < length; i++) {
        password += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return password;
}

function isEmailValid(email) {
    const validEmailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return validEmailRegex.test(email);
}

function isContactNumValid(contactNum) {
    const validContactNumRegex = /^(09)\d{9}$/;
    return validContactNumRegex.test(contactNum);
}

const controller = {
    getAdminLogin: async function (req, res, next) {
        if (!req.session.logged_in) {
            res.render("login-admin", {layout: "no-sidebar"});
        } else if (req.session.logged_in.type !== "admin") {
            let pre_text = "You need to logout as a";
            if (req.session.logged_in.type === "employee" || req.session.logged_in.type === "admin") pre_text += "n";
            pre_text += " ";

            res.render("login-admin", {
                layout: "no-sidebar",
                logged_in: req.session.logged_in,
                snackbar: {
                    type: "error",
                    persistent: true,
                    text:
                        pre_text +
                        req.session.logged_in.type +
                        " before you can login as an admin.",
                    action: {
                        text: "LOGOUT",
                        link: "/logout?next=%2Fadmin",
                    },
                },
            });
        } else {
            next();
        }
    },

  postAdminLogin: async function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    var message;
    var currentTime;
    if (username === undefined || password === undefined) {
      res.render("login-admin", {
        layout: "no-sidebar",
        active: { login: true },
        error: "Please enter your username and password.",
        showForgotPassword: true,
      });
      return;
    }

        let result = await Admin.findOne({username: username});

        if (result == null) {
            await logAuthAttempt(username, Status.Fail, UserType.Admin, req.path, AttemptType.LoginAttempt);
            res.render("login-admin", {
                layout: "no-sidebar",
                active: {login: true},
                error: "Incorrect username or password.",
                showForgotPassword: true,
            });
            return;
        }

    let passwordCompare = await bcrypt.compare(password, result.password);
    currentTime= new Date();

    if(currentTime>result.timeoutEnd){
      if (!passwordCompare) {
        await logAuthAttempt(username, Status.Fail, UserType.Admin, req.path, AttemptType.LoginAttempt);
        accountTimeout.handleFailedAttempt(result);
        message= accountTimeout.timeOutMessage(result);

        console.log(message);
        console.log("numAttempts: "+result.numAttempts +" timeoutEnd: "+result.timeoutEnd);

        res.render("login-admin", {
          layout: "no-sidebar",
          active: { login: true },
          error: message,
          showForgotPassword: true,
        });
        await Admin.findByIdAndUpdate(result._id, {
          lastFailedLogin: new Date(),
        });
        return;
      }
   }
    currentTime= new Date();
    if(currentTime>result.timeoutEnd){
      console.log(result);
      console.log(currentTime > result.timeoutEnd);
      await logAuthAttempt(username, Status.Success, UserType.Admin, req.path, AttemptType.LoginAttempt);

      await Admin.findByIdAndUpdate(result._id, { lastLogin: new Date() });
      accountTimeout.resetAttempts(result);
      req.session.logged_in = {
        state: true,
        type: "admin",
        user: {
          id: result._id,
          username: result.username,
          lastLogin: result.lastLogin,
          lastFailedLogin: result.lastFailedLogin,
        },
      };
    }else{
      message= accountTimeout.timeOutMessage(result);
      res.render("login-admin", {
        layout: "no-sidebar",
        active: { login: true },
        error: message,
        showForgotPassword: true,
      });
      return;
    }

    if (req.query.next) res.redirect(decodeURIComponent(req.query.next));
    else res.redirect("/admin");
  },

    getCurrentUser: async function (req, res) {
        user = await Admin.findOne({username: req.session.logged_in.user});
        //console.log(user);
        res.send(username);
    },

    getAdminSettings: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.redirect("/admin");
            return;
        }

        // Fetch admin's current security questions
        const admin = await Admin.findById(req.session.logged_in.user.id, 'securityQuestion1 securityQuestion2');

        res.render("admin-settings", {
            layout: "admin",
            logged_in: req.session.logged_in,
            admin: admin,
            active: {admin_settings: true},
            helpers: {
                formatDate: dateHelper.formatDate,
            },
        });
    },

    postAdminSettings: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
                res.sendStatus(401); // HTTP 401: Unauthorized
                return;
            }

            let admin_id = req.session.logged_in.user.id;
            let username = req.body.username;

            if (username === "") {
                const error_msg = "Please enter a username.";
                await logInputValidation(
                    req.session.logged_in.user.id,
                    req.path,
                    "username",
                    ValidationRule.Required,
                    username,
                    error_msg
                );
                res.status(400).send({error: error_msg});
                return;
            }

            // Check if username is already taken by another admin
            const existingAdmin = await Admin.findOne({ 
                username: username, 
                _id: { $ne: admin_id } 
            });
            
            if (existingAdmin) {
                res.status(400).send({ error: "This username is already in use by another admin account." });
                return;
            }

            // Update admin profile
            await Admin.updateOne(
                { _id: admin_id },
                {
                    username: username,
                }
            );

            // Update session data
            req.session.logged_in.user = {
                id: admin_id,
                username: username,
                lastLogin: req.session.logged_in.user.lastLogin,
                lastFailedLogin: req.session.logged_in.user.lastFailedLogin,
            };

            res.sendStatus(200);
        } catch (error) {
            console.error('Error updating admin profile settings:', error);
            res.status(500).send({ error: "An error occurred while updating your profile settings." });
        }
    },

    updateAdminSecurityQuestions: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== 'admin') {
                return res.status(401).json({ success: false, message: 'Unauthorized access.' });
            }

            const { question1, answer1, question2, answer2 } = req.body;
            const adminId = req.session.logged_in.user.id;

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

            // Update admin security questions
            await Admin.updateOne(
                { _id: adminId },
                {
                    securityQuestion1: question1 || null,
                    securityAnswer1: hashedAnswer1,
                    securityQuestion2: question2 || null,
                    securityAnswer2: hashedAnswer2
                }
            );

            res.json({ success: true, message: 'Security questions updated successfully.' });
        } catch (error) {
            console.error('Error updating admin security questions:', error);
            res.status(500).json({ success: false, message: 'An error occurred while updating security questions.' });
        }
    },

    changeAdminPasswordSettings: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== 'admin') {
                return res.status(401).json({ success: false, message: 'Unauthorized access.' });
            }

            const { newPassword } = req.body;
            const adminId = req.session.logged_in.user.id;

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

            // Get admin
            const admin = await Admin.findById(adminId);

            if (!admin) {
                return res.status(404).json({ success: false, message: 'Admin not found.' });
            }

            // Hash the new password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update admin password
            await Admin.updateOne(
                { _id: adminId },
                {
                    password: hashedPassword
                }
            );

            res.json({ success: true, message: 'Password changed successfully.' });
        } catch (error) {
            console.error('Error changing admin password in settings:', error);
            res.status(500).json({ success: false, message: 'An error occurred while changing your password. Please try again.' });
        }
    },

    getAdminDashboard: async function (req, res, next) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            next();
            return;
        }

        let reservations_count = await Reservation.countDocuments();
        let services_count = await Service.countDocuments();
        let employees_count = await Employee.countDocuments();
        let faq_count = await FAQ.countDocuments();

        let logs_inputvalidation_recent = await Logs_InputValidation.find().sort({timestamp: -1}).limit(3).lean();
        await Promise.all(
            logs_inputvalidation_recent.map(async (log) => {
                log.timestamp = new Date(log.timestamp).toLocaleString();
                const admin_result = await Admin.findById(
                    log.userId,
                    "_id username"
                ).lean();
                //log.userId = `${admin_result.username} (${admin_result._id})`;
                log.userId = admin_result.username;
            })
        );

        let logs_authattempts_recent = await Logs_AuthAttempt.find().sort({timestamp: -1}).limit(3).lean();
        await Promise.all(
            logs_authattempts_recent.map(async (log) => {
                log.timestamp = new Date(log.timestamp).toLocaleString();
            })
        );

        let logs_accesscontrol_recent = await Logs_AccessControl.find().sort({timestamp: -1}).limit(3).lean();
        await Promise.all(
            logs_accesscontrol_recent.map(async (log) => {
                log.timestamp = new Date(log.timestamp).toLocaleString();
                if (log.userType === "customer" || log.userType === "employee") {
                    const result = await (log.userType === "customer" ? User : (log.userType === "employee" ? Employee : User)).findById(log.userId, "_id firstName lastName").lean();
                    log.userId = result.firstName + " " + result.lastName;
                } else if (log.userType === "admin") {
                    const result = await Admin.findById(log.userId, "_id username").lean();
                    log.userId = result.username;
                }
            })
        );

        //console.log("=============================ADMINLOGIN==============================");
        //console.log(req.session.logged_in);

        res.render("main-admin", {
            layout: "admin",
            logged_in: req.session.logged_in,
            active: {admin_home: true},
            reservations_count: reservations_count,
            services_count: services_count,
            employees_count: employees_count,
            faq_count: faq_count,
            logs_inputvalidation_recent: logs_inputvalidation_recent,
            logs_authattempts_recent: logs_authattempts_recent,
            logs_accesscontrol_recent: logs_accesscontrol_recent,
            helpers: {
                formatDate: dateHelper.formatDate,
            },
        });
    },

    getAdminLogs: async function (req, res, next) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            if (req.session.logged_in && req.session.logged_in.type !== "admin") {
                await logAccessControl(req.session.logged_in.user.id, req.session.logged_in.type, req.path);
            }
            res.redirect("/admin?next=" + encodeURIComponent("/admin/logs"));
            return;
        }

        let reservations_count = await Reservation.countDocuments();
        let services_count = await Service.countDocuments();
        let employees_count = await Employee.countDocuments();
        let faq_count = await FAQ.countDocuments();

        let logs_inputvalidation = await Logs_InputValidation.find().sort({timestamp: -1}).lean();
        await Promise.all(
            logs_inputvalidation.map(async (log) => {
                log.timestamp = new Date(log.timestamp).toLocaleString();
                const admin_result = await Admin.findById(log.userId, "_id username").lean();
                //log.userId = `${admin_result.username} (${admin_result._id})`;
                log.userId = admin_result.username;
            })
        );

        let logs_authattempts = await Logs_AuthAttempt.find().sort({timestamp: -1}).lean();
        await Promise.all(
            logs_authattempts.map(async (log) => {
                log.timestamp = new Date(log.timestamp).toLocaleString();
            })
        );

        let logs_accesscontrol = await Logs_AccessControl.find().sort({timestamp: -1}).lean();
        await Promise.all(
            logs_accesscontrol.map(async (log) => {
                log.timestamp = new Date(log.timestamp).toLocaleString();
                if (log.userType === "customer" || log.userType === "employee") {
                    const result = await (log.userType === "customer" ? User : (log.userType === "employee" ? Employee : User)).findById(log.userId, "_id firstName lastName").lean();
                    log.userId = result.firstName + " " + result.lastName;
                } else if (log.userType === "admin") {
                    const result = await Admin.findById(log.userId, "_id username").lean();
                    log.userId = result.username;
                }
            })
        );

        res.render("admin-logs", {
            layout: "admin",
            logged_in: req.session.logged_in,
            active: {admin_logs: true},
            logs_inputvalidation: logs_inputvalidation,
            logs_authattempts: logs_authattempts,
            logs_accesscontrol: logs_accesscontrol
        });
    },

    getAdminReservations: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            if (req.session.logged_in && req.session.logged_in.type !== "admin") {
                await logAccessControl(req.session.logged_in.user.id, req.session.logged_in.type, req.path);
            }
            res.redirect("/admin?next=" + encodeURIComponent("/admin/reservations"));
            return;
        }

        res.render("admin-reservations", {
            layout: "admin",
            logged_in: req.session.logged_in,
            active: {admin_reservations: true},
        });
    },

    getAllReservations: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let reservations = await Reservation.find({}, "")
            .populate("services")
            .populate("userID", "firstName lastName")
            .exec();
        //console.log(reservations);
        /*reservations.forEach(reservation => {
                //console.log(reservation.services);
            })*/
        res.send(reservations);
    },

    postUpdateReservationStatus: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.status(403); // HTTP 403: Forbidden
            return;
        }

        reservation = await Reservation.findOne({_id: req.body.reservation_id});
        userID = reservation.userID;
        await Reservation.updateOne(
            {_id: req.body.reservation_id},
            {status: req.body.reservation_status}
        );
        curr_date = new String(new Date());
        notif_title = "";
        notif_body = "";

        if (req.body.reservation_status == "Pending") {
            notif_type = "Admin Set Pending";
            notif_title = "Reservation has been set to Pending";
            notif_body = "Your reservation was set to Pending by our admin.";
        } else if (req.body.reservation_status == "Approved") {
            notif_type = "Admin Set Approved";
            notif_title = "Your Reservation has been Approved";
            notif_body =
                "Good news! Your reservation has been approved by our admin.";
        } else if (req.body.reservation_status == "Cancelled") {
            notif_type = "Admin Set Cancelled";
            notif_title = "Your Reservation has been Cancelled";
            notif_body =
                "Sorry, dear customer. Your reservation has been cancelled by our admin.";
        }

        await Notification.create({
            receiver: userID,
            type: notif_type,
            timestamp: curr_date,
            title: notif_title,
            body: notif_body,
            reservationID: req.body.reservation_id,
            reason: req.body.status_change_reason,
            isRead: false,
        });
        res.sendStatus(200);
    },

    getServicesOfReservation: async function (req, res) {
        res.send(
            await Reservation.findOne({_id: req.query.reservation_id}, "services")
                .populate("services")
                .exec()
        );
    },

    getAdminEmployees: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            if (req.session.logged_in && req.session.logged_in.type !== "admin") {
                await logAccessControl(req.session.logged_in.user.id, req.session.logged_in.type, req.path);
            }
            res.redirect("/admin?next=" + encodeURIComponent("/admin/employees"));
            return;
        }

        res.render("admin-employees", {
            layout: "admin",
            logged_in: req.session.logged_in,
            active: {admin_employees: true},
        });
    },

    getAllEmployees: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let employees = await Employee.find({}, "");
        res.send(employees);
    },

    postAddEmployee: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let fname = req.body.employee_fname;
        let lname = req.body.employee_lname;
        let email = req.body.employee_email;
        let contact = req.body.employee_contact;

        if (
            fname === undefined ||
            lname === undefined ||
            email === undefined ||
            contact === undefined
        ) {
            res.sendStatus(400); // HTTP 400: Bad Request
            return;
        } else if (fname === "" || lname === "" || email === "" || contact === "") {
            res.sendStatus(400);
            return;
        } else if (!isEmailValid(email)) {
            const error_msg = "Email address is not valid!";
            await logInputValidation(
                req.session.logged_in.user.id,
                req.path,
                "employee_email",
                ValidationRule.InvalidFormatEmail,
                email,
                error_msg
            );
            res.status(400).json({error: error_msg});
            return;
        } else if (!isContactNumValid(contact)) {
            const error_msg = "Contact number is not valid!";
            await logInputValidation(
                req.session.logged_in.user.id,
                req.path,
                "employee_contact",
                ValidationRule.InvalidFormatPhone,
                contact,
                error_msg
            );
            res.status(400).json({error: error_msg});
            return;
        }

        let generatedPassword = generateRandomPassword(20);

        let employee = {
            firstName: fname,
            lastName: lname,
            email: email,
            contactNumber: contact,
            password: generatedPassword,
            changedPassword: false,
        };

        await Employee.create(employee);

        res.status(201).json({password: generatedPassword}); // HTTP 201: Created
    },

    postEditEmployee: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            return res.sendStatus(403); // HTTP 403: Forbidden
        }

        let id = req.body.employee_id;
        let fname = req.body.employee_fname;
        let lname = req.body.employee_lname;
        let email = req.body.employee_email;
        let contact = req.body.employee_contact;

        //console.log(contact);

        if (
            fname === undefined ||
            lname === undefined ||
            email === undefined ||
            contact === undefined
        ) {
            return res.sendStatus(400); // HTTP 400: Bad Request
        } else if (fname === "" || lname === "" || email === "" || contact === "") {
            return res.sendStatus(400);
        } else if (!isEmailValid(email)) {
            const error_msg = "Email address is not valid!";
            await logInputValidation(
                req.session.logged_in.user.id,
                req.path,
                "employee_email",
                ValidationRule.InvalidFormatEmail,
                email,
                error_msg
            );
            return res.status(400).json({error: error_msg});
        } else if (!isContactNumValid(contact)) {
            const error_msg = "Contact number is not valid!";
            //console.log("controller: " + req.session.logged_in.user.id);
            await logInputValidation(
                req.session.logged_in.user.id,
                req.path,
                "employee_contact",
                ValidationRule.InvalidFormatPhone,
                contact,
                error_msg
            );
            return res.status(400).json({error: error_msg});
        }

        let employee = {
            firstName: fname,
            lastName: lname,
            email: email,
            contactNumber: contact,
        };

        await Employee.updateOne({_id: id}, employee);

        res.sendStatus(200); // HTTP 200: OK
    },

    postDeleteEmployee: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let id = req.body.employee_id;
        let fname = req.body.employee_fname;
        let lname = req.body.employee_lname;
        let email = req.body.employee_email;
        let contact = req.body.employee_contact;

        if (
            fname === undefined ||
            lname === undefined ||
            email === undefined ||
            contact === undefined
        ) {
            res.sendStatus(400); // HTTP 400: Bad Request
            return;
        } else if (fname === "" || lname === "" || email === "" || contact === "") {
            res.sendStatus(400);
            return;
        } else if (!isEmailValid(email)) {
            res.sendStatus(400).json({error: "Email address is not valid!"});
            return;
        } else if (!isContactNumValid(contact)) {
            res.sendStatus(400).json({error: "Contact number is not valid!"});
            return;
        }

        let employee = {
            firstName: fname,
            lastName: lname,
            email: email,
            contactNumber: contact,
        };

        await Employee.deleteOne({_id: id}, employee);

        res.sendStatus(200); // HTTP 200: OK
    },

    getAdminServices: async function (req, res, next) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            if (req.session.logged_in && req.session.logged_in.type !== "admin") {
                await logAccessControl(req.session.logged_in.user.id, req.session.logged_in.type, req.path);
            }
            res.redirect("/admin?next=" + encodeURIComponent("/admin/services"));
            return;
        }

        let serviceCollections = await ServiceCollection.find({})
            .populate("services", "specialServices")
            .lean()
            .exec();

        let serviceCollectionsWithTags = serviceCollections.map((coll) => {
            optionChoices1Tags = [];
            optionChoices2Tags = [];

            if (coll.optionChoices1.length > 3) {
                for (let i = 0; i < 3; i++) {
                    optionChoices1Tags[i] = coll.optionChoices1[i];
                }
            } else {
                for (let i = 0; i < coll.optionChoices1.length; i++) {
                    optionChoices1Tags[i] = coll.optionChoices1[i];
                }
            }

            if (coll.optionChoices2.length > 3) {
                for (let i = 0; i < 3; i++) {
                    optionChoices2Tags[i] = coll.optionChoices2[i];
                }
            } else {
                for (let i = 0; i < coll.optionChoices2.length; i++) {
                    optionChoices2Tags[i] = coll.optionChoices2[i];
                }
            }

            return {
                serviceConcern: coll.serviceConcern,
                serviceTitle: coll.serviceTitle,
                services: coll.services,
                optionChoices1: coll.optionChoices1,
                optionChoices2: coll.optionChoices2,
                specialServices: coll.specialServices,
                optionChoices1Tags: optionChoices1Tags,
                optionChoices2Tags: optionChoices2Tags,
            };
        });

        res.render("services-admin", {
            layout: "admin",
            logged_in: req.session.logged_in,
            active: {admin_services: true},
            service_collections: serviceCollectionsWithTags,
        });
    },

    getFindServiceCollection: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let serviceCollection = await ServiceCollection.findOne({
            _id: req.query.id,
        })
            .populate("services")
            .populate("specialServices");

        res.send(serviceCollection);
    },

    getServiceCollections: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let serviceCollections = await ServiceCollection.find({})
            .populate("services", "specialServices")
            .lean()
            .exec();

        let serviceCollectionsWithTags = serviceCollections.map((coll) => {
            optionChoices1Tags = [];
            optionChoices2Tags = [];

            if (coll.optionChoices1.length > 3) {
                for (let i = 0; i < 3; i++) {
                    optionChoices1Tags[i] = coll.optionChoices1[i];
                }
            } else {
                for (let i = 0; i < coll.optionChoices1.length; i++) {
                    optionChoices1Tags[i] = coll.optionChoices1[i];
                }
            }

            if (coll.optionChoices2.length > 3) {
                for (let i = 0; i < 3; i++) {
                    optionChoices2Tags[i] = coll.optionChoices2[i];
                }
            } else {
                for (let i = 0; i < coll.optionChoices2.length; i++) {
                    optionChoices2Tags[i] = coll.optionChoices2[i];
                }
            }

            return {
                _id: coll._id,
                serviceConcern: coll.serviceConcern,
                serviceTitle: coll.serviceTitle,
                services: coll.services,
                optionChoices1: coll.optionChoices1,
                optionChoices2: coll.optionChoices2,
                specialServices: coll.specialServices,
                optionChoices1Tags: optionChoices1Tags,
                optionChoices2Tags: optionChoices2Tags,
            };
        });
        res.send(serviceCollectionsWithTags);
    },

    postAddServiceCollection: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }
        // check if service title is unique
        let uniquecheck = await ServiceCollection.findOne(
            {serviceTitle: req.body.serviceTitle},
            "serviceTitle"
        );

        if (
            uniquecheck != null &&
            uniquecheck.serviceTitle === req.body.serviceTitle
        ) {
            res.json({hasError: true, error: "Service Title already exists!"});
            return;
        }

        // extract services and insert to DB

        if (Array.isArray(req.body.services) && req.body.services.length !== 0) {
            await Service.insertMany(req.body.services);
        }

        if (
            Array.isArray(req.body.specialServices) &&
            req.body.specialServices.length !== 0
        ) {
            await SpecialService.insertMany(req.body.specialServices);
        }

        let services = await Service.find({serviceTitle: req.body.serviceTitle});
        let serviceIds = await services.map((service) => service._id);

        let standaloneServices = await SpecialService.find({
            serviceTitle: req.body.serviceTitle,
        });
        let standaloneServiceIds = await standaloneServices.map(
            (service) => service._id
        );

        let newServiceCollection = {
            serviceConcern: req.body.serviceConcern,
            serviceTitle: req.body.serviceTitle,
            optionChoices1: req.body.optionChoices1,
            optionChoices2: req.body.optionChoices2,
            services: serviceIds,
            specialServices: standaloneServiceIds,
        };

        await ServiceCollection.create(newServiceCollection);

        res.sendStatus(200); // HTTP 200: OK
    },

    postEditServiceCollection: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let id = req.body.id;

        // check if service title is unique
        let uniquecheck = await ServiceCollection.findOne(
            {serviceTitle: req.body.serviceTitle},
            "serviceTitle"
        );

        if (
            uniquecheck != null &&
            uniquecheck.serviceTitle === req.body.serviceTitle &&
            uniquecheck._id != id
        ) {
            res.json({hasError: true, error: "Service Title already exists!"});
            return;
        }

        let service_collection_to_be_deleted = await ServiceCollection.findOne({
            _id: id,
        });

        // delete existing info

        await Service.deleteMany({
            serviceTitle: service_collection_to_be_deleted.serviceTitle,
        });
        await SpecialService.deleteMany({
            serviceTitle: service_collection_to_be_deleted.serviceTitle,
        });

        // extract services and insert to DB

        if (Array.isArray(req.body.services) && req.body.services.length !== 0) {
            await Service.insertMany(req.body.services);
        }

        if (
            Array.isArray(req.body.specialServices) &&
            req.body.specialServices.length !== 0
        ) {
            await SpecialService.insertMany(req.body.specialServices);
        }

        let services = await Service.find({serviceTitle: req.body.serviceTitle});
        let serviceIds = await services.map((service) => service._id);

        let standaloneServices = await SpecialService.find({
            serviceTitle: req.body.serviceTitle,
        });
        let standaloneServiceIds = await standaloneServices.map(
            (service) => service._id
        );

        let newServiceCollection = {};

        newServiceCollection = {
            serviceConcern: req.body.serviceConcern,
            serviceTitle: req.body.serviceTitle,
            optionChoices1: req.body.optionChoices1,
            optionChoices2: req.body.optionChoices2,
            services: serviceIds,
            specialServices: standaloneServiceIds,
        };

        await ServiceCollection.replaceOne({_id: id}, newServiceCollection);

        res.sendStatus(200); // HTTP 200: OK
    },

    postDeleteServiceCollection: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let deleteServices = await Service.deleteMany({
            serviceTitle: req.body.serviceTitle,
        });
        let deleteSpecialServices = await SpecialService.deleteMany({
            serviceTitle: req.body.serviceTitle,
        });
        let deleteServiceCollection = await ServiceCollection.deleteOne({
            serviceTitle: req.body.serviceTitle,
        });

        if (
            deleteServices.deletedCount > 0 ||
            deleteSpecialServices.deletedCount > 0 ||
            deleteServiceCollection.deletedCount > 0
        ) {
            res.sendStatus(200); // HTTP 200: OK
        } else {
            res.json({hasError: true, error: "Nothing to delete."});
        }
    },

    getFAQ: function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        res.render("faq-admin", {
            layout: "admin",
            logged_in: req.session.logged_in,
            active: {admin_FAQ: true},
        });
    },

    getAllFAQs: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let faqs = await FAQ.find({}, "");
        res.send(faqs);
    },

    getFindFAQ: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let faq = await FAQ.findOne({_id: req.query.id});
        res.send(faq);
    },

    postAddFAQ: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let newFAQ = {
            question: req.body.question,
            answer: req.body.answer,
        };

        await FAQ.create(newFAQ);

        res.sendStatus(200); // HTTP 200: OK
    },

    postEditFAQ: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let newFAQ = {
            question: req.body.question,
            answer: req.body.answer,
        };

        await FAQ.updateOne({_id: req.body.id}, newFAQ);

        res.sendStatus(200); // HTTP 200: OK
    },

    postDeleteFAQ: async function (req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "admin") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let result = await FAQ.deleteOne({_id: req.body.id});

        if (result.deletedCount > 0) {
            res.sendStatus(200); // HTTP 200: OK
        } else {
            res.json({hasError: true, error: "Nothing to delete."});
        }
    },

    // Admin Forgot Password Methods
    getAdminSecurityQuestions: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== 'admin') {
                return res.status(401).json({ success: false, message: 'Unauthorized access.' });
            }

            const adminId = req.session.logged_in.user.id;
            const admin = await Admin.findById(adminId, 'securityQuestion1 securityQuestion2');

            if (!admin) {
                return res.status(404).json({ success: false, message: 'Admin not found.' });
            }

            // Check if admin has security questions set up
            if (!admin.securityQuestion1 && !admin.securityQuestion2) {
                return res.json({ 
                    success: false, 
                    message: 'No security questions are set up. Please set up security questions first.',
                    hasQuestions: false
                });
            }

            res.json({ 
                success: true, 
                securityQuestion1: admin.securityQuestion1 || null,
                securityQuestion2: admin.securityQuestion2 || null,
                hasQuestions: true
            });
        } catch (error) {
            console.error('Error checking admin security questions:', error);
            res.status(500).json({ success: false, message: 'An error occurred while checking security questions.' });
        }
    },

    postAdminSecurityAnswers: async function (req, res) {
        try {
            if (!req.session.logged_in || req.session.logged_in.type !== 'admin') {
                return res.status(401).json({ success: false, message: 'Unauthorized access.' });
            }

            const { answer1, answer2 } = req.body;
            const adminId = req.session.logged_in.user.id;
            
            if (!answer1 && !answer2) {
                return res.status(400).json({ success: false, error: 'At least one security answer is required.' });
            }

            const admin = await Admin.findById(adminId, 'securityQuestion1 securityQuestion2 securityAnswer1 securityAnswer2');
            
            if (!admin) {
                return res.status(404).json({ success: false, error: 'Admin not found.' });
            }

            // Check security answers (using bcrypt comparison)
            let isCorrect1 = false;
            let isCorrect2 = false;

            // If answer1 is provided and admin has securityAnswer1, check it
            if (answer1 && admin.securityAnswer1) {
                isCorrect1 = await bcrypt.compare(answer1, admin.securityAnswer1);
            }
            
            // If answer2 is provided and admin has securityAnswer2, check it
            if (answer2 && admin.securityAnswer2) {
                isCorrect2 = await bcrypt.compare(answer2, admin.securityAnswer2);
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
                return res.status(400).json({ verified: false, error: 'Incorrect security answers. Please try again.' });
            }

            res.json({ verified: true, success: true });
        } catch (error) {
            console.error('Error verifying admin security answers:', error);
            res.status(500).json({ success: false, error: 'An error occurred while verifying the answers.' });
        }
    },

    getAdminResetPassword: async function (req, res) {
        const token = req.query.token;
        
        if (!token) {
            return res.render('login-admin', {
                layout: 'no-sidebar',
                error: 'Invalid reset link. Please try the forgot password process again.'
            });
        }

        try {
            // Find admin with this reset token and check if it's still valid
            const admin = await Admin.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });
            
            if (!admin) {
                return res.render('login-admin', {
                    layout: 'no-sidebar',
                    error: 'Reset link has expired or is invalid. Please try the forgot password process again.'
                });
            }

            // Render the reset password form
            res.render('reset-password-admin', {
                layout: 'no-sidebar',
                token: token,
                isAdmin: true
            });
        } catch (error) {
            console.error('Error validating admin reset token:', error);
            res.render('login-admin', {
                layout: 'no-sidebar',
                error: 'An error occurred. Please try again.'
            });
        }
    },

    postAdminResetPassword: async function (req, res) {
        const { token, newPassword, confirmPassword } = req.body;
        
        // Validate input
        if (!token || !newPassword || !confirmPassword) {
            return res.render('reset-password-admin', {
                layout: 'no-sidebar',
                token: token,
                isAdmin: true,
                error: 'All fields are required.'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('reset-password-admin', {
                layout: 'no-sidebar',
                token: token,
                isAdmin: true,
                error: 'Passwords do not match.'
            });
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return res.render('reset-password-admin', {
                layout: 'no-sidebar',
                token: token,
                isAdmin: true,
                error: 'Password must be at least 8 characters long.'
            });
        }

        if (!/[A-Z]/.test(newPassword)) {
            return res.render('reset-password-admin', {
                layout: 'no-sidebar',
                token: token,
                isAdmin: true,
                error: 'Password must contain at least one uppercase letter.'
            });
        }

        if (!/[a-z]/.test(newPassword)) {
            return res.render('reset-password-admin', {
                layout: 'no-sidebar',
                token: token,
                isAdmin: true,
                error: 'Password must contain at least one lowercase letter.'
            });
        }

        if (!/[0-9]/.test(newPassword)) {
            return res.render('reset-password-admin', {
                layout: 'no-sidebar',
                token: token,
                isAdmin: true,
                error: 'Password must contain at least one number.'
            });
        }

        try {
            // Find admin with valid reset token
            const admin = await Admin.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });
            
            if (!admin) {
                return res.render('reset-password-admin', {
                    layout: 'no-sidebar',
                    token: token,
                    isAdmin: true,
                    error: 'Reset link has expired or is invalid. Please try the forgot password process again.'
                });
            }

            // Hash the new password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update admin password and clear reset token
            await Admin.updateOne(
                { _id: admin._id },
                {
                    password: hashedPassword,
                    resetPasswordToken: undefined,
                    resetPasswordExpires: undefined
                }
            );

            // Redirect to admin login with success message
            res.redirect('/admin?reset=success');

        } catch (error) {
            console.error('Error resetting admin password:', error);
            res.render('reset-password-admin', {
                layout: 'no-sidebar',
                token: token,
                isAdmin: true,
                error: 'An error occurred while resetting your password. Please try again.'
            });
        }
    },

    // Admin Password Recovery Functions (for forgot password flow)
    getAdminSecurityQuestionsForRecovery: async function (req, res) {
        const username = req.query.username;
        
        if (!username) {
            return res.status(400).json({ success: false, message: 'Username is required.' });
        }

        try {
            const admin = await Admin.findOne({ username: username }, 'securityQuestion1 securityQuestion2');
            
            if (!admin) {
                return res.status(404).json({ success: false, message: 'No admin account found with this username.' });
            }

            // Check if admin has any security questions
            if (!admin.securityQuestion1 && !admin.securityQuestion2) {
                return res.status(404).json({ success: false, message: 'No security questions are set up for this account. Please contact your administrator.' });
            }

            res.json({ 
                success: true, 
                question1: admin.securityQuestion1 || null,
                question2: admin.securityQuestion2 || null
            });
        } catch (error) {
            console.error('Error fetching admin security questions:', error);
            res.status(500).json({ success: false, message: 'An error occurred while fetching the security questions.' });
        }
    },

    postAdminSecurityAnswersForRecovery: async function (req, res) {
        const { username, answer1, answer2 } = req.body;
        
        if (!username) {
            return res.status(400).json({ success: false, message: 'Username is required.' });
        }

        if (!answer1 && !answer2) {
            return res.status(400).json({ success: false, message: 'At least one security answer is required.' });
        }

        try {
            const admin = await Admin.findOne({ username: username }, 'securityQuestion1 securityQuestion2 securityAnswer1 securityAnswer2');
            
            if (!admin) {
                return res.status(404).json({ success: false, message: 'No admin account found with this username.' });
            }

            // Check security answers (using bcrypt comparison)
            let isCorrect1 = false;
            let isCorrect2 = false;

            // If answer1 is provided and admin has securityAnswer1, check it
            if (answer1 && admin.securityAnswer1) {
                isCorrect1 = await bcrypt.compare(answer1, admin.securityAnswer1);
            }
            
            // If answer2 is provided and admin has securityAnswer2, check it
            if (answer2 && admin.securityAnswer2) {
                isCorrect2 = await bcrypt.compare(answer2, admin.securityAnswer2);
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

            // Update admin with reset token
            await Admin.updateOne(
                { username: username },
                { 
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: resetExpires 
                }
            );

            res.json({ success: true, resetToken: resetToken });
        } catch (error) {
            console.error('Error verifying admin security answers:', error);
            res.status(500).json({ success: false, message: 'An error occurred while verifying the answers.' });
        }
    },
};

module.exports = controller;
