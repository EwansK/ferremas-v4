// Custom Cypress commands for Ferremas e-commerce testing

// Authentication command
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/auth/login')
    cy.get('[data-testid="email-input"]').type(email)
    cy.get('[data-testid="password-input"]').type(password)
    cy.get('[data-testid="login-button"]').click()
    
    // Wait for successful login
    cy.url().should('not.include', '/auth/login')
    cy.get('[data-testid="user-menu"]').should('be.visible')
  })
})

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/auth/login')
})

// Add product to cart command
Cypress.Commands.add('addToCart', (productId, quantity = 1) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/cart/add`,
    headers: {
      'Authorization': `Bearer ${Cypress.env('authToken')}`
    },
    body: {
      productId,
      quantity
    }
  })
})

// Clear cart command
Cypress.Commands.add('clearCart', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/api/cart/clear`,
    headers: {
      'Authorization': `Bearer ${Cypress.env('authToken')}`
    }
  })
})

// Create test user command
Cypress.Commands.add('createTestUser', (userData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/register`,
    body: userData
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body.data.user
  })
})

// Delete test user command
Cypress.Commands.add('deleteTestUser', (userId) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/api/admin/users/${userId}`,
    headers: {
      'Authorization': `Bearer ${Cypress.env('adminToken')}`
    }
  })
})

// Check API health command
Cypress.Commands.add('checkApiHealth', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/health`,
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.eq(200)
  })
})

// Wait for element to be visible with custom timeout
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible')
})

// Take screenshot with custom name
Cypress.Commands.add('takeScreenshot', (name) => {
  cy.screenshot(name, { capture: 'fullPage' })
})

// Check responsive design
Cypress.Commands.add('checkResponsive', (breakpoints = ['iphone-x', 'ipad-2', 'macbook-15']) => {
  breakpoints.forEach(size => {
    cy.viewport(size)
    cy.wait(500) // Allow time for responsive changes
    cy.takeScreenshot(`responsive-${size}`)
  })
})

// Seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/test/seed`,
    headers: {
      'Authorization': `Bearer ${Cypress.env('adminToken')}`
    }
  })
})

// Clean test data
Cypress.Commands.add('cleanTestData', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/api/test/clean`,
    headers: {
      'Authorization': `Bearer ${Cypress.env('adminToken')}`
    }
  })
})

// Check for console errors
Cypress.Commands.add('checkConsoleErrors', () => {
  cy.window().then((win) => {
    const consoleError = cy.stub(win.console, 'error')
    consoleError.should('not.be.called')
  })
})

// Wait for loading to complete
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading-spinner"]').should('not.exist')
  cy.get('[data-testid="loading-skeleton"]').should('not.exist')
})

// Check accessibility
Cypress.Commands.add('checkA11y', () => {
  // This would require cypress-axe plugin
  // cy.injectAxe()
  // cy.checkA11y()
})

// Simulate slow network
Cypress.Commands.add('simulateSlowNetwork', () => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(res), 2000) // 2 second delay
      })
    })
  })
})

// Mock API responses
Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  }).as('mockedRequest')
})

// Check performance metrics
Cypress.Commands.add('checkPerformance', () => {
  cy.window().then((win) => {
    const navigation = win.performance.getEntriesByType('navigation')[0]
    expect(navigation.loadEventEnd - navigation.loadEventStart).to.be.lessThan(3000)
  })
})

// Type declarations for TypeScript support
declare namespace Cypress {
  interface Chainable {
    login(email: string, password: string): Chainable<void>
    logout(): Chainable<void>
    addToCart(productId: string, quantity?: number): Chainable<void>
    clearCart(): Chainable<void>
    createTestUser(userData: any): Chainable<any>
    deleteTestUser(userId: string): Chainable<void>
    checkApiHealth(): Chainable<void>
    waitForElement(selector: string, timeout?: number): Chainable<void>
    takeScreenshot(name: string): Chainable<void>
    checkResponsive(breakpoints?: string[]): Chainable<void>
    seedTestData(): Chainable<void>
    cleanTestData(): Chainable<void>
    checkConsoleErrors(): Chainable<void>
    waitForLoading(): Chainable<void>
    checkA11y(): Chainable<void>
    simulateSlowNetwork(): Chainable<void>
    mockApiResponse(method: string, url: string, response: any, statusCode?: number): Chainable<void>
    checkPerformance(): Chainable<void>
  }
}