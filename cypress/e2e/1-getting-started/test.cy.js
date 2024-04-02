/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
})
describe('login page test', () => {
  beforeEach(() => {
   
    cy.visit('http://127.0.0.1:3000/')
  })

  it('clicking login button goes to login page', () => {
    
   cy.get('#btn-login').click();
   cy.url().should("eq","http://127.0.0.1:3000/login");
  })

  it('trying to login without username and password shows error', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
    cy.get('#btn-submit').click();
    cy.get('#login-error-msg').should("be.visible");
   })

  

   it('typing a valid email address and password will login a user', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
   // cy.get('#input-email').click();
    cy.get('#input-email').type("gigiuchinaga@email.com");
   // cy.get('#input-password').click();
    cy.get('#input-password').type("test1234");
    cy.get('#btn-submit').click();

    cy.get('#btn-reservation').should("be.visible");
   })

   it('typing an invalid email address and password will login a user', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
   // cy.get('#input-email').click();
    cy.get('#input-email').type("tite@email.com");
   // cy.get('#input-password').click();
    cy.get('#input-password').type("test1234");
    cy.get('#btn-submit').click();
    cy.get('#login-error-msg').should("be.visible");
   })
  
})


describe('reservation tests', () => {
  beforeEach(() => {
   
    cy.visit('http://127.0.0.1:3000/login');
    cy.get('#input-email').type("gigiuchinaga@email.com");
    cy.get('#input-password').type("test1234");
    cy.get('#btn-submit').click();
    cy.get('#btn-reservation').click();

  })

  it('clicking check availability with valid  date will show that the desirable schedule is available ', () => {
    
    cy.get('#input-date').click();
    cy.get('#input-date').type('2024-04-04');
    cy.get('#input-time').select('10:00 AM');
    cy.get('#form-reservation > #last-row > #btn-submit').click();
    cy.get('#reserve-error-msg').should("have.text","The desired schedule is available");
   })

   it('clicking check availability  date date more than two weeks will show that you can only reserve within two weeks or less ', () => {
    
    cy.get('#input-date').click();
    cy.get('#input-date').type('2024-11-11');
    cy.get('#input-time').select('10:00 AM');
    cy.get('#form-reservation > #last-row > #btn-submit').click();
    cy.get('#reserve-error-msg').should("have.text","You can only reserve a date that is within two weeks from now.");
   })

   it('clicking check availability with invalid  date will show that the date is invalid ', () => {
    
    cy.get('#input-date').click();
    cy.get('#input-date').type('2024-01-01');
    cy.get('#input-time').select('10:00 AM');
    cy.get('#form-reservation > #last-row > #btn-submit').click();
    cy.get('#reserve-error-msg').should("have.text","Please pick a valid schedule.");
   })
/*
   it('clicking add to cart will show the service in the cart if the details are valid ', () => {
    
    cy.get('#input-date').click();
    cy.get('#input-date').type('2024-04-04');
    cy.get('#input-time').select('10:00 AM');
    cy.get('#form-reservation > #last-row > #btn-submit').click();

    cy.get('#input-service').select("Full: Soak Off");
    cy.get('#input-staff').select("Juan Dela Cruz");
    cy.get('#form-service > #last-row > #btn-submit').click();
    cy.get('.cart-staff-name').should("be.visible");
   })



   it('clicking x next to the cart item would remove item from cart ', () => {
    
    cy.get('#input-date').click();
    cy.get('#input-date').type('2024-04-04');
    cy.get('#input-time').select('10:00 AM');
    cy.get('#form-reservation > #last-row > #btn-submit').click();

    cy.get('#input-service').select("Full: Soak Off");
    cy.get('#input-staff').select("Juan Dela Cruz");
    cy.get('#form-service > #last-row > #btn-submit').click();
    cy.get('.cart-header > .btn > .fa').click();

    cy.get('#input-staff').should("have.text",'Choose a StaffNo preferencea aJuan Dela CruzAlice BorderlandAlice BorderwaterAlice BorderairHello World Hi WorldDelete meAdd EmployeeBob BuilderDavid Salon');
   })
  

   it('clicking reserve would remove the item from cart and would mark it as reserved ', () => {
    
    cy.get('#input-date').click();
    cy.get('#input-date').type('2024-04-04');
    cy.get('#input-time').select('10:00 AM');
    cy.get('#form-reservation > #last-row > #btn-submit').click();

    cy.get('#input-service').select("Full: Soak Off");
    cy.get('#input-staff').select("Juan Dela Cruz");
    cy.get('#form-service > #last-row > #btn-submit').click();
    cy.get('#btn-reserve').click();
    cy.get('#input-staff').should("have.text",'Choose a StaffNo preferencea aJuan Dela CruzAlice BorderlandAlice BorderwaterAlice BorderairHello World Hi WorldDelete meAdd EmployeeBob BuilderDavid Salon');
   })*/
})







describe('account managements tests', () => {
  beforeEach(() => {
   
    cy.visit('http://127.0.0.1:3000/');
    
  })

  it('test', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
   })

   it('test', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
   })

   it('test', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
   })

   it('test', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
   })
  
})


describe('notification tests', () => {
  beforeEach(() => {
   
    cy.visit('http://127.0.0.1:3000/reservation')
  })
  it('test', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
   })

   it('test', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
   })

   it('test', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
   })

   it('test', () => {
    
    cy.get('#btn-login').click();
    cy.url().should("eq","http://127.0.0.1:3000/login");
   })

  
})