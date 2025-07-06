const Joi = require('joi');

// Product creation validation schema
const createProductSchema = Joi.object({
  category_id: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(2000).optional().allow(''),
  price_clp: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(0).required()
});

// Product update validation schema
const updateProductSchema = Joi.object({
  category_id: Joi.string().uuid().optional(),
  name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  price_clp: Joi.number().positive().optional(),
  quantity: Joi.number().integer().min(0).optional()
});

// Category creation validation schema
const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required()
});

// Category update validation schema
const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional()
});

// Stock update validation schema
const updateStockSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required()
});

// Inventory query validation schema
const inventoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  lowStock: Joi.boolean().optional(),
  outOfStock: Joi.boolean().optional(),
  categoryId: Joi.string().uuid().optional(),
  sortBy: Joi.string().valid('name', 'quantity', 'price_clp', 'created_at').default('quantity'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC')
});

// Parameter validation schemas
const idParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

class ValidationUtils {
  validateCreateProduct(data) {
    return createProductSchema.validate(data, { abortEarly: false });
  }

  validateUpdateProduct(data) {
    return updateProductSchema.validate(data, { abortEarly: false });
  }

  validateCreateCategory(data) {
    return createCategorySchema.validate(data, { abortEarly: false });
  }

  validateUpdateCategory(data) {
    return updateCategorySchema.validate(data, { abortEarly: false });
  }

  validateUpdateStock(data) {
    return updateStockSchema.validate(data, { abortEarly: false });
  }

  validateInventoryQuery(data) {
    return inventoryQuerySchema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });
  }

  validateIdParams(data) {
    return idParamsSchema.validate(data, { abortEarly: false });
  }

  formatValidationErrors(joiError) {
    const errors = {};
    
    if (joiError && joiError.details) {
      joiError.details.forEach(detail => {
        const field = detail.path.join('.');
        errors[field] = detail.message;
      });
    }

    return {
      message: 'Validation failed',
      errors
    };
  }

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  validateImageFile(file) {
    const errors = [];
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,webp').split(',');

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // Check file type
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Check MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Only images are allowed.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new ValidationUtils();