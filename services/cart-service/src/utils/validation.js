const Joi = require('joi');

// Cart item validation schemas
const cartItemValidation = {
  // Add item to cart
  addItem: Joi.object({
    product_id: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).max(999).required()
  }),

  // Update item quantity
  updateItem: Joi.object({
    quantity: Joi.number().integer().min(1).max(999).required()
  }),

  // Bulk add items
  addMultiple: Joi.object({
    items: Joi.array().items(Joi.object({
      product_id: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).max(999).required()
    })).min(1).max(50).required()
  }),

  // Apply coupon
  applyCoupon: Joi.object({
    coupon_code: Joi.string().min(3).max(50).required()
  })
};

// Cart validation helper
const validateCartItem = (data, schema) => {
  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const validationErrors = {};
    error.details.forEach(detail => {
      validationErrors[detail.path.join('.')] = detail.message;
    });
    return { isValid: false, errors: validationErrors };
  }
  
  return { isValid: true, data: value };
};

module.exports = {
  cartItemValidation,
  validateCartItem
};