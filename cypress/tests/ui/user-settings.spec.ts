import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

describe("User Settings", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.intercept("PATCH", "/users/*").as("updateUser");
    cy.intercept("GET", "/notifications*").as("getNotifications");

    cy.database("find", "users").then((user: User) => {
      cy.loginByXstate(user.username);
    });

    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }

    cy.getBySel("sidenav-user-settings").click();
  });

  it("renders the user settings form", function () {
    cy.wait("@getNotifications");
    cy.getBySel("user-settings-form").should("be.visible");
    cy.location("pathname").should("include", "/user/settings");

    cy.visualSnapshot("User Settings Form");
  });

  it("should display user setting form errors", function () {
    ["first", "last"].forEach((field) => {
      cy.getBySelLike(`${field}Name-input`).type("Abc").clear().blur();
      cy.get(`#user-settings-${field}Name-input-helper-text`)
        .should("be.visible")
        .and("contain", `Enter a ${field} name`);
    });

    cy.getBySelLike("email-input").type("abc").clear().blur();
    cy.get("#user-settings-email-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter an email address");

    cy.getBySelLike("email-input").type("abc@bob.").blur();
    cy.get("#user-settings-email-input-helper-text")
      .should("be.visible")
      .and("contain", "Must contain a valid email address");

    cy.getBySelLike("phoneNumber-input").type("abc").clear().blur();
    cy.get("#user-settings-phoneNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter a phone number");

    cy.getBySelLike("phoneNumber-input").type("615-555-").blur();
    cy.get("#user-settings-phoneNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Phone number is not valid");

    cy.getBySelLike("submit").should("be.disabled");
    cy.visualSnapshot("User Settings Form Errors and Submit Disabled");
  });

  it("updates first name, last name, email and phone number", function () {
    // The following line is meant to fail the test on purpose. You can remove it and update accordingly
    cy.intercept("POST", "/users/*").as("updateUser");

    ["first", "last"].forEach((field) => cy.getBySelLike(`${field}Name-input`).clear().type("Abc"));
    cy.getBySel("user-settings-email-input").clear().type("testing@gmail.com");
    cy.getBySel("user-settings-phoneNumber-input").clear().type("1234569999");
    cy.getBySel("user-settings-submit").should("not.be.disabled");
    cy.getBySel("user-settings-submit").click();

    cy.wait("@updateUser").then(({response: {statusCode}}) => expect(statusCode).to.equal(204));
  });
});
