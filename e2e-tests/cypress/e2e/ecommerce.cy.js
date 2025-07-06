describe('E-commerce Flow', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Product Browsing', () => {
    it('should display products on homepage', () => {
      cy.visit('/')
      
      cy.get('[data-testid="product-grid"]').should('be.visible')
      cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0)
      
      // Check product card elements
      cy.get('[data-testid="product-card"]').first().within(() => {
        cy.get('[data-testid="product-name"]').should('be.visible')
        cy.get('[data-testid="product-price"]').should('be.visible')
        cy.get('[data-testid="product-image"]').should('be.visible')
      })
    })

    it('should search products by name', () => {
      cy.visit('/')
      
      cy.get('[data-testid="search-input"]').type('martillo')
      cy.get('[data-testid="search-button"]').click()
      
      cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0)
      cy.get('[data-testid="product-name"]').first().should('contain.text', 'Martillo')
    })

    it('should filter products by category', () => {
      cy.visit('/')
      
      cy.get('[data-testid="category-filter"]').select('Herramientas Manuales')
      
      cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0)
      cy.get('[data-testid="product-category"]').each(($el) => {
        cy.wrap($el).should('contain.text', 'Herramientas')
      })
    })

    it('should sort products by price', () => {
      cy.visit('/')
      
      cy.get('[data-testid="sort-select"]').select('Precio: Mayor a menor')
      
      cy.get('[data-testid="product-price"]').then(($prices) => {
        const prices = [...$prices].map(el => 
          parseInt(el.textContent.replace(/[^0-9]/g, ''))
        )
        
        // Check if prices are in descending order
        for (let i = 0; i < prices.length - 1; i++) {
          expect(prices[i]).to.be.gte(prices[i + 1])
        }
      })
    })

    it('should show product details when clicked', () => {
      cy.visit('/')
      
      cy.get('[data-testid="product-card"]').first().click()
      
      cy.url().should('include', '/products/')
      cy.get('[data-testid="product-details"]').should('be.visible')
      cy.get('[data-testid="product-description"]').should('be.visible')
      cy.get('[data-testid="add-to-cart-button"]').should('be.visible')
    })
  })

  describe('Shopping Cart', () => {
    beforeEach(() => {
      // Login as customer for cart operations
      cy.login('cliente1@gmail.com', 'password123')
    })

    it('should add product to cart', () => {
      cy.visit('/')
      
      cy.get('[data-testid="product-card"]').first().within(() => {
        cy.get('[data-testid="add-to-cart-button"]').click()
      })
      
      cy.get('[data-testid="cart-notification"]').should('contain', 'Producto agregado al carrito')
      cy.get('[data-testid="cart-counter"]').should('contain', '1')
    })

    it('should update cart quantity', () => {
      cy.visit('/')
      
      // Add product to cart
      cy.get('[data-testid="product-card"]').first().within(() => {
        cy.get('[data-testid="add-to-cart-button"]').click()
      })
      
      // Go to cart
      cy.get('[data-testid="cart-icon"]').click()
      
      // Update quantity
      cy.get('[data-testid="quantity-input"]').first().clear().type('3')
      cy.get('[data-testid="update-quantity-button"]').first().click()
      
      cy.get('[data-testid="cart-total"]').should('be.visible')
      cy.get('[data-testid="cart-counter"]').should('contain', '3')
    })

    it('should remove product from cart', () => {
      cy.visit('/')
      
      // Add product to cart
      cy.get('[data-testid="product-card"]').first().within(() => {
        cy.get('[data-testid="add-to-cart-button"]').click()
      })
      
      // Go to cart
      cy.get('[data-testid="cart-icon"]').click()
      
      // Remove product
      cy.get('[data-testid="remove-item-button"]').first().click()
      cy.get('[data-testid="confirm-remove-button"]').click()
      
      cy.get('[data-testid="empty-cart-message"]').should('be.visible')
      cy.get('[data-testid="cart-counter"]').should('contain', '0')
    })

    it('should calculate cart total correctly', () => {
      cy.visit('/')
      
      // Add multiple products
      cy.get('[data-testid="product-card"]').eq(0).within(() => {
        cy.get('[data-testid="product-price"]').invoke('text').as('price1')
        cy.get('[data-testid="add-to-cart-button"]').click()
      })
      
      cy.get('[data-testid="product-card"]').eq(1).within(() => {
        cy.get('[data-testid="product-price"]').invoke('text').as('price2')
        cy.get('[data-testid="add-to-cart-button"]').click()
      })
      
      // Go to cart and verify total
      cy.get('[data-testid="cart-icon"]').click()
      
      cy.get('@price1').then((price1) => {
        cy.get('@price2').then((price2) => {
          const total = parseInt(price1.replace(/[^0-9]/g, '')) + 
                       parseInt(price2.replace(/[^0-9]/g, ''))
          
          cy.get('[data-testid="cart-total"]').should('contain', total.toLocaleString())
        })
      })
    })
  })

  describe('Checkout Process', () => {
    beforeEach(() => {
      cy.login('cliente1@gmail.com', 'password123')
      
      // Add product to cart
      cy.visit('/')
      cy.get('[data-testid="product-card"]').first().within(() => {
        cy.get('[data-testid="add-to-cart-button"]').click()
      })
    })

    it('should proceed to checkout', () => {
      cy.get('[data-testid="cart-icon"]').click()
      cy.get('[data-testid="checkout-button"]').click()
      
      cy.url().should('include', '/checkout')
      cy.get('[data-testid="checkout-form"]').should('be.visible')
    })

    it('should validate shipping information', () => {
      cy.get('[data-testid="cart-icon"]').click()
      cy.get('[data-testid="checkout-button"]').click()
      
      // Submit without filling required fields
      cy.get('[data-testid="place-order-button"]').click()
      
      cy.get('[data-testid="address-error"]').should('be.visible')
      cy.get('[data-testid="phone-error"]').should('be.visible')
    })

    it('should complete order successfully', () => {
      cy.get('[data-testid="cart-icon"]').click()
      cy.get('[data-testid="checkout-button"]').click()
      
      // Fill shipping information
      cy.get('[data-testid="address-input"]').type('Av. Providencia 123, Santiago')
      cy.get('[data-testid="phone-input"]').type('+56912345678')
      
      // Select payment method
      cy.get('[data-testid="payment-method"]').select('credit-card')
      
      // Place order
      cy.get('[data-testid="place-order-button"]').click()
      
      cy.url().should('include', '/order-confirmation')
      cy.get('[data-testid="order-success"]').should('contain', 'Pedido realizado exitosamente')
      cy.get('[data-testid="order-number"]').should('be.visible')
    })
  })

  describe('Order History', () => {
    beforeEach(() => {
      cy.login('cliente1@gmail.com', 'password123')
    })

    it('should display order history', () => {
      cy.visit('/orders')
      
      cy.get('[data-testid="orders-list"]').should('be.visible')
      cy.get('[data-testid="order-item"]').should('have.length.greaterThan', 0)
    })

    it('should show order details', () => {
      cy.visit('/orders')
      
      cy.get('[data-testid="order-item"]').first().click()
      
      cy.get('[data-testid="order-details"]').should('be.visible')
      cy.get('[data-testid="order-status"]').should('be.visible')
      cy.get('[data-testid="order-items"]').should('be.visible')
      cy.get('[data-testid="order-total"]').should('be.visible')
    })
  })

  describe('Product Reviews', () => {
    beforeEach(() => {
      cy.login('cliente1@gmail.com', 'password123')
    })

    it('should allow customers to leave reviews', () => {
      cy.visit('/products/850e8400-e29b-41d4-a716-446655440001')
      
      cy.get('[data-testid="write-review-button"]').click()
      
      cy.get('[data-testid="review-rating"]').click() // 5-star rating
      cy.get('[data-testid="review-text"]').type('Excelente producto, muy buena calidad.')
      cy.get('[data-testid="submit-review-button"]').click()
      
      cy.get('[data-testid="review-success"]').should('contain', 'Reseña publicada')
    })

    it('should display product reviews', () => {
      cy.visit('/products/850e8400-e29b-41d4-a716-446655440001')
      
      cy.get('[data-testid="reviews-section"]').should('be.visible')
      cy.get('[data-testid="review-item"]').should('have.length.greaterThan', 0)
      
      cy.get('[data-testid="review-item"]').first().within(() => {
        cy.get('[data-testid="review-rating"]').should('be.visible')
        cy.get('[data-testid="review-text"]').should('be.visible')
        cy.get('[data-testid="review-author"]').should('be.visible')
      })
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x')
      cy.visit('/')
      
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
      cy.get('[data-testid="product-grid"]').should('be.visible')
      
      // Test mobile navigation
      cy.get('[data-testid="mobile-menu-button"]').click()
      cy.get('[data-testid="mobile-menu"]').should('be.visible')
    })

    it('should work on tablets', () => {
      cy.viewport('ipad-2')
      cy.visit('/')
      
      cy.get('[data-testid="product-grid"]').should('be.visible')
      cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0)
    })
  })
})