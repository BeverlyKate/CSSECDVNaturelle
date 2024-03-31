const {ObjectId} = require('mongodb');
const Reservation  = require('../models/Reservation');
const controller  = require('../controllers/controller.js');
const Notification  = require('../models/Notification');
const inCartService  = require('../models/InCartService');
const adminController = require('../controllers/admin-controller.js');
const authController = require('../controllers/auth-controller.js');
const employeeController = require('../controllers/employee-controller.js');
const User = require('../models/User');

/* RESERVATIONS TEST SUITE */

// Mock related functions in Reservation, InCartService, and Notification
jest.mock('../models/Reservation',() => ({
    updateOne: jest.fn().mockResolvedValue({nModified: 1}),
    create: jest.fn().mockResolvedValue('mock reservation'),
    findOne: jest.fn().mockResolvedValue('mock reservation value'),
    find: jest.fn().mockResolvedValue('mock reservation values'),
    filter: jest.fn().mockResolvedValue('mock reservation values')
}));
  
jest.mock('../models/InCartService',() => ({
    updateOne: jest.fn().mockResolvedValue({nModified: 1}),
    create: jest.fn().mockResolvedValue('mock inCartService'),
    findOne: jest.fn().mockResolvedValue('mock inCartService value')
}));

jest.mock('../models/Notification',() => ({
    updateOne: jest.fn().mockResolvedValue({nModified: 1}),
    create: jest.fn().mockResolvedValue({}),
    findOne: jest.fn().mockResolvedValue('mock notification'),
    find: jest.fn().mockReturnValue(['mock notification 1', 'mock notification 2', 'mock notification 3'])
}));


//Creating reservations
describe("RESERVATIONS TEST SUITE\nCreating reservations", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("postReserve successfully creates a reservation", async   () => {
      const req = {
        body: {
          services: [
            {
              serviceTitle: "Haircut",
              preferredEmployee: "Juan",
              details: "None"
            }
          ],
          date: "2025-01-01"
        },
        session: {
          logged_in: {
            user: {
              userID: '5f8614a2f796ac1c7e62af94' // random id
            }
          }
        }
      };
  
      const res = {
        redirect: jest.fn()
      };
  
      await authController.postReserve(req, res);
      expect(Reservation.create).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith("/reserve");
  
  
    });
});


//Canceling a reservation
describe("Canceling a reservation", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("postCancelReservation successfully changes reservation's status to 'Cancelled'", async   () => {
  
      const req = {
        body: {
          reservation_id: '614cb3fbb49ae3f9602cb5bc' // random id
        },
        session: {
          logged_in: {
            user: {
              userID: '5f8614a2f796ac1c7e62af94' // random id
            }
          }
        }
      };
      
      const res = { 
        sendStatus: jest.fn()
      };
  
      await controller.postCancelReservation(req, res);
      expect(Reservation.updateOne).toHaveBeenCalledWith({_id: req.body.reservation_id}, {status: "Cancelled"});
      expect(res.sendStatus).toHaveBeenCalledWith(200);
  
     });
  
});
  
//Update reservation status
describe("Update reservation status", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("postUpdateReservationStatus successfully changes a reservation status to 'Cancelled' with a 200 response ", async   () => {
      const req = {
        session: {
          logged_in: {
            user: {
              userID: '5f8614a2f796ac1c7e62af94' 
            },
            type: "admin"
          },
        },
        body: {
          reservation_id: '614cb3fbb49ae3f9602cb5bc', 
          reservation_status: "Cancelled"
          
        }
        
      };
      
      const res = { 
        sendStatus: jest.fn()
      };
  
      await adminController.postUpdateReservationStatus(req, res);
      expect(res.sendStatus).toHaveBeenCalledWith(200);
  
     });
     
    it("postUpdateReservationStatus successfully prevents any changes from happening and returns a 403", async   () => {
        const req = {
          session: {
            logged_in: {
              user: {
                userID: '5f8614a2f796ac1c7e62af94' 
              },
              type: "customer"
            },
          },
          body: {
            reservation_id: '614cb3fbb49ae3f9602cb5bc', 
            reservation_status: "Pending"
          }
        };
        
        const res = { 
          status: jest.fn()
        };
    
        await adminController.postUpdateReservationStatus(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
    
    });
});
  
