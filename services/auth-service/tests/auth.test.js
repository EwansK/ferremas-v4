const request = require('supertest');
const app = require('../src/index');
const { Pool } = require('pg');

// Mock database pool
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    end: jest.fn()
  }))
}));

const mockPool = new Pool();

describe('Auth Service API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [{ id: '1', role_name: 'customer' }] }) // Get customer role
        .mockResolvedValueOnce({ 
          rows: [{
            id: 'user-123',
            name: 'John',
            lastname: 'Doe',
            email: 'john@example.com',
            role_id: '1',
            active: true,
            created_at: new Date()
          }]
        }) // Create user
        .mockResolvedValueOnce({ rows: [{ role_name: 'customer' }] }); // Get role name

      const newUser = {
        name: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    test('should return error for existing email', async () => {
      // Mock existing user
      mockPool.query.mockResolvedValueOnce({ 
        rows: [{ id: 'existing-user' }] 
      });

      const existingUser = {
        name: 'John',
        lastname: 'Doe',
        email: 'existing@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    test('should validate required fields', async () => {
      const invalidUser = {
        name: '',
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login user with valid credentials', async () => {
      // Mock user data
      const mockUser = {
        id: 'user-123',
        name: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password_hash: '$2b$12$LQv3c1yqBwlVHpPjrO3uCu/Nwp2sTY0o8GU8U8G8U8G8U8G8U8G8U', // hashed 'password123'
        role_name: 'customer',
        active: true
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const credentials = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(credentials.email);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
    });

    test('should return error for invalid credentials', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    test('should return error for inactive user', async () => {
      const inactiveUser = {
        id: 'user-123',
        email: 'inactive@example.com',
        password_hash: '$2b$12$LQv3c1yqBwlVHpPjrO3uCu/Nwp2sTY0o8GU8U8G8U8G8U8G8U8G8U',
        active: false
      };

      mockPool.query.mockResolvedValueOnce({ rows: [inactiveUser] });

      const credentials = {
        email: 'inactive@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is inactive. Please contact administrator.');
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should return user profile with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        role_name: 'customer',
        active: true,
        created_at: new Date()
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Mock JWT verification middleware
      const mockVerifyToken = (req, res, next) => {
        req.user = { id: 'user-123' };
        next();
      };

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(mockUser.email);
    });

    test('should return error without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
    });

    test('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('JWT Utilities', () => {
  const jwtUtils = require('../src/utils/jwt');

  test('should generate token pair', async () => {
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      role_id: 'role-1'
    };

    const tokens = await jwtUtils.generateTokenPair(user);

    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    expect(tokens).toHaveProperty('expiresIn');
  });

  test('should verify access token', () => {
    const user = { id: 'user-123', email: 'test@example.com' };
    const token = jwtUtils.generateAccessToken(user);
    const decoded = jwtUtils.verifyAccessToken(token);

    expect(decoded.id).toBe(user.id);
    expect(decoded.email).toBe(user.email);
  });

  test('should throw error for invalid token', () => {
    expect(() => {
      jwtUtils.verifyAccessToken('invalid-token');
    }).toThrow();
  });
});

describe('Password Utilities', () => {
  const passwordUtils = require('../src/utils/password');

  test('should hash password', async () => {
    const password = 'password123';
    const hash = await passwordUtils.hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  test('should compare password correctly', async () => {
    const password = 'password123';
    const hash = await passwordUtils.hashPassword(password);
    
    const isValid = await passwordUtils.comparePassword(password, hash);
    const isInvalid = await passwordUtils.comparePassword('wrongpassword', hash);

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });
});

describe('Validation Utilities', () => {
  const validationUtils = require('../src/utils/validation');

  test('should validate registration data', () => {
    const validData = {
      name: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    const { error } = validationUtils.validateRegister(validData);
    expect(error).toBeUndefined();
  });

  test('should reject invalid registration data', () => {
    const invalidData = {
      name: '',
      email: 'invalid-email',
      password: '123'
    };

    const { error } = validationUtils.validateRegister(invalidData);
    expect(error).toBeDefined();
  });

  test('should validate login data', () => {
    const validData = {
      email: 'john@example.com',
      password: 'password123'
    };

    const { error } = validationUtils.validateLogin(validData);
    expect(error).toBeUndefined();
  });

  test('should reject invalid login data', () => {
    const invalidData = {
      email: 'invalid-email',
      password: ''
    };

    const { error } = validationUtils.validateLogin(invalidData);
    expect(error).toBeDefined();
  });
});