const database = require('../utils/database');

class Cart {
  // Get user's cart with product details
  static async getCartByUserId(userId) {
    try {
      const result = await database.query(`
        SELECT 
          ci.id,
          ci.product_id,
          ci.quantity,
          ci.created_at,
          p.name as product_name,
          p.price_clp,
          p.description,
          p.image_link,
          p.quantity as stock_quantity,
          c.name as category_name,
          (ci.quantity * p.price_clp) as subtotal
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE ci.user_id = $1
        ORDER BY ci.created_at DESC
      `, [userId]);

      const items = result.rows;
      const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        user_id: userId,
        items,
        summary: {
          total_items: itemCount,
          total_amount: total,
          currency: 'CLP'
        }
      };
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  }

  // Add item to cart
  static async addItem(userId, productId, quantity) {
    try {
      return await database.transaction(async (client) => {
        // First check if product exists and has enough stock
        const productResult = await client.query(
          'SELECT id, name, price_clp, quantity as stock FROM products WHERE id = $1',
          [productId]
        );

        if (productResult.rows.length === 0) {
          throw new Error('Product not found');
        }

        const product = productResult.rows[0];
        
        if (product.stock < quantity) {
          throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
        }

        // Check if item already exists in cart
        const existingResult = await client.query(
          'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
          [userId, productId]
        );

        if (existingResult.rows.length > 0) {
          // Update existing item
          const existingItem = existingResult.rows[0];
          const newQuantity = existingItem.quantity + quantity;

          if (newQuantity > product.stock) {
            throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`);
          }

          const updateResult = await client.query(
            'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
            [newQuantity, existingItem.id]
          );

          return updateResult.rows[0];
        } else {
          // Add new item
          const insertResult = await client.query(
            'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
            [userId, productId, quantity]
          );

          return insertResult.rows[0];
        }
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  // Update item quantity
  static async updateItemQuantity(userId, productId, quantity) {
    try {
      return await database.transaction(async (client) => {
        // Check product stock
        const productResult = await client.query(
          'SELECT quantity as stock FROM products WHERE id = $1',
          [productId]
        );

        if (productResult.rows.length === 0) {
          throw new Error('Product not found');
        }

        const product = productResult.rows[0];
        
        if (product.stock < quantity) {
          throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
        }

        // Update cart item
        const result = await client.query(
          'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
          [quantity, userId, productId]
        );

        if (result.rows.length === 0) {
          throw new Error('Cart item not found');
        }

        return result.rows[0];
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  // Remove item from cart
  static async removeItem(userId, productId) {
    try {
      const result = await database.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 RETURNING *',
        [userId, productId]
      );

      if (result.rows.length === 0) {
        throw new Error('Cart item not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error removing cart item:', error);
      throw error;
    }
  }

  // Clear entire cart
  static async clearCart(userId) {
    try {
      const result = await database.query(
        'DELETE FROM cart_items WHERE user_id = $1 RETURNING *',
        [userId]
      );

      return { deleted_count: result.rows.length, items: result.rows };
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Get cart item count
  static async getItemCount(userId) {
    try {
      const result = await database.query(
        'SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE user_id = $1',
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting cart count:', error);
      throw error;
    }
  }

  // Validate cart items against current product availability
  static async validateCart(userId) {
    try {
      const result = await database.query(`
        SELECT 
          ci.product_id,
          ci.quantity as cart_quantity,
          p.name as product_name,
          p.quantity as stock_quantity,
          p.price_clp,
          CASE 
            WHEN p.quantity < ci.quantity THEN 'insufficient_stock'
            WHEN p.quantity = 0 THEN 'out_of_stock'
            ELSE 'available'
          END as status
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = $1
      `, [userId]);

      const items = result.rows;
      const issues = items.filter(item => item.status !== 'available');
      
      return {
        is_valid: issues.length === 0,
        items,
        issues: issues.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          cart_quantity: item.cart_quantity,
          stock_quantity: item.stock_quantity,
          status: item.status
        }))
      };
    } catch (error) {
      console.error('Error validating cart:', error);
      throw error;
    }
  }

  // Merge guest cart with user cart (for when user logs in)
  static async mergeGuestCart(userId, guestCartItems) {
    try {
      return await database.transaction(async (client) => {
        const results = [];

        for (const item of guestCartItems) {
          try {
            const result = await this.addItem(userId, item.product_id, item.quantity);
            results.push({ success: true, item: result });
          } catch (error) {
            results.push({ 
              success: false, 
              product_id: item.product_id, 
              error: error.message 
            });
          }
        }

        return results;
      });
    } catch (error) {
      console.error('Error merging guest cart:', error);
      throw error;
    }
  }
}

module.exports = Cart;