const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// Product routes (all public - no authentication required)

// GET /products - Get all products with pagination and filters
router.get('/', productController.getProducts);

// GET /products/search - Search products
router.get('/search', productController.searchProducts);

// GET /products/featured - Get featured products
router.get('/featured', productController.getFeaturedProducts);

// GET /products/stats - Get product statistics
router.get('/stats', productController.getProductStats);

// GET /products/:id - Get single product by ID
router.get('/:id', productController.getProductById);

// GET /products/:id/stock - Get product stock information
router.get('/:id/stock', productController.getProductStock);

module.exports = router;