describe('Admin Panel', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.login('admin@ferremas.cl', 'password123')
  })

  describe('User Management', () => {
    it('should display users list', () => {
      cy.visit('/admin/users')
      
      cy.get('[data-testid="users-table"]').should('be.visible')
      cy.get('[data-testid="user-row"]').should('have.length.greaterThan', 0)
      
      // Check table headers
      cy.get('[data-testid="users-table"]').within(() => {
        cy.contains('Usuario').should('be.visible')
        cy.contains('Rol').should('be.visible')
        cy.contains('Estado').should('be.visible')
        cy.contains('Acciones').should('be.visible')
      })
    })

    it('should search users', () => {
      cy.visit('/admin/users')
      
      cy.get('[data-testid="user-search"]').type('admin')
      
      cy.get('[data-testid="user-row"]').should('have.length.greaterThan', 0)
      cy.get('[data-testid="user-email"]').first().should('contain', 'admin')
    })

    it('should filter users by role', () => {
      cy.visit('/admin/users')
      
      cy.get('[data-testid="role-filter"]').select('admin')
      
      cy.get('[data-testid="user-row"]').each(($row) => {
        cy.wrap($row).find('[data-testid="user-role"]').should('contain', 'Administrador')
      })
    })

    it('should edit user information', () => {
      cy.visit('/admin/users')
      
      cy.get('[data-testid="edit-user-button"]').first().click()
      
      cy.get('[data-testid="user-edit-modal"]').should('be.visible')
      
      // Edit user details
      cy.get('[data-testid="user-name-input"]').clear().type('Updated Name')
      cy.get('[data-testid="user-lastname-input"]').clear().type('Updated Lastname')
      cy.get('[data-testid="user-role-select"]').select('manager')
      
      cy.get('[data-testid="save-user-button"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Usuario actualizado')
      cy.get('[data-testid="user-edit-modal"]').should('not.exist')
    })

    it('should validate user edit form', () => {
      cy.visit('/admin/users')
      
      cy.get('[data-testid="edit-user-button"]').first().click()
      
      // Clear required fields
      cy.get('[data-testid="user-name-input"]').clear()
      cy.get('[data-testid="user-email-input"]').clear()
      
      cy.get('[data-testid="save-user-button"]').click()
      
      cy.get('[data-testid="name-error"]').should('contain', 'El nombre es requerido')
      cy.get('[data-testid="email-error"]').should('contain', 'El email es requerido')
    })

    it('should activate/deactivate users', () => {
      cy.visit('/admin/users')
      
      // Find an active user and deactivate
      cy.get('[data-testid="user-row"]').contains('Activo').parents('[data-testid="user-row"]').within(() => {
        cy.get('[data-testid="toggle-status-button"]').click()
      })
      
      cy.get('[data-testid="confirm-deactivate"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Usuario desactivado')
    })

    it('should handle pagination', () => {
      cy.visit('/admin/users')
      
      // If there are multiple pages
      cy.get('[data-testid="pagination"]').then(($pagination) => {
        if ($pagination.find('[data-testid="next-page"]').length > 0) {
          cy.get('[data-testid="next-page"]').click()
          cy.url().should('include', 'page=2')
          
          cy.get('[data-testid="prev-page"]').click()
          cy.url().should('include', 'page=1')
        }
      })
    })
  })

  describe('System Statistics', () => {
    it('should display dashboard statistics', () => {
      cy.visit('/admin')
      
      cy.get('[data-testid="stats-cards"]').should('be.visible')
      cy.get('[data-testid="total-users-stat"]').should('be.visible')
      cy.get('[data-testid="total-orders-stat"]').should('be.visible')
      cy.get('[data-testid="total-revenue-stat"]').should('be.visible')
      cy.get('[data-testid="total-products-stat"]').should('be.visible')
    })

    it('should display charts and graphs', () => {
      cy.visit('/admin')
      
      cy.get('[data-testid="sales-chart"]').should('be.visible')
      cy.get('[data-testid="user-growth-chart"]').should('be.visible')
    })
  })

  describe('Admin Settings', () => {
    it('should allow admin to update site settings', () => {
      cy.visit('/admin/settings')
      
      cy.get('[data-testid="site-name-input"]').clear().type('Ferremas Updated')
      cy.get('[data-testid="save-settings-button"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Configuración guardada')
    })

    it('should manage system announcements', () => {
      cy.visit('/admin/announcements')
      
      cy.get('[data-testid="new-announcement-button"]').click()
      
      cy.get('[data-testid="announcement-title"]').type('Mantenimiento Programado')
      cy.get('[data-testid="announcement-message"]').type('El sistema estará en mantenimiento el próximo sábado.')
      cy.get('[data-testid="announcement-type"]').select('warning')
      
      cy.get('[data-testid="save-announcement-button"]').click()
      
      cy.get('[data-testid="announcement-list"]').should('contain', 'Mantenimiento Programado')
    })
  })

  describe('Activity Logs', () => {
    it('should display activity logs', () => {
      cy.visit('/admin/logs')
      
      cy.get('[data-testid="activity-logs"]').should('be.visible')
      cy.get('[data-testid="log-entry"]').should('have.length.greaterThan', 0)
      
      cy.get('[data-testid="log-entry"]').first().within(() => {
        cy.get('[data-testid="log-timestamp"]').should('be.visible')
        cy.get('[data-testid="log-user"]').should('be.visible')
        cy.get('[data-testid="log-action"]').should('be.visible')
      })
    })

    it('should filter logs by date', () => {
      cy.visit('/admin/logs')
      
      const today = new Date().toISOString().split('T')[0]
      cy.get('[data-testid="log-date-filter"]').type(today)
      
      cy.get('[data-testid="log-entry"]').should('have.length.greaterThan', 0)
    })

    it('should filter logs by action type', () => {
      cy.visit('/admin/logs')
      
      cy.get('[data-testid="log-action-filter"]').select('login')
      
      cy.get('[data-testid="log-entry"]').each(($log) => {
        cy.wrap($log).find('[data-testid="log-action"]').should('contain', 'login')
      })
    })
  })

  describe('Bulk Operations', () => {
    it('should select multiple users for bulk operations', () => {
      cy.visit('/admin/users')
      
      // Select multiple users
      cy.get('[data-testid="user-checkbox"]').eq(0).check()
      cy.get('[data-testid="user-checkbox"]').eq(1).check()
      
      cy.get('[data-testid="bulk-actions"]').should('be.visible')
      cy.get('[data-testid="selected-count"]').should('contain', '2')
    })

    it('should perform bulk status updates', () => {
      cy.visit('/admin/users')
      
      // Select users
      cy.get('[data-testid="user-checkbox"]').eq(0).check()
      cy.get('[data-testid="user-checkbox"]').eq(1).check()
      
      // Perform bulk action
      cy.get('[data-testid="bulk-action-select"]').select('deactivate')
      cy.get('[data-testid="apply-bulk-action"]').click()
      
      cy.get('[data-testid="confirm-bulk-action"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Usuarios actualizados')
    })
  })

  describe('Data Export', () => {
    it('should export user data', () => {
      cy.visit('/admin/users')
      
      cy.get('[data-testid="export-users-button"]').click()
      cy.get('[data-testid="export-format"]').select('csv')
      cy.get('[data-testid="confirm-export"]').click()
      
      // Verify download (this might need adjustment based on your download handling)
      cy.get('[data-testid="download-link"]').should('be.visible')
    })

    it('should export system reports', () => {
      cy.visit('/admin/reports')
      
      cy.get('[data-testid="generate-report-button"]').click()
      cy.get('[data-testid="report-type"]').select('sales')
      cy.get('[data-testid="date-range-start"]').type('2023-01-01')
      cy.get('[data-testid="date-range-end"]').type('2023-12-31')
      
      cy.get('[data-testid="generate-button"]').click()
      
      cy.get('[data-testid="report-results"]').should('be.visible')
    })
  })

  describe('Security Features', () => {
    it('should enforce session timeout', () => {
      cy.visit('/admin/users')
      
      // Simulate session timeout by waiting or manipulating cookies
      cy.wait(60000) // Wait for potential timeout (adjust based on your settings)
      
      cy.get('[data-testid="users-table"]').should('not.exist')
      cy.url().should('include', '/auth/login')
    })

    it('should log admin actions', () => {
      cy.visit('/admin/users')
      
      // Perform an action
      cy.get('[data-testid="edit-user-button"]').first().click()
      cy.get('[data-testid="user-name-input"]').clear().type('Logged Action')
      cy.get('[data-testid="save-user-button"]').click()
      
      // Check if action was logged
      cy.visit('/admin/logs')
      cy.get('[data-testid="log-entry"]').first().should('contain', 'update_user')
    })

    it('should handle unauthorized access attempts', () => {
      // Logout and try to access admin panel directly
      cy.logout()
      cy.visit('/admin/users')
      
      cy.url().should('include', '/auth/login')
      cy.get('[data-testid="error-message"]').should('contain', 'acceso restringido')
    })
  })
})