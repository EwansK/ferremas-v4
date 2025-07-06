const Product = require('../models/Product');
const validationUtils = require('../utils/validation');

class ProductController {
  // Get all products with pagination and filters
  getProducts = async (req, res) => {
    try {
      // Validate query parameters
      const { error, value } = validationUtils.validateProductSearch(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const {
        page,
        limit,
        search,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        sortBy,
        sortOrder
      } = value;

      // Validate price range
      if (minPrice && maxPrice) {
        const priceValidation = validationUtils.validatePriceRange(minPrice, maxPrice);
        if (!priceValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: priceValidation.message
          });
        }
      }

      // Sanitize search term
      const sanitizedSearch = search ? validationUtils.sanitizeSearchTerm(search) : undefined;

      // Build filters
      const filters = {};
      if (sanitizedSearch) filters.search = sanitizedSearch;
      if (categoryId) filters.categoryId = categoryId;
      if (minPrice) filters.minPrice = minPrice;
      if (maxPrice) filters.maxPrice = maxPrice;
      if (inStock !== undefined) filters.inStock = inStock;

      // Get products
      const result = await Product.findAll(filters, {
        page,
        limit,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: {
          products: result.products,
          pagination: result.pagination,
          filters: {
            search: sanitizedSearch,
            categoryId,
            minPrice,
            maxPrice,
            inStock,
            sortBy,
            sortOrder
          }
        }
      });

    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching products'
      });
    }
  };

  // Get single product by ID
  getProductById = async (req, res) => {
    try {
      // Validate product ID
      const { error, value } = validationUtils.validateProductParams(req.params);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { id } = value;

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: {
          product
        }
      });

    } catch (error) {
      console.error('Get product by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product'
      });
    }
  };

  // Search products
  searchProducts = async (req, res) => {
    try {
      const { q: searchTerm, ...otherParams } = req.query;

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

      // Validate other parameters
      const { error, value } = validationUtils.validateProductSearch({
        ...otherParams,
        search: searchTerm
      });

      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { page, limit, sortBy, sortOrder } = value;
      const sanitizedSearch = validationUtils.sanitizeSearchTerm(searchTerm);

      const result = await Product.search(sanitizedSearch, {
        page,
        limit,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: {
          searchTerm: sanitizedSearch,
          products: result.products,
          pagination: result.pagination
        }
      });

    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching products'
      });
    }
  };

  // Get featured products
  getFeaturedProducts = async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 50);

      const products = await Product.findFeatured(limit);

      res.json({
        success: true,
        data: {
          products,
          count: products.length
        }
      });

    } catch (error) {
      console.error('Get featured products error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching featured products'
      });
    }
  };

  // Get product stock information
  getProductStock = async (req, res) => {
    try {
      // Validate product ID
      const { error, value } = validationUtils.validateProductParams(req.params);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { id } = value;

      const stockInfo = await Product.getStockInfo(id);

      if (!stockInfo) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: {
          stock: stockInfo
        }
      });

    } catch (error) {
      console.error('Get product stock error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product stock information'
      });
    }
  };

  // Get product statistics
  getProductStats = async (req, res) => {
    try {
      const stats = await Product.getProductCounts();

      res.json({
        success: true,
        data: {
          statistics: {
            total_products: parseInt(stats.total_products),
            in_stock_products: parseInt(stats.in_stock_products),
            out_of_stock_products: parseInt(stats.out_of_stock_products),
            low_stock_products: parseInt(stats.low_stock_products)
          }
        }
      });

    } catch (error) {
      console.error('Get product stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product statistics'
      });
    }
  };
}

module.exports = new ProductController();