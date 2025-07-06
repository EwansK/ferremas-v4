# Ferremas E-commerce Implementation Plan

## Project Overview
Build a complete e-commerce web application for Ferremas hardware store using microservices architecture. This is a college assignment focused on learning modern web development practices.

## Tech Stack
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Express.js microservices with TypeScript
- **Database**: PostgreSQL (AWS RDS - already configured)
- **Image Storage**: Local file system in uploads/ directory
- **Authentication**: JWT tokens
- **API Gateway**: Express.js gateway service
- **Package Manager**: npm

## Project Structure
```
ferremas-ecommerce/
├── frontend/                     # Next.js application
├── api-gateway/                  # API Gateway service (Port 3000)
├── services/
│   ├── auth-service/            # Authentication service (Port 3001)
│   ├── product-service/         # Product display service (Port 3002)
│   ├── manager-service/         # Product CRUD service (Port 3003)
│   ├── admin-service/           # Employee management service (Port 3004)
│   ├── cart-service/            # Shopping cart service (Port 3005)
│   └── conversion-service/      # Currency conversion service (Port 3006)
├── shared/
│   ├── database/                # Database connection and models
│   ├── middleware/              # Shared middleware (auth, validation)
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Shared utilities
├── uploads/                     # Local image storage
├── package.json                 # Root package.json for workspace
└── README.md
```

## Architecture
```
Frontend (Next.js)
    ↓ HTTP requests
API Gateway (:3000)
    ↓ Direct HTTP calls to services
┌─────────────────┬─────────────────┬─────────────────┐
│  Auth Service   │ Product Service │ Manager Service │
│    (:3001)      │    (:3002)      │    (:3003)      │
├─────────────────┼─────────────────┼─────────────────┤
│  Admin Service  │  Cart Service   │Conversion Service│
│    (:3004)      │    (:3005)      │    (:3006)      │
└─────────────────┴─────────────────┴─────────────────┘
    ↓ Direct database connections
PostgreSQL Database (AWS RDS)
```

## Database Schema
Use the provided PostgreSQL schema with these key tables:
- `users` (customers, managers, admins with role-based access)
- `user_sessions` (JWT session management)
- `employees` (additional employee information)
- `categories` (3-level hierarchy: Herramientas → Herramientas Manuales → Martillos)
- `products` (hardware store products with CLP pricing)
- `product_images` (image URLs pointing to local uploads/)
- `product_attributes` (flexible product specifications)
- `cart_items` (shopping cart functionality)
- `orders` and `order_items` (order management)
- `exchange_rates` (CLP to USD conversion cache)
- `activity_logs` (audit trail for admin actions)

## Phase 1: Foundation Setup

### 1.1 Project Initialization
- Create root directory structure
- Set up npm workspace with root package.json
- Initialize TypeScript configuration for all services
- Install shared dependencies: express, pg, bcrypt, jsonwebtoken, multer, cors
- Set up ESLint and Prettier

### 1.2 Shared Components
Create in `/shared` directory:
- Database connection module using node-postgres (pg)
- JWT utilities (generate, verify, refresh tokens)
- Authentication middleware for protecting routes
- Input validation middleware using Joi
- Error handling utilities with consistent error responses
- Logging utilities for development

### 1.3 Database Setup
- Connect to existing AWS PostgreSQL database
- Run the provided schema and sample data
- Test database connectivity from all services

## Phase 2: Authentication Service (Port 3001)

### 2.1 Endpoints
- `POST /auth/register` - User registration with role assignment (customer, manager, admin)
- `POST /auth/login` - User login returning JWT access and refresh tokens
- `POST /auth/logout` - Token invalidation and session cleanup
- `POST /auth/refresh` - Generate new access token from refresh token
- `GET /auth/verify` - Token verification (used by API Gateway)
- `GET /auth/profile` - Get current user profile information

### 2.2 Implementation Details
- Password hashing with bcrypt (salt rounds: 12)
- JWT access tokens (15-minute expiry)
- JWT refresh tokens (7-day expiry)
- Session tracking in `user_sessions` table
- Role-based response data (different info for customer vs admin)
- Input validation for email format, password strength

**Database Tables**: `users`, `user_sessions`

## Phase 3: Product Service (Port 3002)

### 3.1 Endpoints (Public - No Authentication Required)
- `GET /products` - Paginated product list with filters (category, price range, search)
- `GET /products/:id` - Single product with images, attributes, and stock info
- `GET /products/search?q=term` - Full-text search in product names and descriptions
- `GET /products/category/:categoryId` - Products filtered by category
- `GET /categories` - Complete category hierarchy with product counts
- `GET /categories/:id/children` - Get direct child categories

### 3.2 Implementation Details
- Pagination: limit (default 20), offset parameters
- Search: PostgreSQL full-text search with Spanish language support
- Category navigation: breadcrumb data included in responses
- Product images: return array of image URLs from uploads/ directory
- Price display: always in CLP, include USD conversion hint
- Stock status: in_stock boolean based on stock_quantity > 0

**Database Tables**: `products`, `categories`, `product_images`, `product_attributes`

## Phase 4: Manager Service (Port 3003)

