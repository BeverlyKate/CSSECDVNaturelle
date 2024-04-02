const Employee = require('../models/Employee')
const ServiceCollection = require('../models/ServiceCollection.js');
const Service = require('../models/Service.js');
const SpecialService = require('../models/SpecialService.js');
const Reservation = require('../models/Reservation.js');
const Notification = require('../models/Notification');
const InCartService = require('../models/InCartService.js');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');


const controller = {
    getEmployeeLogin: function(req, res, next) {
        if (!req.session.logged_in) {
            res.render('login-employee', {layout: 'employee-no-sidebar'});
        } else if (req.session.logged_in.type !== "employee") {
            let pre_text = "You need to logout as a";
            if (req.session.logged_in.type === "employee") pre_text += "n";
            pre_text += " ";

            res.render('login-employee', {
                layout: 'employee-no-sidebar',
                logged_in: req.session.logged_in,
                snackbar: {
                    type: "error",
                    persistent: true,
                    text: pre_text + req.session.logged_in.type + " before you can login as an employee.",
                    action: {
                        text: "LOGOUT",
                        link: "/logout?next=%2Femployee"
                    }
                }
            });
        } else {
            next();
        }
    },

    postEmployeeLogin: async function(req, res) {
        let email = req.body.email;
        let password = req.body.password;

        if (email === undefined || password === undefined) {
            res.render('login-employee', {
                layout: 'employee-no-sidebar',
                active: {login: true},
                error: 'Please enter your email and password.'
            });
            return;
        }

        let result = await Employee.findOne({email: email});

        if (result == null) {
            res.render('login-employee', {
                layout: 'employee-no-sidebar',
                active: {login: true},
                error: 'Incorrect email or password.'
            });
            return;
        }

        if (result.changedPassword){
            let passwordCompare = await bcrypt.compare(password, result.password);
            if (!passwordCompare) {
                res.render('login-employee', {
                    layout: 'employee-no-sidebar',
                    active: {login: true},
                    error: 'Incorrect email or password.'
                });
                return;
            }
        } else {
            if (result.password != password) {
                res.render('login-employee', {
                    layout: 'employee-no-sidebar',
                    active: {login: true},
                    error: 'Incorrect email or password.'
                });
                return;
            }
        }
        

        let employee_name = result.firstName + " "+ result.lastName

        if (!result.changedPassword){

            req.session.first_time = {
                user: {
                    employee_id: result._id,
                    employee_name: employee_name,
                    employee_firstName: result.firstName,
                    employee_lastName: result.lastName,
                    employee_email: result.email,
                    employee_contactNumber: result.contactNumber,
                    employee_changedPassword: result.changedPassword
                }
            };

            first_time_login_id = result._id
            res.redirect("/employee/first-time-login")
        }
        else {
            req.session.logged_in = {
                state: true,
                type: "employee",
                user: {
                    employee_id: result._id,
                    employee_name: employee_name,
                    employee_firstName: result.firstName,
                    employee_lastName: result.lastName,
                    employee_email: result.email,
                    employee_contactNumber: result.contactNumber,
                    employee_changedPassword: result.changedPassword
                }
            };
    
            res.redirect('/employee');
        }
    },

    getEmployeeFirstTimeLogin: function(req, res) {
        console.log(req.session.first_time)
        if (req.session.first_time) {
            res.render('employee-first-time-login', {layout: 'employee-no-sidebar', logged_in: {state: "valid"}});
        } else if (!req.session.first_time) {
            res.render('employee-first-time-login', {
                layout: 'employee-no-sidebar',
                logged_in: {state: "invalid"},
                snackbar: {
                    type: "error",
                    persistent: true,
                    text: "You are an unauthorized user.",
                    action: {
                        text: "GO BACK",
                        link: "/employee"
                    }
                }
            });
        } else {
            res.redirect('/employee');
        }
    },

    postEmployeeFirstTimeLogin: async function(req, res, next) {
        let password = req.body.password;

        if (password === undefined) {
            res.render('employee-first-time-login', {
                layout: 'employee-no-sidebar',
                active: {login: true},
                error: 'Please enter a new password.'
            });
            return;
        }

        if (password.length < 8) {
            res.render('employee-first-time-login', {
                layout: 'employee-no-sidebar',
                active: {login: true},
                error: 'Password should be at least 8 characters!'
            });
            return;
        }

        const saltRounds = 10;

        let passwordHashed = await bcrypt.hash(password, saltRounds);

        await Employee.updateOne({_id: req.session.first_time.user.employee_id}, {password: passwordHashed, changedPassword:true})
        let result = await Employee.findOne({_id: req.session.first_time.user.employee_id})
        let employee_name = result.firstName + " "+ result.lastName

        console.log(result)
        req.session.logged_in = {
            state: true,
            type: "employee",
            user: {
                employee_id: result._id,
                employee_name: employee_name,
                employee_firstName: result.firstName,
                employee_lastName: result.lastName,
                employee_email: result.email,
                employee_contactNumber: result.contactNumber,
                employee_changedPassword: result.changedPassword
            }
        };

        delete req.session.first_time

        res.redirect('/employee');
    },

    getEmployeeDashboard: function(req, res, next) {
        if (!req.session.logged_in || req.session.logged_in.type !== "employee") {
            next();
            return;
        }

        res.render('employee-reservations', {
            layout: 'employee',
            logged_in: req.session.logged_in,
            active: {employee_home: true}
        });
    },

    getRequestTempPassword: async function(req, res, next) {
        let employee = await Employee.findOne({_id:req.query.id})

        let password = {
            password: employee.password
        }

        res.send(password)
    },

    getEmployeeReservations: async function(req, res) {
        if (!req.session.logged_in || req.session.logged_in.type !== "employee") {
            res.sendStatus(403); // HTTP 403: Forbidden
            return;
        }

        let reservations = await Reservation.find({}).populate('services').populate('userID', 'firstName lastName').exec();
        let employee_id = new ObjectId (req.query.id)
        const filteredReservations = reservations.filter(reservation => {
            let foundMatch = false;
            reservation.services.forEach(service => {
                console.log(service)
                if (service.employeeID == undefined){
                    foundMatch = false;
                } else if (service.employeeID.equals(employee_id)) {
                    foundMatch = true;
                }
            });
            console.log(foundMatch)
            return foundMatch;
        });
        console.log(filteredReservations)
        res.send(filteredReservations)
    },
    
    getEmployeeServicesOfReservation: async function(req, res) {
        const reservation = await Reservation.findOne({_id: req.query.reservation_id}, 'services').populate("services").exec()
        let employee_id = new ObjectId (req.query.employee_id)
        const filteredServices = reservation.services.filter(service => {
            let foundMatch = false;
            if (service.employeeID == undefined){
                foundMatch = false;
            } else if (service.employeeID.equals(employee_id)) {
                foundMatch = true;
            }
            return foundMatch;
        });

        let filteredReservation = {
            _id: reservation._id,
            services: filteredServices
        }

        res.send(filteredReservation);
    },

    postUpdateServiceStatus: async function(req, res){
        await InCartService.updateOne({_id: req.body.id}, {status: req.body.service_status})
        let service = await InCartService.findOne({_id: req.body.id})
        let reservation = await Reservation.findOne({_id: req.body.reservation_id})
        userID = reservation.userID

        curr_date = new String(new Date())
        let notif_title = ""
        let notif_body = ""
        let notif_type = ""

        if (req.body.service_status == "Pending"){
            notif_type = "Employee Set Pending"
            notif_title = "Service Request has been set to Pending"
            notif_body = "Your service request for " + service.serviceTitle + " was set to Pending by " + service.preferredEmployee
        }
        else if (req.body.service_status == "Approved"){
            notif_type = "Employee Set Approved"
            notif_title = "Service Request has been Approved"
            notif_body = "Good news! Your service request for " + service.serviceTitle + " has been approved by " + service.preferredEmployee
        }
        else if (req.body.service_status == "Cancelled"){
            notif_type = "Employee Set Cancelled"
            notif_title = "Service Request has been Cancelled"
            notif_body = "Sorry, dear customer. Your service request for " + service.serviceTitle + " has been cancelled by " + service.preferredEmployee
        }
        
         let notification = await Notification.create({
            receiver: userID,
            type: notif_type,
            timestamp: curr_date,
            title: notif_title,
            body: notif_body,
            reservationID: req.body.reservation_id,
            reason: req.body.reason,
            isRead: false
        })
        console.log(notification)

        res.sendStatus(200)
    },

    postEmployeeSettings: async function(req, res) {
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
        
        let matched = await bcrypt.compare(current_password, comparePassword.password);

        if (!matched) {
            res.status(403).send({error: "Current password is incorrect!"});
            return;
        }

        if (new_password !== "") {
            if (new_password.length < 8) {
                res.status(403).send({error: "Password must contain at least 8 characters!"});
                return;
            }

            let passwordHashed = await bcrypt.hash(new_password, 10);

            await Employee.updateOne({_id: employee_id}, {
                firstName: fname,
                lastName: lname,
                email: email,
                contactNumber: contactNumber,
                password: passwordHashed
            });

            let employee_name = fname + " "+ lname

            req.session.logged_in = {
                state: true,
                type: "employee",
                user: {
                    employee_id: employee_id,
                    employee_name: employee_name,
                    employee_firstName: fname,
                    employee_lastName: lname,
                    employee_email: email,
                    employee_contactNumber: contactNumber,
                    employee_changedPassword: true
                }
            };

            res.sendStatus(200);
            return;
        }

        await Employee.updateOne({_id: employee_id}, {
            firstName: fname,
            lastName: lname,
            email: email,
            contactNumber: contactNumber
        });

        let employee_name = fname + " "+ lname

        req.session.logged_in = {
            state: true,
            type: "employee",
            user: {
                employee_id: employee_id,
                employee_name: employee_name,
                employee_firstName: fname,
                employee_lastName: lname,
                employee_email: email,
                employee_contactNumber: contactNumber,
                employee_changedPassword: true
            }
        };

        res.sendStatus(200);
    }
}

module.exports = controller;