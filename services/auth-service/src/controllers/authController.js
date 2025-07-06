const { Pool } = require('pg');
const jwtUtils = require('../utils/jwt');
const passwordUtils = require('../utils/password');
const validationUtils = require('../utils/validation');

class AuthController {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  // User registration
  register = async (req, res) => {
    try {
      // Validate input
      const { error, value } = validationUtils.validateRegister(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { name, lastname, email, password, role_id } = value;

      // Check if user already exists
      const existingUser = await this.pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Get customer role ID if no role specified
      let finalRoleId = role_id;
      if (!finalRoleId) {
        const customerRole = await this.pool.query(
          'SELECT id FROM roles WHERE role_name = $1',
          ['customer']
        );
        
        if (customerRole.rows.length === 0) {
          return res.status(500).json({
            success: false,
            message: 'Customer role not found in system'
          });
        }
        
        finalRoleId = customerRole.rows[0].id;
      } else {
        // Verify role exists
        const roleExists = await this.pool.query(
          'SELECT id FROM roles WHERE id = $1',
          [finalRoleId]
        );
        
        if (roleExists.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role specified'
          });
        }
      }

      // Hash password
      const hashedPassword = await passwordUtils.hashPassword(password);

      // Create user
      const newUser = await this.pool.query(
        `INSERT INTO users (name, lastname, email, password_hash, role_id) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, name, lastname, email, role_id, active, created_at`,
        [name, lastname, email.toLowerCase(), hashedPassword, finalRoleId]
      );

      const user = newUser.rows[0];

      // Generate tokens
      const tokens = await jwtUtils.generateTokenPair(user);

      // Get role name for response
      const roleResult = await this.pool.query(
        'SELECT role_name FROM roles WHERE id = $1',
        [user.role_id]
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            role: roleResult.rows[0].role_name,
            active: user.active,
            created_at: user.created_at
          },
          tokens
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  };

  // User login
  login = async (req, res) => {
    try {
      // Validate input
      const { error, value } = validationUtils.validateLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { email, password } = value;

      // Find user with role
      const userResult = await this.pool.query(
        `SELECT u.*, r.role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.email = $1`,
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = userResult.rows[0];

      if (!user.active) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact administrator.'
        });
      }

      // Verify password
      const isPasswordValid = await passwordUtils.comparePassword(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate tokens
      const tokens = await jwtUtils.generateTokenPair(user);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            role: user.role_name,
            active: user.active
          },
          tokens
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  };

  // Refresh access token
  refresh = async (req, res) => {
    try {
      // Validate input
      const { error, value } = validationUtils.validateRefreshToken(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const { refreshToken } = value;

      // Refresh token
      const newTokens = await jwtUtils.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: newTokens
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Failed to refresh token'
      });
    }
  };

  // User logout
  logout = async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await jwtUtils.invalidateRefreshToken(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    }
  };

  // Verify token (for API Gateway)
  verify = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'No authorization header'
        });
      }

      const token = jwtUtils.extractTokenFromHeader(authHeader);
      const decoded = jwtUtils.verifyAccessToken(token);

      // Get user details
      const userResult = await this.pool.query(
        `SELECT u.id, u.name, u.lastname, u.email, u.active, r.role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = $1`,
        [decoded.id]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].active) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or inactive user'
        });
      }

      const user = userResult.rows[0];

      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            id: user.id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            role: user.role_name,
            active: user.active
          }
        }
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  };

  // Get current user profile
  profile = async (req, res) => {
    try {
      const userId = req.user.id;

      const userResult = await this.pool.query(
        `SELECT u.id, u.name, u.lastname, u.email, u.active, u.created_at, r.role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            role: user.role_name,
            active: user.active,
            created_at: user.created_at
          }
        }
      });

    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user profile'
      });
    }
  };

  // Update user profile
  updateProfile = async (req, res) => {
    try {
      const userId = req.user.id;

      // Validate input
      const { error, value } = validationUtils.validateUpdateUser(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          ...validationUtils.formatValidationErrors(error)
        });
      }

      const updates = {};
      const values = [];
      let paramCount = 1;

      // Build dynamic update query
      Object.keys(value).forEach(key => {
        if (value[key] !== undefined) {
          updates[key] = `$${paramCount}`;
          values.push(value[key]);
          paramCount++;
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const setClause = Object.keys(updates)
        .map(key => `${key} = ${updates[key]}`)
        .join(', ');

      values.push(userId);

      const result = await this.pool.query(
        `UPDATE users SET ${setClause} WHERE id = $${paramCount} RETURNING id, name, lastname, email, active`,
        values
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  };
}

module.exports = new AuthController();