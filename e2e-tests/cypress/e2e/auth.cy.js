describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('User Registration', () => {
    it('should register a new user successfully', () => {
      cy.visit('/auth/register')
      
      // Fill registration form
      cy.get('[data-testid="name-input"]').type('Test User')
      cy.get('[data-testid="lastname-input"]').type('Testing')
      cy.get('[data-testid="email-input"]').type(`test${Date.now()}@example.com`)
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="confirm-password-input"]').type('password123')
      
      // Submit form
      cy.get('[data-testid="register-button"]').click()
      
      // Should redirect to dashboard after successful registration
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="welcome-message"]').should('be.visible')
    })

    it('should show validation errors for invalid data', () => {
      cy.visit('/auth/register')
      
      // Submit empty form
      cy.get('[data-testid="register-button"]').click()
      
      // Check for validation errors
      cy.get('[data-testid="name-error"]').should('contain', 'El nombre es requerido')
      cy.get('[data-testid="email-error"]').should('contain', 'El email es requerido')
      cy.get('[data-testid="password-error"]').should('contain', 'La contraseña es requerida')
    })

    it('should reject invalid email format', () => {
      cy.visit('/auth/register')
      
      cy.get('[data-testid="email-input"]').type('invalid-email')
      cy.get('[data-testid="register-button"]').click()
      
      cy.get('[data-testid="email-error"]').should('contain', 'Email inválido')
    })

    it('should reject password mismatch', () => {
      cy.visit('/auth/register')
      
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="confirm-password-input"]').type('differentpassword')
      cy.get('[data-testid="register-button"]').click()
      
      cy.get('[data-testid="confirm-password-error"]').should('contain', 'Las contraseñas no coinciden')
    })
  })

  describe('User Login', () => {
    it('should login with valid credentials', () => {
      cy.visit('/auth/login')
      
      // Use existing test user
      cy.get('[data-testid="email-input"]').type('admin@ferremas.cl')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Should redirect based on user role
      cy.url().should('include', '/admin')
      cy.get('[data-testid="user-menu"]').should('contain', 'Admin')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/auth/login')
      
      cy.get('[data-testid="email-input"]').type('invalid@example.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      cy.get('[data-testid="login-button"]').click()
      
      cy.get('[data-testid="error-message"]').should('contain', 'Credenciales inválidas')
    })

    it('should handle inactive user account', () => {
      cy.visit('/auth/login')
      
      // Assuming there's an inactive test user
      cy.get('[data-testid="email-input"]').type('inactive@ferremas.cl')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      cy.get('[data-testid="error-message"]').should('contain', 'Cuenta inactiva')
    })
  })

  describe('User Logout', () => {
    it('should logout successfully', () => {
      // Login first
      cy.login('admin@ferremas.cl', 'password123')
      
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      // Should redirect to login page
      cy.url().should('include', '/auth/login')
      cy.get('[data-testid="login-form"]').should('be.visible')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.visit('/admin/users')
      
      cy.url().should('include', '/auth/login')
    })

    it('should allow authenticated users to access protected routes', () => {
      cy.login('admin@ferremas.cl', 'password123')
      
      cy.visit('/admin/users')
      cy.url().should('include', '/admin/users')
      cy.get('[data-testid="users-table"]').should('be.visible')
    })

    it('should enforce role-based access control', () => {
      cy.login('cliente1@gmail.com', 'password123')
      
      cy.visit('/admin/users')
      
      // Should redirect or show access denied
      cy.get('[data-testid="access-denied"]').should('be.visible')
      .or(() => {
        cy.url().should('not.include', '/admin/users')
      })
    })
  })

  describe('Session Management', () => {
    it('should maintain session across page refreshes', () => {
      cy.login('admin@ferremas.cl', 'password123')
      
      cy.reload()
      
      // Should still be logged in
      cy.get('[data-testid="user-menu"]').should('contain', 'Admin')
    })

    it('should handle token expiration gracefully', () => {
      cy.login('admin@ferremas.cl', 'password123')
      
      // Simulate token expiration by clearing cookies
      cy.clearCookies()
      
      cy.visit('/admin/users')
      
      // Should redirect to login
      cy.url().should('include', '/auth/login')
    })
  })
})