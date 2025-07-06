# Database Setup for Ferremas E-commerce

This document explains how to set up the PostgreSQL database for the Ferremas e-commerce application.

## Prerequisites

- PostgreSQL 12+ installed and running
- Access to a PostgreSQL database (local or AWS RDS)
- Node.js and npm installed for testing connectivity

## Environment Variables

Create a `.env` file in the root directory with your database configuration:

```bash
# Database Connection
DATABASE_URL=postgresql://username:password@host:port/database
# OR use individual variables:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ferremas
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets (for later use)
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
```

## Database Setup Steps

### 1. Create the Database

If using a local PostgreSQL installation:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create the database
CREATE DATABASE ferremas;

-- Create a user for the application (optional)
CREATE USER ferremas_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ferremas TO ferremas_user;
```

### 2. Run the Schema

Apply the database schema:

```bash
# If using local PostgreSQL
psql -U postgres -d ferremas -f database-schema.sql

# If using specific user
psql -U ferremas_user -d ferremas -f database-schema.sql

# If using connection string
psql "postgresql://username:password@host:port/database" -f database-schema.sql
```

### 3. Insert Sample Data

Load sample data for testing:

```bash
# Same connection method as schema
psql -U postgres -d ferremas -f sample-data.sql
```

### 4. Test Connection

Test the database connection:

```bash
# Install dependencies first
npm install pg dotenv

# Run the connection test
node test-db-connection.js
```

## Database Schema Overview - Simplified Version

The database includes these core tables:

### Core Tables
- **roles** - Role definitions (admin, manager, customer)
- **users** - User accounts with role references
- **user_sessions** - JWT session management

### Product Management
- **categories** - Product categories (simple flat structure)
- **products** - Product catalog with CLP pricing and local image links

### E-commerce Features
- **cart_items** - Shopping cart functionality
- **orders** - Order management
- **order_items** - Individual order line items

## Sample Data Included

The sample data includes:

### Roles
- **admin** - Administrator role
- **manager** - Manager role  
- **customer** - Customer role

### Users
- **admin@ferremas.cl** - Admin user (password: password123)
- **manager@ferremas.cl** - Manager user (password: password123)
- **cliente1@gmail.com** - Customer (password: password123)
- **cliente2@gmail.com** - Customer (password: password123)

### Categories
- Herramientas Manuales
- Herramientas Eléctricas
- Materiales de Construcción
- Ferretería
- Jardín y Exterior

### Products
- Martillo de Carpintero 16oz - $12,990 CLP
- Taladro Inalámbrico 18V - $89,990 CLP
- Set de Destornilladores 6 Piezas - $8,990 CLP
- Sierra Circular 7 1/4" - $79,990 CLP
- Llave Inglesa Ajustable 10" - $15,990 CLP
- Cemento Portland 25kg - $4,590 CLP
- Tornillos Autorroscantes x100 - $2,990 CLP
- Pala de Jardín - $12,990 CLP

## Using the Database Module

The shared database module provides:

### Connection Management
```typescript
import { dbConnection } from './shared/database';

// Connect to database
await dbConnection.connect();

// Execute queries
const result = await dbConnection.query('SELECT * FROM products');

// Use transactions
await dbConnection.transaction(async (client) => {
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
});
```

### Database Utils
```typescript
import { DatabaseUtils } from './shared/database';

// Find by ID
const product = await DatabaseUtils.findById<Product>('products', productId);

// Create record
const newProduct = await DatabaseUtils.create<Product>('products', productData);

// Update record
const updated = await DatabaseUtils.update<Product>('products', id, updateData);

// Paginated queries
const products = await DatabaseUtils.findMany<Product>('products', {}, {
  limit: 20,
  offset: 0,
  orderBy: 'created_at',
  orderDirection: 'DESC'
});
```

## Troubleshooting

### Connection Issues

1. **Connection refused**: Make sure PostgreSQL is running
2. **Authentication failed**: Check username/password
3. **Database does not exist**: Create the database first
4. **Permission denied**: Make sure user has proper privileges

### Common Commands

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Connect to PostgreSQL
psql -U postgres

# List databases
\l

# Connect to database
\c ferremas

# List tables
\dt

# Describe table structure
\d table_name

# Exit psql
\q
```

## AWS RDS Setup

If using AWS RDS:

1. Create PostgreSQL RDS instance
2. Configure security groups to allow connections
3. Use RDS endpoint as DB_HOST
4. Use master username and password
5. Ensure RDS is publicly accessible if connecting from local development

## Next Steps

After setting up the database:

1. Set up the microservices (auth, product, manager, admin, cart, conversion)
2. Configure the API Gateway
3. Build the frontend application
4. Test the complete application

## Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Enable SSL connections in production
- Regularly backup your database
- Monitor database performance and logs