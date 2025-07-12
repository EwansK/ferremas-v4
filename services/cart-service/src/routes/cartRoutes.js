const express = require('express');
const CartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware.authenticate);

// Cart operations
router.get('/', CartController.getCart);                    // GET /cart
router.post('/items', CartController.addItem);               // POST /cart/items
router.post('/items/bulk', CartController.addMultipleItems); // POST /cart/items/bulk
router.put('/items/:product_id', CartController.updateItem); // PUT /cart/items/:product_id
router.delete('/items/:product_id', CartController.removeItem); // DELETE /cart/items/:product_id
router.delete('/', CartController.clearCart);                // DELETE /cart

// Cart utilities
router.get('/count', CartController.getCartCount);           // GET /cart/count
router.get('/validate', CartController.validateCart);        // GET /cart/validate
router.post('/merge', CartController.mergeGuestCart);        // POST /cart/merge

module.exports = router;