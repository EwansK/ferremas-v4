const database = require('../utils/database');
const validationUtils = require('../utils/validation');

class CategoryController {
  // Create new category
  createCategory = async (req, res) => {
    try {
      // Validate input
      const { error, value } = validationUtils.validateCreateCategory(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { name } = value;

      // Check if category with same name already exists
      const existingCategory = await database.query(
        'SELECT id FROM categories WHERE name ILIKE $1',
        [name]
      );

      if (existingCategory.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      // Create category
      const result = await database.query(
        'INSERT INTO categories (name) VALUES ($1) RETURNING *',
        [name]
      );

      const category = result.rows[0];

      // Log activity
      await database.logActivity(
        req.user.id,
        'CREATE_CATEGORY',
        'category',
        category.id,
        null,
        { name },
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: {
          category: {
            id: category.id,
            name: category.name
          }
        }
      });

    } catch (error) {
      console.error('Create category error:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating category'
      });
    }
  };

  // Update category
  updateCategory = async (req, res) => {
    try {
      // Validate category ID
      const { error: paramsError, value: paramsValue } = validationUtils.validateIdParams(req.params);
      if (paramsError) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(paramsError)
        });
      }

      // Validate input
      const { error: bodyError, value: bodyValue } = validationUtils.validateUpdateCategory(req.body);
      if (bodyError) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(bodyError)
        });
      }

      const { id } = paramsValue;
      const { name } = bodyValue;

      // Check if category exists
      const existingCategory = await database.query(
        'SELECT * FROM categories WHERE id = $1',
        [id]
      );

      if (existingCategory.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const oldCategory = existingCategory.rows[0];

      // Check if another category with same name exists (excluding current one)
      if (name) {
        const duplicateCategory = await database.query(
          'SELECT id FROM categories WHERE name ILIKE $1 AND id != $2',
          [name, id]
        );

        if (duplicateCategory.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Category with this name already exists'
          });
        }
      }

      // Update category
      const result = await database.query(
        'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
        [name, id]
      );

      const updatedCategory = result.rows[0];

      // Log activity
      await database.logActivity(
        req.user.id,
        'UPDATE_CATEGORY',
        'category',
        id,
        { name: oldCategory.name },
        { name },
        req.ip
      );

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: {
          category: {
            id: updatedCategory.id,
            name: updatedCategory.name
          }
        }
      });

    } catch (error) {
      console.error('Update category error:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error updating category'
      });
    }
  };

  // Delete category
  deleteCategory = async (req, res) => {
    try {
      // Validate category ID
      const { error, value } = validationUtils.validateIdParams(req.params);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { id } = value;

      // Check if category exists
      const existingCategory = await database.query(
        'SELECT * FROM categories WHERE id = $1',
        [id]
      );

      if (existingCategory.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const category = existingCategory.rows[0];

      // Check if category has products
      const productsInCategory = await database.query(
        'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
        [id]
      );

      const productCount = parseInt(productsInCategory.rows[0].count);

      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. It contains ${productCount} product(s). Please move or delete the products first.`
        });
      }

      // Delete category
      await database.query('DELETE FROM categories WHERE id = $1', [id]);

      // Log activity
      await database.logActivity(
        req.user.id,
        'DELETE_CATEGORY',
        'category',
        id,
        category,
        null,
        req.ip
      );

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error) {
      console.error('Delete category error:', error);

      if (error.code === '23503') { // Foreign key constraint
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category. It is being used by products.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error deleting category'
      });
    }
  };

  // Get all categories with product counts for management
  getCategories = async (req, res) => {
    try {
      const result = await database.query(
        `SELECT 
          c.id,
          c.name,
          COUNT(p.id) as product_count,
          COUNT(CASE WHEN p.quantity > 0 THEN 1 END) as in_stock_count,
          COUNT(CASE WHEN p.quantity = 0 THEN 1 END) as out_of_stock_count
         FROM categories c
         LEFT JOIN products p ON c.id = p.category_id
         GROUP BY c.id, c.name
         ORDER BY c.name ASC`
      );

      const categories = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        product_count: parseInt(row.product_count),
        in_stock_count: parseInt(row.in_stock_count),
        out_of_stock_count: parseInt(row.out_of_stock_count)
      }));

      res.json({
        success: true,
        data: {
          categories,
          count: categories.length
        }
      });

    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching categories'
      });
    }
  };

  // Get single category with detailed information
  getCategoryById = async (req, res) => {
    try {
      // Validate category ID
      const { error, value } = validationUtils.validateIdParams(req.params);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { id } = value;

      const result = await database.query(
        `SELECT 
          c.id,
          c.name,
          COUNT(p.id) as product_count,
          COUNT(CASE WHEN p.quantity > 0 THEN 1 END) as in_stock_count,
          COUNT(CASE WHEN p.quantity = 0 THEN 1 END) as out_of_stock_count,
          COALESCE(MIN(p.price_clp), 0) as min_price,
          COALESCE(MAX(p.price_clp), 0) as max_price,
          COALESCE(AVG(p.price_clp), 0) as avg_price
         FROM categories c
         LEFT JOIN products p ON c.id = p.category_id
         WHERE c.id = $1
         GROUP BY c.id, c.name`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const row = result.rows[0];
      const category = {
        id: row.id,
        name: row.name,
        product_count: parseInt(row.product_count),
        in_stock_count: parseInt(row.in_stock_count),
        out_of_stock_count: parseInt(row.out_of_stock_count),
        price_range: {
          min: parseFloat(row.min_price),
          max: parseFloat(row.max_price),
          avg: Math.round(parseFloat(row.avg_price) * 100) / 100
        }
      };

      res.json({
        success: true,
        data: {
          category
        }
      });

    } catch (error) {
      console.error('Get category by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category'
      });
    }
  };
}

module.exports = new CategoryController();