### 4.1 Endpoints (Manager/Admin Authentication Required)
- `POST /products` - Create product with image upload (multipart/form-data)
- `PUT /products/:id` - Update product information and add/remove images
- `DELETE /products/:id` - Soft delete product (set is_active = false)
- `POST /products/:id/images` - Upload additional images for existing product
- `DELETE /products/images/:imageId` - Remove specific product image
- `POST /categories` - Create new category with parent relationship
- `PUT /categories/:id` - Update category information
- `GET /products/inventory` - Inventory view with low stock alerts
- `PUT /products/:id/stock` - Update stock quantity

### 4.2 Image Upload Implementation
- Use multer middleware for file handling
- Store images in `uploads/products/{productId}/` directory
- Generate filenames: `{timestamp}-{originalname}`
- Save image URLs in database: `/uploads/products/{productId}/filename.jpg`
- Support multiple images per product with is_primary flag
- File size limit: 5MB per image
- Allowed formats: jpg, jpeg, png, webp

### 4.3 Authorization
- Verify JWT token through API Gateway
- Check user role: only manager or admin allowed
- Log all CRUD operations in activity_logs table

**Database Tables**: `products`, `categories`, `product_images`, `activity_logs`

## Phase 5: Cart Service (Port 3005)

### 5.1 Endpoints (Authenticated Users)
- `GET /cart` - Get user's current cart with product details and totals
- `POST /cart/items` - Add product to cart with quantity
- `PUT /cart/items/:cartItemId` - Update quantity of existing cart item
- `DELETE /cart/items/:cartItemId` - Remove specific item from cart
- `DELETE /cart` - Clear entire cart
- `GET /cart/total` - Get cart totals in CLP and USD

### 5.2 Implementation Details
- User identification through JWT token user_id
- Validate product exists and has sufficient stock
- Update existing cart item if product already in cart
- Calculate totals including individual item totals
- Include product information in cart responses
- Handle out-of-stock scenarios

**Database Tables**: `cart_items`, `products`

## Phase 6: Conversion Service (Port 3006)

### 6.1 Endpoints (Public Access)
- `GET /conversion/rate` - Current CLP to USD exchange rate
- `POST /conversion/convert` - Convert amount between CLP and USD
- `GET /conversion/products/:id` - Get product price in USD
- `POST /conversion/cart` - Convert cart total to USD

### 6.2 Implementation Details
- Cache exchange rates in `exchange_rates` table
- Update rates daily from free API (exchangerate-api.com or fixer.io)
- Fallback to manual rate (1 USD = 800 CLP) if API fails
- Cache expiry: 24 hours
- Support conversion in both directions (CLP→USD, USD→CLP)

**Database Tables**: `exchange_rates`

## Phase 7: Admin Service (Port 3004)

### 7.1 Endpoints (Admin Authentication Only)
- `GET /employees` - List all employees with user information
- `POST /employees` - Create new employee account
- `PUT /employees/:id` - Update employee information
- `DELETE /employees/:id` - Deactivate employee (soft delete)
- `PUT /users/:id/role` - Change user role (customer ↔ manager ↔ admin)
- `GET /analytics/dashboard` - Dashboard data (product counts, user counts, etc.)
- `GET /logs/activity` - Recent activity logs for audit

### 7.2 Implementation Details
- Strict admin-only access control
- Employee creation also creates user account
- Role changes logged in activity_logs
- Dashboard includes: total products, total users, low stock items, recent activity
- Activity logs with pagination and filtering

**Database Tables**: `employees`, `users`, `activity_logs`

## Phase 8: API Gateway (Port 3000)

### 8.1 Core Functionality
- Route incoming requests to appropriate microservices
- Handle authentication by calling auth-service /verify endpoint
- Serve static files from uploads/ directory
- Apply CORS headers for frontend communication
- Request/response logging for debugging
- Error handling with consistent response format

### 8.2 Routing Configuration
```javascript
// Route mapping
'/auth/*' → http://localhost:3001 (auth-service)
'/products/*' → http://localhost:3002 (product-service)
'/manager/*' → http://localhost:3003 (manager-service)
'/admin/*' → http://localhost:3004 (admin-service)
'/cart/*' → http://localhost:3005 (cart-service)
'/conversion/*' → http://localhost:3006 (conversion-service)
'/uploads/*' → serve static files from uploads/ directory
```

### 8.3 Authentication Middleware
- Extract JWT token from Authorization header
- Call auth-service to verify token
- Add user information to request headers for downstream services
- Handle token refresh automatically
- Skip authentication for public routes (products, conversion, auth endpoints)

### 8.4 Protected Routes
- `/manager/*` - requires manager or admin role
- `/admin/*` - requires admin role only
- `/cart/*` - requires any authenticated user

## Phase 9: Frontend Application (Next.js)

### 9.1 Pages
- `/` - Home page with featured products and category navigation
- `/products` - Product listing with search, filters, and pagination
- `/products/[id]` - Product detail page with image gallery
- `/category/[slug]` - Category-specific product listing
- `/cart` - Shopping cart with quantity controls and checkout
- `/login` - User authentication form
- `/register` - User registration form
- `/manager` - Manager dashboard for product management
- `/manager/products/new` - Create new product form
- `/manager/products/[id]/edit` - Edit product form
- `/admin` - Admin dashboard with analytics and user management

