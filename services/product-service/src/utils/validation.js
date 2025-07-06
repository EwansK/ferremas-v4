const Joi = require('joi');

// Product search/filter validation schema
const productSearchSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow('').max(100).optional(),
  categoryId: Joi.string().uuid().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  inStock: Joi.boolean().optional(),
  sortBy: Joi.string().valid('name', 'price_clp', 'quantity', 'created_at').default('created_at'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

// Category validation schema
const categoryParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

// Product ID validation schema
const productParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

class ValidationUtils {
  validateProductSearch(data) {
    return productSearchSchema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });
  }

  validateCategoryParams(data) {
    return categoryParamsSchema.validate(data, { abortEarly: false });
  }

  validateProductParams(data) {
    return productParamsSchema.validate(data, { abortEarly: false });
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

  sanitizeSearchTerm(term) {
    if (!term) return '';
    
    // Remove special characters that could cause issues in SQL
    return term
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/['";]/g, '') // Remove quotes and semicolons
      .trim();
  }

  validatePriceRange(minPrice, maxPrice) {
    if (minPrice && maxPrice && minPrice > maxPrice) {
      return {
        isValid: false,
        message: 'Minimum price cannot be greater than maximum price'
      };
    }
    return { isValid: true };
  }
}

module.exports = new ValidationUtils();