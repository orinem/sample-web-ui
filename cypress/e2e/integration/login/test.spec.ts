/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { urlFixtures } from 'cypress/e2e/fixtures/formEntry/urls'

// Tests the login page with a multitude of fake accounts in
// different combinations of invalid login info.
// Also tests things like canceling a login and logging out after the login

// ---------------------------- Test section ----------------------------
const baseUrl: string = Cypress.env('BASEURL')

describe('Load Site', () => {
  it('loads the login page properly', () => {
    // Make sure the test always starts at the login page
    // and is never able to autologin
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })

    // Go to base site
    cy.visit(baseUrl)

    // Make sure the login page was hit
    cy.url().should('eq', baseUrl + urlFixtures.page.login)
  })
})

describe('Test login page', () => {
  it('logs in', () => {
    cy.myIntercept('POST', 'authorize', {
      statusCode: httpCodes.SUCCESS,
      body: { token: '' }
    }).as('login-request')

    // Login
    cy.login(Cypress.env('MPS_USERNAME'), Cypress.env('MPS_PASSWORD'))
  })
})