//Retrieving services in reservations
describe("Retrieving services in reservations", () => {
    afterEach(() => {
      jest.clearAllMocks();
   });
    it("getServicesOfReservation successfully finds matching services based on reservation id", async   () => {
  
  
      const mockReservation = {
        _id: '614cb3fbb49ae3f9602cb5bc',
        services: [
          {
            serviceTitle: "Haircut",
            preferredEmployee: "Juan",
            details: "None"
          }
        ]
      };
      const req = {
        query: {
          reservation_id: '614cb3fbb49ae3f9602cb5bc' // random id
        }  
      };
  
      
      jest.spyOn(Reservation, 'findOne').mockReturnThis().mockReturnValue({
        
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockReservation),
        });
  
      const res = { 
        send: jest.fn()
      };
  
      await adminController.getServicesOfReservation(req, res);
      expect(Reservation.findOne).toHaveBeenCalledWith({_id: req.query.reservation_id},'services');
      expect(res.send).toHaveBeenCalledWith(mockReservation);
  
     });
  
  });
  

  
//Update Salon Service Status
describe("Update Salon Service Status", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("postUpdateServiceStatus successfully updates with the given status in the request and returns 200", async   () => {
      const req = {
        body: {
          service_id: '614cb3fbb49ae3f9602cb5bc', 
          service_status: "Cancelled"
        }
      };
      
      const res = { 
        sendStatus: jest.fn()
      };
  
      await employeeController.postUpdateServiceStatus(req, res);
      expect(inCartService.updateOne).toHaveBeenCalled();
      expect(res.sendStatus).toHaveBeenCalledWith(200);
  
     });
  
});
  
//Retrieve reservations relevant to an employee
describe("Retrieve reservations relevant to an employee", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("getEmployeeReservations successfully finds reservation based on id", async () => {
       const req = {
         session: {
           logged_in: {
             user: {
               userID: '5f8614a2f796ac1c7e62af94' // random id
             },
             type: "employee"
           }
         },
         query: {
           id: '5f8614a2f796ac1c7e62af94'
         }
       };
   
       const res = {
         send: jest.fn(),
         sendStatus: jest.fn()
       };
   
       
       jest.spyOn(Reservation, 'find').mockReturnThis().mockReturnValue({
  
           populate: jest.fn().mockReturnThis(),
           exec: jest.fn().mockResolvedValue([
             {
               services: [{ employeeID: new ObjectId('5f8614a2f796ac1c7e62af94') }],
               userID: { firstName: 'Juan', lastName: 'Carlos' }
             }
           ]),
         });
   
       await employeeController.getEmployeeReservations(req, res);
       expect(res.sendStatus).not.toHaveBeenCalled();
       expect(res.send).toHaveBeenCalledWith([
         {
           services: [{ employeeID: new ObjectId('5f8614a2f796ac1c7e62af94') }],
           userID: { firstName: 'Juan', lastName: 'Carlos' }
         }
       ]);
    });
   
    // Negative case: Not an employee
    it("getEmployeeReservation successfully returns a 403", async () => {
       const req = {
         session: {
           logged_in: {
             user: {
               userID: '5f8614a2f796ac1c7e62af94' // random id
             },
             type: "user" 
           }
         },
         query: {
           id: '5f8614a2f796ac1c7e62af94'
         }
       };
   
       const res = {
         send: jest.fn(),
         sendStatus: jest.fn()
       };
   
       await employeeController.getEmployeeReservations(req, res);
       expect(res.sendStatus).toHaveBeenCalledWith(403);
       expect(res.send).not.toHaveBeenCalled();
    });
});
  