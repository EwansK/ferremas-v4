const database = require('../utils/database');
const validationUtils = require('../utils/validation');
const path = require('path');
const fs = require('fs-extra');

class ProductController {
  // Create new product
  createProduct = async (req, res) => {
    try {
      // Validate input
      const { error, value } = validationUtils.validateCreateProduct(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { category_id, name, description, price_clp, quantity } = value;

      // Check if category exists
      const categoryResult = await database.query(
        'SELECT id FROM categories WHERE id = $1',
        [category_id]
      );

      if (categoryResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Create product
      const result = await database.query(
        `INSERT INTO products (category_id, name, description, price_clp, quantity) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [category_id, name, description || null, price_clp, quantity]
      );

      const product = result.rows[0];

      // Log activity
      try {
        await database.logActivity(
          req.user.id,
          'CREATE_PRODUCT',
          'product',
          product.id,
          null,
          JSON.stringify({ name, category_id, price_clp, quantity }),
          req.ip
        );
      } catch (logError) {
        console.warn('Activity logging failed (non-critical):', logError.message);
      }

      // Get product with category info
      const productWithCategory = await this.getProductWithCategory(product.id);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: {
          product: productWithCategory
        }
      });

    } catch (error) {
      console.error('Create product error:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating product'
      });
    }
  };

  // Update product
  updateProduct = async (req, res) => {
    try {
      // Log incoming request data for debugging
      console.log('updateProduct - Request body:', JSON.stringify(req.body));
      console.log('updateProduct - Request params:', JSON.stringify(req.params));
      
      // Validate product ID
      const { error: paramsError, value: paramsValue } = validationUtils.validateIdParams(req.params);
      if (paramsError) {
        console.log('updateProduct - Params validation error:', paramsError.details);
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(paramsError)
        });
      }

      // Validate input
      const { error: bodyError, value: bodyValue } = validationUtils.validateUpdateProduct(req.body);
      if (bodyError) {
        console.log('updateProduct - Body validation error:', bodyError.details);
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(bodyError)
        });
      }

      const { id } = paramsValue;
      const updates = bodyValue;

      // Check if product exists
      const existingProduct = await database.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );

      if (existingProduct.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const oldProduct = existingProduct.rows[0];

      // If category_id is being updated, verify it exists
      if (updates.category_id) {
        const categoryResult = await database.query(
          'SELECT id FROM categories WHERE id = $1',
          [updates.category_id]
        );

        if (categoryResult.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Category not found'
          });
        }
      }

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      values.push(id);

      const updateQuery = `
        UPDATE products 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await database.query(updateQuery, values);
      const updatedProduct = result.rows[0];

      // Log activity
      try {
        await database.logActivity(
          req.user.id,
          'UPDATE_PRODUCT',
          'product',
          id,
          JSON.stringify(oldProduct),
          JSON.stringify(updates),
          req.ip
        );
      } catch (logError) {
        console.warn('Activity logging failed (non-critical):', logError.message);
      }

      // Get product with category info
      const productWithCategory = await this.getProductWithCategory(id);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: {
          product: productWithCategory
        }
      });

    } catch (error) {
      console.error('Update product error:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error updating product'
      });
    }
  };

  // Delete product (soft delete)
  deleteProduct = async (req, res) => {
    try {
      // Validate product ID
      const { error, value } = validationUtils.validateIdParams(req.params);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { id } = value;

      // Check if product exists
      const existingProduct = await database.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );

      if (existingProduct.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const product = existingProduct.rows[0];

      // For now, we'll do a hard delete since our simplified schema doesn't have is_active
      // In a real application, you might want to add an is_active column for soft deletes
      await database.query('DELETE FROM products WHERE id = $1', [id]);

      // Log activity
      try {
        await database.logActivity(
          req.user.id,
          'DELETE_PRODUCT',
          'product',
          id,
          JSON.stringify(product),
          null,
          req.ip
        );
      } catch (logError) {
        console.warn('Activity logging failed (non-critical):', logError.message);
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      console.error('Delete product error:', error);

      if (error.code === '23503') { // Foreign key constraint
        return res.status(400).json({
          success: false,
          message: 'Cannot delete product. It may be referenced in orders or cart items.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error deleting product'
      });
    }
  };

  // Update product stock
  updateStock = async (req, res) => {
    try {
      // Log incoming request data for debugging
      console.log('updateStock - Request body:', JSON.stringify(req.body));
      console.log('updateStock - Request params:', JSON.stringify(req.params));
      
      // Validate product ID
      const { error: paramsError, value: paramsValue } = validationUtils.validateIdParams(req.params);
      if (paramsError) {
        console.log('updateStock - Params validation error:', paramsError.details);
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(paramsError)
        });
      }

      // Validate stock data
      const { error: bodyError, value: bodyValue } = validationUtils.validateUpdateStock(req.body);
      if (bodyError) {
        console.log('updateStock - Body validation error:', bodyError.details);
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(bodyError)
        });
      }

