const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateSchema, userSchemas } = require('../utils/validation');

// Authentication is handled at the app level in index.js

// GET /users - Get all users with pagination and filtering
router.get('/', 
  validateSchema(userSchemas.getUsersQuery, 'query'),
  userController.getUsers
);

// GET /users/statistics - Get user statistics
router.get('/statistics',
  userController.getUserStatistics
);

// GET /users/:id - Get user by ID
router.get('/:id',
  validateSchema(userSchemas.userId, 'params'),
  userController.getUserById
);

// PUT /users/:id - Update user
router.put('/:id',
  validateSchema(userSchemas.userId, 'params'),
  validateSchema(userSchemas.updateUser, 'body'),
  userController.updateUser
);

// DELETE /users/:id - Deactivate user (soft delete)
router.delete('/:id',
  validateSchema(userSchemas.userId, 'params'),
  userController.deactivateUser
);

// POST /users/:id/reactivate - Reactivate user
router.post('/:id/reactivate',
  validateSchema(userSchemas.userId, 'params'),
  userController.reactivateUser
);

// POST /users/bulk-update - Bulk update users
router.post('/bulk-update',
  userController.bulkUpdateUsers
);

module.exports = router;