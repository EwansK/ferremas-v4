# 🧪 Ferremas E-commerce Testing Plan

This document provides comprehensive testing instructions for the Ferremas e-commerce platform, including manual testing procedures and automated test suites.

## 📋 Table of Contents
1. [Testing Overview](#testing-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Manual Testing Guide](#manual-testing-guide)
4. [Automated Testing](#automated-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)
7. [API Testing](#api-testing)
8. [Database Testing](#database-testing)
9. [End-to-End Testing](#end-to-end-testing)
10. [Test Data Management](#test-data-management)

---

## Testing Overview

### Testing Pyramid
```
    /\
   /E2E\     ← End-to-End Tests (Few, High Confidence)
  /______\
 /  API   \   ← Integration Tests (Some, Medium Confidence)
/__________\
/   Unit    \ ← Unit Tests (Many, Fast, Low Level)
```

### Testing Types Covered
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Service interactions and API endpoints
- **End-to-End Tests**: Complete user workflows
- **Performance Tests**: Load and stress testing
- **Security Tests**: Authentication, authorization, and data validation

### Test Coverage Goals
- **Unit Tests**: 80%+ code coverage
- **API Tests**: 100% endpoint coverage
- **E2E Tests**: Critical user journeys
- **Security Tests**: All authentication flows

---

## Test Environment Setup

### Prerequisites
```bash
# Ensure you have the following installed
node --version    # v18+
npm --version     # v8+
docker --version  # v20+
```

### Environment Configuration

#### 1. Test Database Setup
```bash
# Create test environment file
cp .env.example .env.test

# Edit test environment
nano .env.test
```

**`.env.test` Configuration:**
```bash
# Test Database (separate from development)
DATABASE_URL=postgresql://postgres:testpassword@localhost:5433/ferremas_test
DB_HOST=localhost
DB_PORT=5433
DB_NAME=ferremas_test
DB_USER=postgres
DB_PASSWORD=testpassword

# Test JWT Secrets
JWT_SECRET=test-jwt-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key

# Test Service Ports
API_GATEWAY_PORT=4000
AUTH_SERVICE_PORT=4001
PRODUCT_SERVICE_PORT=4002
MANAGER_SERVICE_PORT=4003
ADMIN_SERVICE_PORT=4004

NODE_ENV=test
```

#### 2. Test Docker Compose
Create `docker-compose.test.yml`:
```yaml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: ferremas_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: testpassword
    ports:
      - "5433:5432"
    volumes:
      - test_postgres_data:/var/lib/postgresql/data

volumes:
  test_postgres_data:
```

#### 3. Start Test Environment
```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Initialize test database
psql -h localhost -p 5433 -U postgres -d ferremas_test -f database-schema.sql
psql -h localhost -p 5433 -U postgres -d ferremas_test -f sample-data.sql
```

---

## Manual Testing Guide

### 🔐 Authentication Testing

#### Test Case 1: User Registration
**Objective**: Verify new users can register successfully

**Steps**:
1. Navigate to `http://localhost:3001/auth/register`
2. Fill in registration form:
   - Name: "Test User"
   - Last Name: "Testing"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Register"

**Expected Results**:
- ✅ User should be redirected to dashboard
- ✅ Success message displayed
- ✅ User should be automatically logged in
- ✅ JWT tokens should be stored in cookies

**Test Data**:
```json
{
  "valid": {
    "name": "Test User",
    "lastname": "Testing",
    "email": "test@example.com",
    "password": "password123"
  },
  "invalid": {
    "email": "invalid-email",
    "password": "123",
    "name": "",
    "lastname": ""
  }
}
```

#### Test Case 2: User Login
**Objective**: Verify existing users can login

**Steps**:
1. Navigate to `http://localhost:3001/auth/login`
2. Enter credentials:
   - Email: "admin@ferremas.cl"
   - Password: "password123"
3. Click "Login"

**Expected Results**:
- ✅ Successful login
- ✅ Redirect to appropriate dashboard based on role
- ✅ User menu shows correct user info

#### Test Case 3: Role-Based Access
**Objective**: Verify different user roles have appropriate access

**Test Scenarios**:

| Role | Can Access | Cannot Access |
|------|------------|---------------|
| Customer | Products, Cart, Orders | Admin Panel, Manager Panel |
| Manager | Products, Inventory, Categories | Admin Panel, User Management |
| Admin | All Areas | - |

### 🛒 E-commerce Functionality Testing

#### Test Case 4: Product Browsing
**Steps**:
1. Navigate to `http://localhost:3001`
2. Browse product categories
3. Search for products
4. View product details
5. Filter products by category/price

**Expected Results**:
- ✅ Products load correctly
- ✅ Search returns relevant results
- ✅ Filters work properly
- ✅ Product images display
- ✅ Prices shown in CLP

#### Test Case 5: Shopping Cart
**Steps**:
1. Add products to cart
2. Modify quantities
3. Remove items
4. View cart total
5. Proceed to checkout

**Expected Results**:
- ✅ Cart updates correctly
- ✅ Quantities persist between sessions
- ✅ Total calculations are accurate
- ✅ Cart icon shows item count

#### Test Case 6: Order Management
**Steps**:
1. Complete an order
2. View order history
3. Check order status
4. View order details

**Expected Results**:
- ✅ Order is created successfully
- ✅ Order appears in history
- ✅ Status updates correctly
- ✅ Email confirmation sent (if configured)

### 👨‍💼 Manager Functionality Testing

#### Test Case 7: Product Management
**Steps** (as Manager):
1. Login as manager@ferremas.cl
2. Navigate to manager dashboard
3. Create new product
4. Edit existing product
5. Update inventory
6. Delete product

**Expected Results**:
- ✅ Products can be created/edited/deleted
- ✅ Inventory updates reflect immediately
- ✅ Form validation works
- ✅ Images can be uploaded

#### Test Case 8: Category Management
**Steps** (as Manager):
1. Create new category
2. Edit category name
3. Assign products to category
4. Delete category (if no products)

**Expected Results**:
- ✅ Categories manage correctly
- ✅ Product assignments work
- ✅ Cannot delete category with products

### 👑 Admin Functionality Testing

#### Test Case 9: User Management
**Steps** (as Admin):
1. Login as admin@ferremas.cl
2. Navigate to admin → users
3. View user list
4. Edit user information
5. Activate/deactivate users
6. Change user roles

**Expected Results**:
- ✅ User list loads with pagination
- ✅ Edit functionality works
- ✅ Status changes take effect
- ✅ Role changes applied correctly

### 📱 Responsive Design Testing

#### Test Case 10: Mobile Compatibility
**Devices to Test**:
- iPhone (375px width)
- Android (360px width)
- Tablet (768px width)
- Desktop (1200px+ width)

**Areas to Test**:
- Navigation menu
- Product grid
- Forms
- Cart functionality
- Admin panels

### 🔍 Error Handling Testing

#### Test Case 11: Network Errors
**Steps**:
1. Disconnect internet
2. Try to perform actions
3. Reconnect internet
4. Verify recovery

**Expected Results**:
- ✅ Appropriate error messages
- ✅ Graceful degradation
- ✅ Auto-retry mechanisms work

#### Test Case 12: Invalid Data
**Steps**:
1. Submit forms with invalid data
2. Try unauthorized actions
3. Access non-existent resources

**Expected Results**:
- ✅ Validation errors shown
- ✅ 401/403 errors handled
- ✅ 404 pages displayed

---

## Automated Testing

### Unit Tests Setup

#### Install Testing Dependencies
```bash
# For each service, install testing packages
cd services/auth-service
npm install --save-dev jest supertest @types/jest

cd ../product-service
npm install --save-dev jest supertest @types/jest

cd ../manager-service
npm install --save-dev jest supertest @types/jest

cd ../admin-service
npm install --save-dev jest supertest @types/jest

# For frontend
cd ../../frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

### Running All Tests
```bash
# Run all tests across the project
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npm run test:auth
npm run test:products
npm run test:frontend
```

### Test Scripts Configuration

Add to root `package.json`:
```json
{
  "scripts": {
    "test:all": "npm run test:auth && npm run test:products && npm run test:manager && npm run test:admin && npm run test:frontend",
    "test:auth": "cd services/auth-service && npm test",
    "test:products": "cd services/product-service && npm test",
    "test:manager": "cd services/manager-service && npm test",
    "test:admin": "cd services/admin-service && npm test",
    "test:frontend": "cd frontend && npm test",
    "test:coverage": "npm run test:all -- --coverage",
    "test:e2e": "cd e2e-tests && npm test"
  }
}
```

---

## Performance Testing

### Load Testing with Artillery

#### Install Artillery
```bash
npm install -g artillery
```

#### Create Load Test Configuration
Create `performance-tests/load-test.yml`:
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
  variables:
    emails:
      - "test1@example.com"
      - "test2@example.com"
      - "admin@ferremas.cl"
    passwords:
      - "password123"

scenarios:
  - name: "Authentication Flow"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ emails.random() }}"
            password: "{{ passwords.random() }}"
      - think: 2

  - name: "Product Browsing"
    weight: 50
    flow:
      - get:
          url: "/api/products"
      - think: 1
      - get:
          url: "/api/products/{{ $randomString() }}"
      - think: 2

  - name: "Cart Operations"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test1@example.com"
            password: "password123"
      - post:
          url: "/api/cart/add"
          json:
            productId: "850e8400-e29b-41d4-a716-446655440001"
            quantity: 1
      - get:
          url: "/api/cart"
```

#### Run Load Tests
```bash
# Basic load test
artillery run performance-tests/load-test.yml

# Generate HTML report
artillery run performance-tests/load-test.yml --output report.json
artillery report report.json
```

### Performance Metrics to Monitor
- **Response Time**: < 500ms for API calls
- **Throughput**: > 100 requests/second
- **Error Rate**: < 1%
- **Memory Usage**: < 80% of available
- **CPU Usage**: < 70% under normal load

---

## Security Testing

### Authentication Security Tests

#### Test Case: JWT Token Security
```bash
# Test token expiration
curl -H "Authorization: Bearer expired_token" http://localhost:3000/api/auth/profile

# Test token manipulation
curl -H "Authorization: Bearer invalid_token" http://localhost:3000/api/auth/profile
```

#### Test Case: SQL Injection Prevention
```bash
# Test login endpoint with SQL injection
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ferremas.cl'\'' OR 1=1--","password":"anything"}'
```

#### Test Case: XSS Prevention
```bash
# Test product creation with XSS payload
curl -X POST http://localhost:3000/api/manager/products \
  -H "Authorization: Bearer valid_token" \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(\"XSS\")</script>","price":100}'
```

### Security Checklist
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Password hashing
- ✅ JWT token security
- ✅ Role-based access control

---

## API Testing

### Postman Collection

Create `api-tests/ferremas-api.postman_collection.json` with comprehensive API tests:

#### Authentication Endpoints
```json
{
  "name": "Auth - Login",
  "request": {
    "method": "POST",
    "url": "{{baseUrl}}/api/auth/login",
    "body": {
      "mode": "raw",
      "raw": "{\n  \"email\": \"admin@ferremas.cl\",\n  \"password\": \"password123\"\n}"
    }
  },
  "tests": [
    "pm.test(\"Status code is 200\", function () {",
    "    pm.response.to.have.status(200);",
    "});",
    "pm.test(\"Response has tokens\", function () {",
    "    const jsonData = pm.response.json();",
    "    pm.expect(jsonData.data.tokens).to.have.property('accessToken');",
    "});"
  ]
}
```

### API Test Commands
```bash
# Run Postman tests via Newman
npm install -g newman
newman run api-tests/ferremas-api.postman_collection.json

# Run with environment
newman run api-tests/ferremas-api.postman_collection.json \
  -e api-tests/test-environment.json \
  --reporters html \
  --reporter-html-export api-test-report.html
```

---

## Database Testing

### Database Test Scenarios

#### Test Case: Data Integrity
```sql
-- Test foreign key constraints
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_clp) 
VALUES ('test-1', 'non-existent-order', 'non-existent-product', 1, 100);

-- Test data validation
INSERT INTO users (name, lastname, email, password_hash, role_id) 
VALUES ('', '', 'invalid-email', 'weak', 'invalid-role');
```

#### Test Case: Performance
```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 'category-1';

-- Test index usage
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'admin@ferremas.cl';
```

### Database Testing Tools
```bash
# Install pgTAP for PostgreSQL testing
sudo apt-get install postgresql-contrib

# Run database tests
psql -d ferremas_test -f database-tests/test-suite.sql
```

---

## End-to-End Testing

### Cypress E2E Tests

#### Install Cypress
```bash
mkdir e2e-tests
cd e2e-tests
npm init -y
npm install --save-dev cypress
```

#### Cypress Configuration
Create `e2e-tests/cypress.config.js`:
```javascript
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
```

### E2E Test Scenarios

#### Critical User Journeys
1. **Customer Purchase Flow**
2. **Manager Product Management**
3. **Admin User Management**
4. **Authentication Flows**

### Running E2E Tests
```bash
# Open Cypress Test Runner
npx cypress open

# Run tests headlessly
npx cypress run

# Run specific test
npx cypress run --spec "cypress/e2e/auth.cy.js"
```

---

## Test Data Management

### Test Data Setup
```bash
# Create test data script
node scripts/generate-test-data.js

# Clean test data
node scripts/clean-test-data.js

# Reset to initial state
node scripts/reset-test-environment.js
```

### Test Users
```json
{
  "admin": {
    "email": "admin@ferremas.cl",
    "password": "password123",
    "role": "admin"
  },
  "manager": {
    "email": "manager@ferremas.cl", 
    "password": "password123",
    "role": "manager"
  },
  "customer": {
    "email": "customer@test.com",
    "password": "password123", 
    "role": "customer"
  }
}
```

---

## Test Reporting

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Test Results Dashboard
- **Unit Tests**: Jest HTML reporter
- **E2E Tests**: Cypress Dashboard
- **API Tests**: Newman HTML reports
- **Performance**: Artillery reports

### CI/CD Integration
```yaml
# GitHub Actions example
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm run test:all
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

---

## 🎯 Test Execution Checklist

### Before Each Release
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Security tests pass
- [ ] Performance tests meet benchmarks
- [ ] Manual smoke tests completed
- [ ] Test coverage > 80%
- [ ] No critical security vulnerabilities

### Daily Testing (CI/CD)
- [ ] Unit tests on every commit
- [ ] Integration tests on PR
- [ ] Smoke tests on deployment
- [ ] Security scans weekly

### Testing Best Practices
- ✅ Write tests before fixing bugs
- ✅ Keep tests simple and focused
- ✅ Use meaningful test names
- ✅ Mock external dependencies
- ✅ Test edge cases and error conditions
- ✅ Maintain test data separately
- ✅ Regular test maintenance and cleanup

---

---

## 🚀 Quick Start Testing Guide

### 1. Install All Test Dependencies
```bash
# Install dependencies for all services
npm run test:install
```

### 2. Setup Test Environment
```bash
# Start test database
npm run test:setup

# Generate test data
node scripts/generate-test-data.js
```

### 3. Run All Tests
```bash
# Run all unit and integration tests
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### 4. Individual Test Commands
```bash
# Run specific service tests
npm run test:auth          # Authentication service
npm run test:products      # Product service  
npm run test:manager       # Manager service
npm run test:admin         # Admin service
npm run test:frontend      # React frontend

# Run E2E tests in interactive mode
npm run test:e2e:open
```

### 5. Test Data Management
```bash
# Clean test data
node scripts/clean-test-data.js

# Reset test environment
npm run test:teardown
npm run test:setup
node scripts/generate-test-data.js
```

## 📊 Test Coverage Goals

| Component | Unit Tests | Integration Tests | E2E Tests | Coverage Target |
|-----------|------------|-------------------|-----------|-----------------|
| Auth Service | ✅ | ✅ | ✅ | 80%+ |
| Product Service | ✅ | ✅ | ✅ | 80%+ |
| Manager Service | ✅ | ✅ | ✅ | 80%+ |
| Admin Service | ✅ | ✅ | ✅ | 80%+ |
| Frontend Components | ✅ | ✅ | ✅ | 70%+ |
| API Endpoints | ✅ | ✅ | ✅ | 100% |

## 🔧 Test Files Created

### Unit Tests
- `services/auth-service/tests/auth.test.js` - Authentication logic
- `services/product-service/tests/products.test.js` - Product management
- `frontend/__tests__/components/ProductCard.test.tsx` - Product card component
- `frontend/__tests__/components/UserEditForm.test.tsx` - User edit form

### E2E Tests
- `e2e-tests/cypress/e2e/auth.cy.js` - Authentication flows
- `e2e-tests/cypress/e2e/ecommerce.cy.js` - Shopping and cart flows
- `e2e-tests/cypress/e2e/admin.cy.js` - Admin panel functionality

### Test Configuration
- Jest configurations for all services
- Cypress configuration for E2E tests
- Test database setup with Docker
- Custom Cypress commands for common operations

### Test Data
- `scripts/generate-test-data.js` - Generate test users, products, orders
- `scripts/clean-test-data.js` - Clean up test data
- Test accounts with different roles and permissions

## 🎯 Continuous Integration

Add this GitHub Actions workflow to `.github/workflows/test.yml`:

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: ferremas_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5433:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm run test:install
      
      - name: Setup test database
        run: |
          psql -h localhost -p 5433 -U postgres -d ferremas_test -f database-schema.sql
          node scripts/generate-test-data.js
        env:
          PGPASSWORD: testpassword
          TEST_DATABASE_URL: postgresql://postgres:testpassword@localhost:5433/ferremas_test
      
      - name: Run unit tests
        run: npm run test:all
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_DATABASE_URL: postgresql://postgres:testpassword@localhost:5433/ferremas_test
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

**🚀 Happy Testing!** This comprehensive testing plan ensures your Ferremas e-commerce platform is reliable, secure, and performant.

### 📞 Support & Resources
- **Jest Documentation**: [jestjs.io](https://jestjs.io)
- **Cypress Documentation**: [docs.cypress.io](https://docs.cypress.io)
- **Testing Library**: [testing-library.com](https://testing-library.com)
- **GitHub Issues**: Create issues for test failures or improvements