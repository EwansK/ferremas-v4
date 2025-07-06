const Category = require('../models/Category');
const validationUtils = require('../utils/validation');

class CategoryController {
  // Get all categories
  getCategories = async (req, res) => {
    try {
      const categories = await Category.findAll();

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

  // Get single category by ID
  getCategoryById = async (req, res) => {
    try {
      // Validate category ID
      const { error, value } = validationUtils.validateCategoryParams(req.params);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { id } = value;

      const category = await Category.findById(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

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

  // Get products in a specific category
  getCategoryProducts = async (req, res) => {
    try {
      // Validate category ID
      const { error: paramsError, value: paramsValue } = validationUtils.validateCategoryParams(req.params);
      if (paramsError) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(paramsError)
        });
      }

      // Validate query parameters
      const { error: queryError, value: queryValue } = validationUtils.validateProductSearch(req.query);
      if (queryError) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(queryError)
        });
      }

      const { id } = paramsValue;
      const { page, limit, sortBy, sortOrder } = queryValue;

      const result = await Category.findWithProducts(id, {
        page,
        limit,
        sortBy,
        sortOrder
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get category products error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category products'
      });
    }
  };

  // Get category statistics
  getCategoryStats = async (req, res) => {
    try {
      const stats = await Category.getCategoryStats();

      res.json({
        success: true,
        data: {
          categories: stats,
          count: stats.length
        }
      });

    } catch (error) {
      console.error('Get category stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category statistics'
      });
    }
  };

  // Search categories
  searchCategories = async (req, res) => {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      if (searchTerm.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters long'
        });
      }

      const sanitizedSearch = validationUtils.sanitizeSearchTerm(searchTerm);
      const categories = await Category.searchCategories(sanitizedSearch);

      res.json({
        success: true,
        data: {
          searchTerm: sanitizedSearch,
          categories,
          count: categories.length
        }
      });

    } catch (error) {
      console.error('Search categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching categories'
      });
    }
  };
}

module.exports = new CategoryController();