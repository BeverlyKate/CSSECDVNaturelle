const {ObjectId} = require('mongodb');
const Reservation  = require('../models/Reservation');
const controller  = require('../controllers/controller.js');
const Notification  = require('../models/Notification');
const inCartService  = require('../models/InCartService');
const adminController = require('../controllers/admin-controller.js');
const authController = require('../controllers/auth-controller.js');
const employeeController = require('../controllers/employee-controller.js');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const bCrypt = require('bcrypt');

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

//Password Changing for users (negative)
describe("Password Changing for users (negative)", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("postSettings successfully sends a 403 response because customer did not enter correct password", async   () => {
      const req = {
        session: {
          logged_in: {
            user: {
              userID: '5f8614a2f796ac1c7e62af94' 
            },
            type: "customer"
          }
        },
        body:{
          old_password: 'apassword',
          new_password: 'newPassword',
          customer_id: '5f8614a2f796ac1c7e62af94',
          fname: 'Juan',
          lname: 'Carlos',
          email: 'yanyan@gmail.com',
          contact: '09123456789',
        }
      }

      const res = { 
        sendStatus: jest.fn(),
        status: jest.fn(),
        send: jest.fn()
      }

      jest.spyOn(User, 'findOne').mockResolvedValue({_id: req.body.customer_id}, 'password');
      
      bCrypt.compare.mockResolvedValue(false);
      res.status.mockImplementation(() => res);


      await controller.postSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(403);


    });

    it("postAdminSettings successfully sends a 403 response because admin did not enter correct password", async   () => {
    
      const req = {
        session: {
          logged_in: {
            user: {
              username: 'hafaw' 
            },
            type: "admin"
          }
        },
        body:{
          old_password: 'apassword',
          new_password: 'newPassword',
          username :'hafaw'
      }
    }

    const res = {
      sendStatus: jest.fn(),
      status: jest.fn(),
      send: jest.fn()
    }


    jest.spyOn(Admin, 'findOne').mockResolvedValue({_id: req.session.logged_in.user.userID}, 'password');
    bCrypt.compare.mockResolvedValue(false);
    res.status.mockImplementation(() => res);

    await adminController.postAdminSettings(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    
  });

    it("postEmployeeSettings successfully sends a 403 response because employee did not enter correct password", async   () => {
    
      const req = {
        session: {
          logged_in: {
            user: {
              userID: '5f8614a2f796ac1c7e62af94' 
            },
            type: "employee"
          }
        },
        body:{
          current_password: 'apassword',
          new_password: 'newPassword',
          employee_id: '5f8614a2f796ac1c7e62af94',
          fname: 'Juan',
          lname: 'Carlos',
          email: 'yanyan@gmail.com',
          contactNumber: '09123456789',
        }
      }

    const res = {
      sendStatus: jest.fn(),
      status: jest.fn(),
      send: jest.fn()
    }

    jest.spyOn(Employee, 'findOne').mockResolvedValue({_id: req.body.employee_id}, 'password');
    bCrypt.compare.mockResolvedValue(false);
    res.status.mockImplementation(() => res);

    await employeeController.postEmployeeSettings(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

  });
});



