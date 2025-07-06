const Joi = require('joi');

// User validation schemas
const userSchemas = {
  // Update user validation
  updateUser: Joi.object({
    name: Joi.string().min(2).max(50).trim(),
    lastname: Joi.string().min(2).max(50).trim(),
    email: Joi.string().email().lowercase().trim(),
    role: Joi.string().valid('customer', 'manager', 'admin'),
    active: Joi.boolean()
  }).min(1), // At least one field must be provided

  // Query parameters for user listing
  getUsersQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).trim().default(''),
    role: Joi.string().valid('customer', 'manager', 'admin', '').default(''),
    sortBy: Joi.string().valid('created_at', 'name', 'email', 'role', 'active').default('created_at'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  // User ID parameter
  userId: Joi.object({
    id: Joi.string().uuid().required()
  })
};

// Employee validation schemas
const employeeSchemas = {
  // Create employee validation
  createEmployee: Joi.object({
    name: Joi.string().min(2).max(50).trim().required(),
    lastname: Joi.string().min(2).max(50).trim().required(),
    email: Joi.string().email().lowercase().trim().required(),
    role: Joi.string().valid('manager', 'admin').required(),
    password: Joi.string().min(8).max(128).required(),
    department: Joi.string().min(2).max(100).trim().required(),
    position: Joi.string().min(2).max(100).trim().required(),
    phone: Joi.string().min(8).max(20).trim().allow(null, ''),
    address: Joi.string().max(255).trim().allow(null, '')
  }),

  // Update employee validation
  updateEmployee: Joi.object({
    name: Joi.string().min(2).max(50).trim(),
    lastname: Joi.string().min(2).max(50).trim(),
    email: Joi.string().email().lowercase().trim(),
    role: Joi.string().valid('manager', 'admin'),
    active: Joi.boolean(),
    department: Joi.string().min(2).max(100).trim(),
    position: Joi.string().min(2).max(100).trim(),
    phone: Joi.string().min(8).max(20).trim().allow(null, ''),
    address: Joi.string().max(255).trim().allow(null, '')
  }).min(1),

  // Query parameters for employee listing
  getEmployeesQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).trim().default(''),
    department: Joi.string().max(100).trim().default(''),
    position: Joi.string().max(100).trim().default(''),
    sortBy: Joi.string().valid('hire_date', 'name', 'email', 'department', 'position').default('hire_date'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  // Employee ID parameter
  employeeId: Joi.object({
    id: Joi.string().uuid().required()
  })
};

// Activity log validation schemas
const activitySchemas = {
  // Query parameters for activity logs
  getActivityQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    userId: Joi.string().uuid(),
    action: Joi.string().max(100).trim(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  // Statistics query parameters
  getStatsQuery: Joi.object({
    days: Joi.number().integer().min(1).max(365).default(30)
  })
};

// Validation middleware factory
const validateSchema = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails
      });
    }

    // Replace the original property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

// Custom validation functions
const customValidations = {
  // Check if email is unique (excluding current user)
  isEmailUnique: async (email, excludeUserId = null) => {
    const { query } = require('./database');
    
    let queryText = 'SELECT id FROM users WHERE email = $1';
    let queryParams = [email];
    
    if (excludeUserId) {
      queryText += ' AND id != $2';
      queryParams.push(excludeUserId);
    }
    
    const result = await query(queryText, queryParams);
    return result.rows.length === 0;
  },

  // Validate role hierarchy (admin can manage all, manager can manage customers)
  canManageUser: (adminRole, targetRole) => {
    const roleHierarchy = {
      admin: ['admin', 'manager', 'customer'],
      manager: ['customer']
    };
    
    return roleHierarchy[adminRole]?.includes(targetRole) || false;
  },

  // Validate date range
  isValidDateRange: (startDate, endDate, maxDays = 365) => {
    if (!startDate || !endDate) return true;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    
    return diffDays >= 0 && diffDays <= maxDays;
  }
};

module.exports = {
  userSchemas,
  employeeSchemas,
  activitySchemas,
  validateSchema,
  customValidations
};