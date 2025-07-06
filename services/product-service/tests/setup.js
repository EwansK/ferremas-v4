// Test setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:testpassword@localhost:5433/ferremas_test';

// Global test timeout
jest.setTimeout(10000);