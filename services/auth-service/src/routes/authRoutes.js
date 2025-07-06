const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const errorHandler = require('../middleware/errorHandler');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', errorHandler.asyncWrapper(authController.register));
router.post('/login', errorHandler.asyncWrapper(authController.login));
router.post('/refresh', errorHandler.asyncWrapper(authController.refresh));
router.post('/logout', errorHandler.asyncWrapper(authController.logout));
router.post('/verify', errorHandler.asyncWrapper(authController.verify));

// Protected routes (authentication required)
router.get('/profile', 
  authMiddleware.verifyToken, 
  errorHandler.asyncWrapper(authController.profile)
);

router.put('/profile', 
  authMiddleware.verifyToken, 
  errorHandler.asyncWrapper(authController.updateProfile)
);

module.exports = router;