### 9.2 Key Components
- `ProductCard` - Reusable product display with image, price, add to cart
- `ProductGrid` - Grid layout for product listings
- `CategoryNavigation` - Hierarchical category menu
- `SearchBar` - Product search with autocomplete
- `Cart` - Shopping cart sidebar/page with totals
- `ProductForm` - Form for creating/editing products with image upload
- `ImageUpload` - Drag-and-drop image upload component
- `AuthGuard` - Route protection based on user role
- `CurrencyToggle` - Switch between CLP and USD display

### 9.3 State Management
- React Context for authentication state
- React Context for cart state
- Local state for form management
- API client with automatic token refresh

### 9.4 Features
- Responsive design using Tailwind CSS
- Product search with real-time results
- Category filtering with breadcrumb navigation
- Shopping cart with persistence
- Image upload with preview
- Role-based page access
- Currency conversion toggle (CLP/USD)
- Spanish language interface
- Loading states and error handling

### 9.5 API Integration
Create API client that:
- Makes requests to API Gateway (http://localhost:3000)
- Handles authentication tokens
- Provides methods for all CRUD operations
- Manages loading and error states
- Automatically refreshes expired tokens

## Phase 10: Integration and Testing

### 10.1 Service Startup
1. Start PostgreSQL database (AWS RDS)
2. Start all microservices (ports 3001-3006)
3. Start API Gateway (port 3000)
4. Start frontend application (port 3001)

### 10.2 Test Scenarios
- User registration and login flow
- Product browsing and search
- Manager creating products with images
- Admin managing employees and viewing logs
- Shopping cart functionality
- Currency conversion
- Role-based access control
- Image upload and display

## Environment Configuration

### Required Environment Variables
```bash
# Database connection
DATABASE_URL=postgresql://username:password@host:port/database

# JWT secrets
JWT_SECRET=your-secret-key-for-access-tokens
JWT_REFRESH_SECRET=your-secret-key-for-refresh-tokens

# Service ports (default values)
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
MANAGER_SERVICE_PORT=3003
ADMIN_SERVICE_PORT=3004
CART_SERVICE_PORT=3005
CONVERSION_SERVICE_PORT=3006

# File upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880  # 5MB in bytes

# External API for currency conversion
EXCHANGE_RATE_API_KEY=your-api-key-here
```

## Development Workflow

### Starting the Application
1. Install dependencies: `npm install` in root directory
2. Set up environment variables in each service
3. Run database migrations/schema
4. Start services in order:
   ```bash
   # Terminal 1: Auth Service
   cd services/auth-service && npm run dev
   
   # Terminal 2: Product Service  
   cd services/product-service && npm run dev
   
   # Terminal 3: Manager Service
   cd services/manager-service && npm run dev
   
   # Terminal 4: Admin Service
   cd services/admin-service && npm run dev
   
   # Terminal 5: Cart Service
   cd services/cart-service && npm run dev
   
   # Terminal 6: Conversion Service
   cd services/conversion-service && npm run dev
   
   # Terminal 7: API Gateway
   cd api-gateway && npm run dev
   
   # Terminal 8: Frontend
   cd frontend && npm run dev
   ```

### File Structure for Each Service
```
service-name/
├── src/
│   ├── routes/          # Express route handlers
│   ├── controllers/     # Business logic
│   ├── middleware/      # Service-specific middleware
│   └── index.ts         # Service entry point
├── package.json
├── tsconfig.json
└── .env
```

## Success Criteria
- All 6 microservices running independently
- API Gateway routing requests correctly
- User authentication and role-based authorization working
- Product CRUD operations functional for managers
- Shopping cart persisting items correctly
- Currency conversion displaying accurate USD prices
- Image upload storing files and serving URLs
- Admin dashboard showing system information
- Frontend displaying all data correctly
- Spanish language interface throughout
- Responsive design working on mobile and desktop

## Key Implementation Notes

### Database Connections
- Each service connects directly to PostgreSQL
- Use connection pooling (pg.Pool) for performance
- Handle connection errors gracefully

### Error Handling
- Consistent error response format across all services
- Proper HTTP status codes (400, 401, 403, 404, 500)
- Input validation with descriptive error messages

### Authentication Flow
1. User logs in via frontend
2. Frontend sends credentials to API Gateway
3. API Gateway forwards to auth-service
4. Auth-service validates and returns JWT tokens
5. Frontend stores tokens and includes in subsequent requests
6. API Gateway validates tokens before forwarding requests

### Image Upload Flow
1. Manager uploads image via frontend form
2. Frontend sends multipart/form-data to API Gateway
3. API Gateway forwards to manager-service
4. Manager-service saves file to uploads/ directory
5. Manager-service stores URL in database
6. API Gateway serves images as static files

This plan provides everything needed to build a complete, functional e-commerce application demonstrating microservices architecture, authentication, file uploads, and modern web development practices.