      const { id } = paramsValue;
      const { quantity } = bodyValue;

      // Check if product exists
      const existingProduct = await database.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );

      if (existingProduct.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const oldProduct = existingProduct.rows[0];
      
      console.log('updateStock - Current quantity:', oldProduct.quantity, 'New quantity:', quantity);

      // Update stock
      const result = await database.query(
        'UPDATE products SET quantity = $1 WHERE id = $2 RETURNING *',
        [quantity, id]
      );

      const updatedProduct = result.rows[0];
      console.log('updateStock - Updated quantity in DB:', updatedProduct.quantity);

      // Log activity with improved error handling
      try {
        await database.logActivity(
          req.user.id,
          'UPDATE_STOCK',
          'product',
          id,
          JSON.stringify({ quantity: oldProduct.quantity }),
          JSON.stringify({ quantity }),
          req.ip
        );
      } catch (logError) {
        console.warn('Activity logging failed (non-critical):', logError.message);
      }

      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: {
          product: {
            id: updatedProduct.id,
            name: updatedProduct.name,
            quantity: updatedProduct.quantity,
            previous_quantity: oldProduct.quantity
          }
        }
      });

    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating stock'
      });
    }
  };

  // Get inventory view with filtering
  getInventory = async (req, res) => {
    try {
      // Validate query parameters
      const { error, value } = validationUtils.validateInventoryQuery(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { page, limit, lowStock, outOfStock, categoryId, sortBy, sortOrder } = value;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions = [];
      const params = [];
      let paramCount = 1;

      if (lowStock) {
        conditions.push('p.quantity > 0 AND p.quantity <= 5');
      }

      if (outOfStock) {
        conditions.push('p.quantity = 0');
      }

      if (categoryId) {
        conditions.push(`p.category_id = $${paramCount}`);
        params.push(categoryId);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      // Count total items
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        ${whereClause}
      `;

      const countResult = await database.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get products
      const productsQuery = `
        SELECT 
          p.id,
          p.name,
          p.description,
          p.quantity,
          p.price_clp,
          p.image_link,
          p.category_id,
          c.name as category_name,
          p.created_at,
          CASE 
            WHEN p.quantity = 0 THEN 'out_of_stock'
            WHEN p.quantity <= 5 THEN 'low_stock'
            ELSE 'in_stock'
          END as stock_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereClause}
        ORDER BY p.${sortBy} ${sortOrder}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const result = await database.query(productsQuery, [...params, limit, offset]);

      const pagination = {
        currentPage: page,
        pageSize: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      };

      // Format products to match frontend interface
      const formattedProducts = result.rows.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price_clp: parseFloat(product.price_clp),
        quantity: product.quantity,
        in_stock: product.quantity > 0,
        image_link: product.image_link,
        category: {
          id: product.category_id,
          name: product.category_name
        },
        created_at: product.created_at,
        stock_status: product.stock_status
      }));

      res.json({
        success: true,
        data: {
          products: formattedProducts,
          pagination,
          filters: {
            lowStock,
            outOfStock,
            categoryId,
            sortBy,
            sortOrder
          }
        }
      });

    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching inventory'
      });
    }
  };

  // Helper method to get product with category info
  async getProductWithCategory(productId) {
    const result = await database.query(
      `SELECT 
        p.*,
        c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [productId]
    );

    if (result.rows.length === 0) return null;

    const product = result.rows[0];
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price_clp: parseFloat(product.price_clp),
      quantity: product.quantity,
      image_link: product.image_link,
      category: {
        id: product.category_id,
        name: product.category_name
      },
      created_at: product.created_at
    };
  }
}

module.exports = new ProductController();