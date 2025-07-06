const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// Category routes (all public - no authentication required)

// GET /categories - Get all categories
router.get('/', categoryController.getCategories);

// GET /categories/search - Search categories
router.get('/search', categoryController.searchCategories);

// GET /categories/stats - Get category statistics
router.get('/stats', categoryController.getCategoryStats);

// GET /categories/:id - Get single category by ID
router.get('/:id', categoryController.getCategoryById);

// GET /categories/:id/products - Get products in a specific category
router.get('/:id/products', categoryController.getCategoryProducts);

module.exports = router;