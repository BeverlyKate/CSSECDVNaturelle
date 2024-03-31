const {ObjectId} = require('mongodb');
const Reservation  = require('../models/Reservation');
const controller  = require('../controllers/controller.js');
const Notification  = require('../models/Notification');
const inCartService  = require('../models/InCartService');
const adminController = require('../controllers/admin-controller.js');
const authController = require('../controllers/auth-controller.js');
const employeeController = require('../controllers/employee-controller.js');
const User = require('../models/User');

/* NOTIFICATIONS TEST SUITE */

// Mock related functions in Notification

jest.mock('../models/Notification',() => ({
    updateOne: jest.fn().mockResolvedValue({nModified: 1}),
    create: jest.fn().mockResolvedValue({}),
    findOne: jest.fn().mockResolvedValue('mock notification'),
    find: jest.fn().mockReturnValue(['mock notification 1', 'mock notification 2', 'mock notification 3'])
}));

// Finding a notification
describe("NOTIFICATIONS TEST SUITE\nFinding a notification", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("findNotification successfully retrieves notifications based on query id and updates it to 'read'", async   () => {
      const req = {
        query: {
          id: '614cb3fbb49ae3f9602cb5bc'
        }
      };
      
      const res = { 
        send: jest.fn()
      };
  
      await controller.findNotification(req, res);
      expect(Notification.findOne).toHaveBeenCalledWith({_id: req.query.id});
      expect(Notification.updateOne).toHaveBeenCalledWith({_id: req.query.id}, {isRead: "true"});
      expect(res.send).toHaveBeenCalledWith({notif_details:'mock notification'});
  
     });
  
});
  
  
// Getting all notifications
describe("Retrieving all notifications of customer", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("should get all notifications", async   () => {
      //creation of a mock user session
      const req = {
        session: {
          logged_in: {
            user: {
              userID: '5f8614a2f796ac1c7e62af94' // random id
            },
            type: "customer"
          }
        }
      };
      
      const res = { 
        send: jest.fn()
      };
  
      await controller.getNotifications(req, res);
      expect(Notification.find).toHaveBeenCalledWith({receiver: req.session.logged_in.user.userID});
      expect(res.send).toHaveBeenCalledWith(['mock notification 3', 'mock notification 2', 'mock notification 1']);
  
     });

    //Negative test case: no user session
    it("findNotification successfully redirects to login (no user session)", async   () => {
        const req = {
          session: {
            logged_in: null
          }
        };
        
        const res = { 
          redirect: jest.fn()
        };
    
        await controller.getNotifications(req, res);
        expect(res.redirect).toHaveBeenCalledWith("/login?next=" + encodeURIComponent("/reservation"));
    
    });

    //Negative test case: not a customer
    it("findNotification successfully redirects to login (not a customer)", async   () => {
        const req = {
          session: {
            logged_in: {
              type: "employee"
            }
          }
        };
        
        const res = { 
          redirect: jest.fn()
        };
    
        await controller.getNotifications(req, res);
        expect(res.redirect).toHaveBeenCalledWith("/login?next=" + encodeURIComponent("/reservation"));
    
       });
  
  });
  

  