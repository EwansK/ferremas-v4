const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// Authentication is handled at the app level in index.js

// Category CRUD routes

// GET /categories - Get all categories with management info
router.get('/', categoryController.getCategories);

// GET /categories/:id - Get single category with detailed info
router.get('/:id', categoryController.getCategoryById);

// POST /categories - Create new category
router.post('/', categoryController.createCategory);

// PUT /categories/:id - Update category
router.put('/:id', categoryController.updateCategory);

// DELETE /categories/:id - Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;