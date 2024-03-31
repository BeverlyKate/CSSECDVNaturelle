const {ObjectId} = require('mongodb');
const Reservation  = require('../models/Reservation');
const controller  = require('../controllers/controller.js');
const Notification  = require('../models/Notification');
const inCartService  = require('../models/InCartService');
const adminController = require('../controllers/admin-controller.js');
const authController = require('../controllers/auth-controller.js');
const employeeController = require('../controllers/employee-controller.js');
const User = require('../models/User');

/* ACCOUNT MANAGEMENT TEST SUITE */

//Mock related functions in User model and bcrypt 
jest.mock('../models/User',() => ({
    updateOne: jest.fn().mockResolvedValue({nModified: 1}),
    findOne: jest.fn().mockResolvedValue('mock user'),
    create: jest.fn().mockResolvedValue('mock user')
}));
  
jest.mock('bcrypt',() => ({
    compare: jest.fn().mockResolvedValue(true),
    hash: jest.fn().mockResolvedValue('hashedPassword')
}));

//Login Functionality
describe("ACCOUNT MANAGEMENT TEST SUITE\nLogin Functionality", () => {
    afterEach(() => {
      jest.clearAllMocks();
   });
    it("postLogin successfully logs user in and redirects to home", async   () => {
      const req = {
        body: {
          email: 'testEmail@gmail.com',
          password: 'password'
        },
        session: {
          logged_in: null
        },
        query: {
          next: "/"
        }
      };
  
      const res = { 
        redirect: jest.fn()
      };
  
  
      await authController.postLogin(req, res);
      expect(res.redirect).toHaveBeenCalledWith("/");
      expect(req.session.logged_in).not.toBe(null);
      expect(req.session.logged_in.user).not.toBe(null);
    });
    
    //Negative test case: User not found
    it("postLogin succesfully prevents user from logging in or redirecting to home", async   () => {
      const req = {
        body: {
          email: 'testEmail@gmail.com',
          password: 'password'
        },
        session: {
          logged_in: null
        },
        query: {
          next: "/"
        }
      };
  
      const res = {
        redirect: jest.fn(),
        render: jest.fn()
      };
  
      //mock the findOne function to return null
      User.findOne.mockImplementation(() => null);
  
      await authController.postLogin(req, res);
      expect(res.redirect).not.toHaveBeenCalledWith("/");
      expect(req.session.logged_in).toBe(null);
  
  
    });
  });

  //Password Changing