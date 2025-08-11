const bcrypt = require("bcrypt");

const ServiceCollection = require("../models/ServiceCollection.js");
const Service = require("../models/Service.js");
const SpecialService = require("../models/SpecialService.js");
const FAQ = require("../models/FAQ.js");
const Reservation = require("../models/Reservation.js");
const Notification = require("../models/Notification");
const User = require("../models/User");
const {logAuthAttempt, Status, UserType, AttemptType} = require("../utils/util-log-auth-attempt");
const {logInputValidation, ValidationRule} = require("../utils/util-log-input-validation");

const controller = {
  getLogout: function (req, res) {
    let redirect;

    switch (req.session.logged_in.type) {
      case "customer":
        redirect = "/";
        break;
      case "admin":
        redirect = "/admin";
        break;
      case "employee":
        redirect = "/employee";
        break;
    }

    req.session.destroy((err) => {
      if (err) throw err;

      if (req.query.next) res.redirect(decodeURIComponent(req.query.next));
      else res.redirect(redirect);
    });
  },

  getIndex: function (req, res) {
    res.render("main", {
      layout: "index",
      active: { home: true },
      logged_in: req.session.logged_in,
    });
  },

  getAbout: function (req, res) {
    res.render("about", {
      layout: "index",
      active: { about: true },
      logged_in: req.session.logged_in,
    });
  },

  getReservation: function (req, res) {
    if (
      !req.session.logged_in ||
      (req.session.logged_in && req.session.logged_in.type !== "customer")
    ) {
      res.redirect("/login?next=" + encodeURIComponent("/reservation"));
      return;
    }

    res.render("reservation", {
      layout: "index",
      active: { reservation: true },
      logged_in: req.session.logged_in,
    });
  },

  getReserveInfo: async function (req, res) {
    if (
      !req.session.logged_in ||
      (req.session.logged_in && req.session.logged_in.type !== "customer")
    ) {
      res.redirect("/login?next=" + encodeURIComponent("/reservation"));
      return;
    }

    let userID = req.session.logged_in.user.id;

    let reservation_info = await Reservation.find({ currentUserID: userID })
      .populate("services")
      .lean()
      .exec();

    let reservationsWithFormattedDate = reservation_info.map((coll) => {
      formattedDate = new Date(coll.timestamp).toUTCString();

      return {
        reservationID: coll._id,
        currentUserID: coll.currentUserID,
        timestamp: formattedDate,
        services: coll.services,
        status: coll.status,
      };
    });

    res.render("reserveinfo", {
      layout: "index",
      active: { reservation: true },
      logged_in: req.session.logged_in,
      reservation_info: reservationsWithFormattedDate,
    });
  },

  getUserReservations: async function (req, res) {
    if (
      !req.session.logged_in ||
      (req.session.logged_in && req.session.logged_in.type !== "customer")
    ) {
      res.redirect("/login?next=" + encodeURIComponent("/reservation"));
      return;
    }

    let userID = req.session.logged_in.user.id;
    //console.log(userID)
    let reservation_info = await Reservation.find({ userID: userID })
      .populate("services")
      .lean()
      .exec();
    //console.log(reservation_info)
    let reservationsWithFormattedDate = reservation_info
      .map((coll) => {
        formattedDate = new Date(coll.timestamp).toUTCString();

        return {
          reservationID: coll._id,
          currentUserID: coll.currentUserID,
          timestamp: formattedDate,
          services: coll.services,
          status: coll.status,
        };
      })
      .reverse();

    res.send(reservationsWithFormattedDate);
  },

  getServices: async function (req, res) {
    // Find all Nail related services
    let serviceCollections = await ServiceCollection.find({
      serviceConcern: req.params.serviceconcern,
    })
      .populate("services")
      .populate("specialServices");

    let pricesCollectionObject = [];
    let pricesWithOption2 = [];

    // Transform to JSON object
    let serviceCollectionsObject = serviceCollections.map((coll) =>
      coll.toObject()
    );

    // Check each service option combination
    let mappedServiceCollection = serviceCollectionsObject.map((coll) => {
      let pricesCollection = [];

      for (let i = 0; i < coll.optionChoices2.length; i++) {
        let rowPriceCollection = [];
        let result;

        for (let j = 0; j < coll.optionChoices1.length; j++) {
          // Check if there is an existing service title, service options 1 and 2, in the collection
          result = coll.services.filter(
            (srv) =>
              srv.serviceOption2 == coll.optionChoices2[i] &&
              srv.serviceOption1 == coll.optionChoices1[j] &&
              srv.serviceTitle == coll.services[i].serviceTitle
          );

          // If nothing was found, push 0; else push the result's price
          if (result.length <= 0) {
            rowPriceCollection.push(0);
          } else {
            rowPriceCollection.push(result[0].price);
          }
        }

        // Make a 'tuple'
        pricesWithOption2 = [coll.optionChoices2[i], rowPriceCollection];

        pricesCollection.push(pricesWithOption2);
      }

      // Turn tuple into object
      pricesCollectionObject = pricesCollection.map((coll) => {
        return {
          serviceOption2: coll[0],
          prices: coll[1],
        };
      });

      return {
        serviceTitle: coll.serviceTitle,
        optionChoices1: coll.optionChoices1,
        optionChoices2: coll.optionChoices2,
        services: pricesCollectionObject,
        specialServices: coll.specialServices,
      };
    });

    res.render("services", {
      layout: "index",
      active: { services: true },
      logged_in: req.session.logged_in,
      serviceCollections: mappedServiceCollection,
    });
  },

  getServiceConcerns: async function (req, res) {
    serviceConcerns = await ServiceCollection.distinct("serviceConcern");

    res.send(serviceConcerns);
  },

  getFAQ: async function (req, res) {
    let faqs = await FAQ.find({}, "").lean();

    //console.log(faqs)

    res.render("faq", {
      layout: "index",
      active: { faq: true },
      logged_in: req.session.logged_in,
      faqs: faqs,
    });
  },

  getNotifications: async function (req, res) {
    if (
      !req.session.logged_in ||
      (req.session.logged_in && req.session.logged_in.type !== "customer")
    ) {
      res.redirect("/login?next=" + encodeURIComponent("/reservation"));
      return;
    }

    notifications = await (
      await Notification.find({ receiver: req.session.logged_in.user.id })
    ).reverse();
    res.send(notifications);
  },

  findNotification: async function (req, res) {
    notification = await Notification.findOne({ _id: req.query.id });

    await Notification.updateOne({ _id: req.query.id }, { isRead: "true" });

    let data = {};

    if (
      notification.type == "Admin Set Pending" ||
      notification.type == "Admin Set Approved" ||
      notification.type == "Admin Set Cancelled" ||
      notification.type == "Reservation Pending" ||
      notification.type == "Employee Set Cancelled" ||
      notification.type == "Employee Set Pending" ||
      notification.type == "Employee Set Approved" ||
      notification.type == "Customer Set Cancelled"
    ) {
      reservation = await Reservation.findOne({
        _id: notification.reservationID,
      })
        .populate("services")
        .exec();

      data = {
        notif_details: notification,
        reservation_details: reservation,
      };
    } else {
      data = {
        notif_details: notification,
      };
    }

    res.send(data);
    //console.log(data)
  },

  postCancelReservation: async function (req, res) {
    let reservation_id = req.body.reservation_id;

    await Reservation.updateOne(
      { _id: reservation_id },
      { status: "Cancelled" }
    );
    let userID = req.session.logged_in.user.id;
    curr_date = new String(new Date());
    await Notification.create({
      receiver: userID,
      type: "Customer Set Cancelled",
      timestamp: curr_date,
      title: "You cancelled a Reservation",
      body: "You cancelled the following reservation:",
      reservationID: req.body.reservation_id,
      isRead: false,
    });

    res.sendStatus(200); // HTTP 200: OK
  },

  getFindReservation: async function (req, res) {
    let reservation = await Reservation.findOne({ _id: req.query.id }).populate(
      "services"
    );

    formattedDate = new Date(reservation.timestamp).toUTCString();

    formattedReservation = {
      reservationID: reservation._id,
      currentUserID: reservation.currentUserID,
      timestamp: formattedDate,
      services: reservation.services,
      status: reservation.status,
    };
    res.send(formattedReservation);
  },

  getSettings: function (req, res) {
    if (!req.session.logged_in || req.session.logged_in.type !== "customer") {
      res.redirect("/login?next=" + encodeURIComponent("/settings"));
      return;
    }

    res.render("customer-settings", {
      layout: "index",
      logged_in: req.session.logged_in,
    });
  },

  postSettings: async function (req, res) {
    if (!req.session.logged_in || req.session.logged_in.type !== "customer") {
      res.sendStatus(401); // HTTP 401: Unauthorized
      return;
    }

    let customer_id = req.body.customer_id;
    let fname = req.body.fname;
    let lname = req.body.lname;
    let email = req.body.email;
    let contact = req.body.contact;
    let old_password = req.body.old_password;
    let new_password = req.body.new_password;

    if (fname === "") {
      const error_msg = "Please enter your first name.";
      await logInputValidation(email, req.path, "fname", ValidationRule.Required, fname, error_msg);
      res.status(400).send({ error: error_msg });
      return;
    }

    if (lname === "") {
      const error_msg = "Please enter your last name.";
      await logInputValidation(email, req.path, "lname", ValidationRule.Required, lname, error_msg);
      res.status(400).send({ error: error_msg });
      return;
    }

    if (email === "") {
      const error_msg = "Please enter your email address.";
      await logInputValidation(email, req.path, "email", ValidationRule.Required, email, error_msg);
      res.status(400).send({ error: error_msg });
      return;
    }

    if (contact === "") {
      const error_msg = "Please enter your contact number.";
      await logInputValidation(email, req.path, "contact", ValidationRule.Required, contact, error_msg);
      res.status(400).send({ error: error_msg });
      return;
    }

    if (old_password === "") {
      const error_msg = "Please enter your current password to continue.";
      await logInputValidation(email, req.path, "old_password", ValidationRule.Required, old_password, error_msg);
      res.status(400).send({ error: error_msg });
      return;
    }

    const validEmailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    let isEmailValid = validEmailRegex.test(email);

    if (!isEmailValid) {
      const error_msg = "Please enter a valid email address.";
      await logInputValidation(email, req.path, "email", ValidationRule.InvalidFormatEmail, email, error_msg);
      res.status(400).send({ error: error_msg });
      return;
    }

    const validContactNumRegex = /^(09)\d{9}/;
    let isContactNumValid = validContactNumRegex.test(contact);

    if (!isContactNumValid) {
      const error_msg = "Please enter a valid contact number.";
      await logInputValidation(email, req.path, "contact", ValidationRule.InvalidFormatPhone, contact, error_msg);
      res.status(400).send({ error: error_msg });
      return;
    }

    let currentPassword = await User.findOne({ _id: customer_id }, "password");

    let passwordCompare = await bcrypt.compare(
      old_password,
      currentPassword.password
    );
    if (!passwordCompare) {
      await logAuthAttempt(email, Status.Fail, UserType.Customer, req.path, AttemptType.PasswordVerification);
      res.status(403).send({ error: "Current password is incorrect!" });
      return;
    }

    await logAuthAttempt(email, Status.Success, UserType.Customer, req.path, AttemptType.PasswordVerification);

    if (new_password !== "") {
      if (new_password.length < 8) {
        const error_msg = "Password must contain at least 8 characters!";
        await logInputValidation(email, req.path, "new_password", ValidationRule.InvalidLengthMin, new_password, error_msg);
        res.status(403).send({ error: error_msg });
        return;
      }

      let passwordHashed = await bcrypt.hash(new_password, 10);

      await User.updateOne(
        { _id: customer_id },
        {
          firstName: fname,
          lastName: lname,
          email: email,
          contactNumber: contact,
          password: passwordHashed,
        }
      );

      req.session.logged_in = {
        state: true,
        type: "customer",
        user: {
          userID: customer_id,
          firstName: fname,
          lastName: lname,
          contactNumber: contact,
          email: email,
        },
      };

      res.sendStatus(200);
      return;
    }

    await User.updateOne(
      { _id: customer_id },
      {
        firstName: fname,
        lastName: lname,
        email: email,
        contactNumber: contact,
      }
    );

    req.session.logged_in = {
      state: true,
      type: "customer",
      user: {
        userID: customer_id,
        firstName: fname,
        lastName: lname,
        contactNumber: contact,
        email: email,
      },
    };

    res.sendStatus(200);
  },
};

module.exports = controller;
