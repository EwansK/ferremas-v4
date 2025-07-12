const Cart = require('../models/Cart');
const { cartItemValidation, validateCartItem } = require('../utils/validation');

class CartController {
  // Get user's cart
  static async getCart(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to view cart'
        });
      }

      const cart = await Cart.getCartByUserId(req.user.id);
      
      res.json({
        success: true,
        message: 'Cart retrieved successfully',
        data: cart
      });
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cart',
        error: { message: error.message }
      });
    }
  }

  // Add item to cart
  static async addItem(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to add items to cart'
        });
      }

      const validation = validateCartItem(req.body, cartItemValidation.addItem);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const { product_id, quantity } = validation.data;
      const cartItem = await Cart.addItem(req.user.id, product_id, quantity);

      res.status(201).json({
        success: true,
        message: 'Item added to cart successfully',
        data: cartItem
      });
    } catch (error) {
      console.error('Add cart item error:', error);
      
      if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: { message: error.message }
      });
    }
  }

  // Update item quantity
  static async updateItem(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to update cart'
        });
      }

      const validation = validateCartItem(req.body, cartItemValidation.updateItem);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const { product_id } = req.params;
      const { quantity } = validation.data;

      const cartItem = await Cart.updateItemQuantity(req.user.id, product_id, quantity);

      res.json({
        success: true,
        message: 'Cart item updated successfully',
        data: cartItem
      });
    } catch (error) {
      console.error('Update cart item error:', error);
      
      if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update cart item',
        error: { message: error.message }
      });
    }
  }

  // Remove item from cart
  static async removeItem(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to modify cart'
        });
      }

      const { product_id } = req.params;
      const removedItem = await Cart.removeItem(req.user.id, product_id);

      res.json({
        success: true,
        message: 'Item removed from cart successfully',
        data: removedItem
      });
    } catch (error) {
      console.error('Remove cart item error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to remove cart item',
        error: { message: error.message }
      });
    }
  }

  // Clear entire cart
  static async clearCart(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to clear cart'
        });
      }

      const result = await Cart.clearCart(req.user.id);

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        data: {
          deleted_count: result.deleted_count,
          message: `${result.deleted_count} items removed from cart`
        }
      });
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
        error: { message: error.message }
      });
    }
  }

  // Get cart item count
  static async getCartCount(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to view cart count'
        });
      }

      const count = await Cart.getItemCount(req.user.id);

      res.json({
        success: true,
        message: 'Cart count retrieved successfully',
        data: { count }
      });
    } catch (error) {
      console.error('Get cart count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cart count',
        error: { message: error.message }
      });
    }
  }

  // Validate cart
  static async validateCart(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to validate cart'
        });
      }

      const validation = await Cart.validateCart(req.user.id);

      res.json({
        success: true,
        message: 'Cart validation completed',
        data: validation
      });
    } catch (error) {
      console.error('Validate cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate cart',
        error: { message: error.message }
      });
    }
  }

  // Add multiple items (bulk add)
  static async addMultipleItems(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to add items to cart'
        });
      }

      const validation = validateCartItem(req.body, cartItemValidation.addMultiple);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const { items } = validation.data;
      const results = [];

      for (const item of items) {
        try {
          const cartItem = await Cart.addItem(req.user.id, item.product_id, item.quantity);
          results.push({
            success: true,
            product_id: item.product_id,
            data: cartItem
          });
        } catch (error) {
          results.push({
            success: false,
            product_id: item.product_id,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.status(successCount > 0 ? 201 : 400).json({
        success: successCount > 0,
        message: `${successCount} items added successfully, ${failureCount} failed`,
        data: {
          success_count: successCount,
          failure_count: failureCount,
          results
        }
      });
    } catch (error) {
      console.error('Add multiple items error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add items to cart',
        error: { message: error.message }
      });
    }
  }

  // Merge guest cart (when user logs in)
  static async mergeGuestCart(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to merge cart'
        });
      }

      const { guest_cart_items } = req.body;

      if (!Array.isArray(guest_cart_items)) {
        return res.status(400).json({
          success: false,
          message: 'guest_cart_items must be an array'
        });
      }

      const results = await Cart.mergeGuestCart(req.user.id, guest_cart_items);
      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        message: `Guest cart merged successfully. ${successCount} items processed.`,
        data: {
          merged_count: successCount,
          results
        }
      });
    } catch (error) {
      console.error('Merge guest cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to merge guest cart',
        error: { message: error.message }
      });
    }
  }
}

module.exports = CartController;