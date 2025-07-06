const express = require('express');
const productController = require('../controllers/productController');
const imageController = require('../controllers/imageController');
const imageUpload = require('../utils/imageUpload');

const router = express.Router();

// Authentication is handled at the app level in index.js

// Product CRUD routes

// POST /products - Create new product
router.post('/', productController.createProduct);

// PUT /products/:id - Update product
router.put('/:id', productController.updateProduct);

// DELETE /products/:id - Delete product
router.delete('/:id', productController.deleteProduct);

// PUT /products/:id/stock - Update product stock
router.put('/:id/stock', productController.updateStock);

// GET /products/inventory - Get inventory view with filtering
router.get('/inventory', productController.getInventory);

// Image management routes

// POST /products/:id/image - Upload image for product
router.post('/:id/image', 
  imageUpload.single('image'), 
  imageController.uploadProductImage
);

// PUT /products/:id/image - Update/replace product image
router.put('/:id/image', 
  imageUpload.single('image'), 
  imageController.updateProductImage
);

// DELETE /products/:id/image - Remove product image
router.delete('/:id/image', imageController.removeProductImage);

module.exports = router;