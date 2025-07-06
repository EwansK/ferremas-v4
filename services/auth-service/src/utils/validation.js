const Joi = require('joi');

// User registration validation schema
const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must be less than 100 characters long',
      'string.pattern.base': 'Name can only contain letters and spaces',
      'any.required': 'Name is required'
    }),

  lastname: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must be less than 100 characters long',
      'string.pattern.base': 'Last name can only contain letters and spaces',
      'any.required': 'Last name is required'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must be less than 255 characters long',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be less than 128 characters long',
      'any.required': 'Password is required'
    }),

  role_id: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Role ID must be a valid UUID'
    })
});

// User login validation schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Refresh token validation schema
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

// User update validation schema
const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must be less than 100 characters long',
      'string.pattern.base': 'Name can only contain letters and spaces'
    }),

  lastname: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must be less than 100 characters long',
      'string.pattern.base': 'Last name can only contain letters and spaces'
    }),

  active: Joi.boolean()
    .optional()
});

// Password change validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password must be less than 128 characters long',
      'any.required': 'New password is required'
    })
});

class ValidationUtils {
  validateRegister(data) {
    return registerSchema.validate(data, { abortEarly: false });
  }

  validateLogin(data) {
    return loginSchema.validate(data, { abortEarly: false });
  }

  validateRefreshToken(data) {
    return refreshTokenSchema.validate(data, { abortEarly: false });
  }

  validateUpdateUser(data) {
    return updateUserSchema.validate(data, { abortEarly: false });
  }

  validateChangePassword(data) {
    return changePasswordSchema.validate(data, { abortEarly: false });
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

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = new ValidationUtils();