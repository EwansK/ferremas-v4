const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function createTablesForPgAdmin() {
  // Use the exact same connection as pgAdmin would use
  const config = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };

  console.log('🔗 Connecting with:', process.env.DATABASE_URL);

  const pool = new Pool(config);

  try {
    console.log('🚀 Creating tables for pgAdmin...');
    
    // First, let's check what's currently there
    console.log('🔍 Checking current database state...');
    
    const dbCheck = await pool.query('SELECT current_database(), current_schema(), current_user');
    console.log('Database:', dbCheck.rows[0].current_database);
    console.log('Schema:', dbCheck.rows[0].current_schema);
    console.log('User:', dbCheck.rows[0].current_user);
    
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Existing tables:', tablesCheck.rows.map(r => r.table_name));
    
    // Drop existing tables if they exist (in correct order due to foreign keys)
    console.log('🧹 Cleaning up existing tables...');
    const dropQueries = [
      'DROP TABLE IF EXISTS order_items CASCADE;',
      'DROP TABLE IF EXISTS orders CASCADE;',
      'DROP TABLE IF EXISTS cart_items CASCADE;',
      'DROP TABLE IF EXISTS user_sessions CASCADE;',
      'DROP TABLE IF EXISTS products CASCADE;',
      'DROP TABLE IF EXISTS categories CASCADE;',
      'DROP TABLE IF EXISTS users CASCADE;',
      'DROP TABLE IF EXISTS roles CASCADE;'
    ];
    
    for (const dropQuery of dropQueries) {
      try {
        await pool.query(dropQuery);
      } catch (error) {
        // Ignore errors for non-existent tables
      }
    }
    
    // Create the extension first
    console.log('🔧 Creating UUID extension...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // Create each table individually
    console.log('📋 Creating tables...');
    
    // 1. Roles table
    await pool.query(`
      CREATE TABLE roles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          role_name VARCHAR(50) UNIQUE NOT NULL
      );
    `);
    console.log('✅ Created roles table');
    
    // 2. Users table
    await pool.query(`
      CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL,
          lastname VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created users table');
    
    // 3. Categories table
    await pool.query(`
      CREATE TABLE categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL
      );
    `);
    console.log('✅ Created categories table');
    
    // 4. Products table
    await pool.query(`
      CREATE TABLE products (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
          name VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          price_clp DECIMAL(10,2) NOT NULL,
          description TEXT,
          image_link VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created products table');
    
    // 5. User sessions table
    await pool.query(`
      CREATE TABLE user_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          refresh_token VARCHAR(500) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created user_sessions table');
    
    // 6. Cart items table
    await pool.query(`
      CREATE TABLE cart_items (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, product_id)
      );
    `);
    console.log('✅ Created cart_items table');
    
    // 7. Orders table
    await pool.query(`
      CREATE TABLE orders (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
          total_clp DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created orders table');
    
    // 8. Order items table
    await pool.query(`
      CREATE TABLE order_items (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          unit_price_clp DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created order_items table');
    
    // Create indexes
    console.log('📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX idx_users_email ON users(email);',
      'CREATE INDEX idx_users_role_id ON users(role_id);',
      'CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);',
      'CREATE INDEX idx_products_category_id ON products(category_id);',
      'CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);',
      'CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);',
      'CREATE INDEX idx_orders_user_id ON orders(user_id);',
      'CREATE INDEX idx_order_items_order_id ON order_items(order_id);',
      'CREATE INDEX idx_order_items_product_id ON order_items(product_id);'
    ];
    
    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
    }
    console.log('✅ Created indexes');
    
    // Insert sample data
    console.log('📊 Inserting sample data...');
    
    // Insert roles
    await pool.query(`
      INSERT INTO roles (id, role_name) VALUES
      ('450e8400-e29b-41d4-a716-446655440001', 'admin'),
      ('450e8400-e29b-41d4-a716-446655440002', 'manager'),
      ('450e8400-e29b-41d4-a716-446655440003', 'customer');
    `);
    
    // Insert users
    await pool.query(`
      INSERT INTO users (id, name, lastname, email, password_hash, role_id) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'Admin', 'Ferremas', 'admin@ferremas.cl', '$2b$12$LQv3c1yqBwlVHpPjrO3uCu/Nwp2sTY0o8GU8U8G8U8G8U8G8U8G8U', '450e8400-e29b-41d4-a716-446655440001'),
      ('550e8400-e29b-41d4-a716-446655440002', 'Juan', 'Pérez', 'manager@ferremas.cl', '$2b$12$LQv3c1yqBwlVHpPjrO3uCu/Nwp2sTY0o8GU8U8G8U8G8U8G8U8G8U', '450e8400-e29b-41d4-a716-446655440002'),
      ('550e8400-e29b-41d4-a716-446655440003', 'María', 'González', 'cliente1@gmail.com', '$2b$12$LQv3c1yqBwlVHpPjrO3uCu/Nwp2sTY0o8GU8U8G8U8G8U8G8U8G8U', '450e8400-e29b-41d4-a716-446655440003'),
      ('550e8400-e29b-41d4-a716-446655440004', 'Carlos', 'Rodríguez', 'cliente2@gmail.com', '$2b$12$LQv3c1yqBwlVHpPjrO3uCu/Nwp2sTY0o8GU8U8G8U8G8U8G8U8G8U', '450e8400-e29b-41d4-a716-446655440003');
    `);
    
    // Insert categories
    await pool.query(`
      INSERT INTO categories (id, name) VALUES
      ('750e8400-e29b-41d4-a716-446655440001', 'Herramientas Manuales'),
      ('750e8400-e29b-41d4-a716-446655440002', 'Herramientas Eléctricas'),
      ('750e8400-e29b-41d4-a716-446655440003', 'Materiales de Construcción'),
      ('750e8400-e29b-41d4-a716-446655440004', 'Ferretería'),
      ('750e8400-e29b-41d4-a716-446655440005', 'Jardín y Exterior');
    `);
    
    // Insert products
    await pool.query(`
      INSERT INTO products (id, category_id, name, quantity, price_clp, description, image_link) VALUES
      ('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'Martillo de Carpintero 16oz', 25, 12990, 'Martillo de carpintero con mango de fibra de vidrio, cabeza de acero forjado de 16 onzas. Ideal para trabajos de carpintería y construcción general.', '/uploads/products/martillo-carpintero.jpg'),
      ('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', 'Taladro Inalámbrico 18V', 15, 89990, 'Taladro inalámbrico de 18V con batería de litio, incluye cargador y maletín. Motor sin escobillas para mayor durabilidad y rendimiento.', '/uploads/products/taladro-18v.jpg'),
      ('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 'Set de Destornilladores 6 Piezas', 40, 8990, 'Set de 6 destornilladores con puntas Phillips y planas de diferentes tamaños. Mangos ergonómicos con grip antideslizante.', '/uploads/products/destornilladores-set.jpg'),
      ('850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440002', 'Sierra Circular 7 1/4"', 8, 79990, 'Sierra circular de 7 1/4 pulgadas, motor de 1400W, guía láser para cortes precisos. Incluye hoja de sierra de 24 dientes.', '/uploads/products/sierra-circular.jpg'),
      ('850e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440001', 'Llave Inglesa Ajustable 10"', 30, 15990, 'Llave inglesa ajustable de 10 pulgadas, acero al cromo vanadio. Mandíbulas endurecidas y graduadas.', '/uploads/products/llave-inglesa.jpg'),
      ('850e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440003', 'Cemento Portland 25kg', 100, 4590, 'Cemento Portland de alta calidad para construcción. Saco de 25 kilogramos.', '/uploads/products/cemento-portland.jpg'),
      ('850e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440004', 'Tornillos Autorroscantes x100', 200, 2990, 'Set de 100 tornillos autorroscantes de 1 pulgada para madera y metal.', '/uploads/products/tornillos-set.jpg'),
      ('850e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440005', 'Pala de Jardín', 20, 12990, 'Pala de jardín con mango de madera resistente y hoja de acero inoxidable.', '/uploads/products/pala-jardin.jpg');
    `);
    
    // Insert sample cart items
    await pool.query(`
      INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES
      ('d50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440001', 2),
      ('d50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440003', 1),
      ('d50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440002', 1);
    `);
    
    // Insert sample order
    await pool.query(`
      INSERT INTO orders (id, user_id, total_clp, status) VALUES
      ('e50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 89990, 'delivered');
    `);
    
    // Insert order items
    await pool.query(`
      INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_clp) VALUES
      ('f50e8400-e29b-41d4-a716-446655440001', 'e50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440002', 1, 89990);
    `);
    
    console.log('✅ Sample data inserted successfully!');
    
    // Final verification
    const finalCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('🎉 Tables created successfully:');
    finalCheck.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Test sample queries
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    const categoriesCount = await pool.query('SELECT COUNT(*) FROM categories');
    
    console.log('📊 Data verification:');
    console.log(`  - Users: ${usersCount.rows[0].count}`);
    console.log(`  - Products: ${productsCount.rows[0].count}`);
    console.log(`  - Categories: ${categoriesCount.rows[0].count}`);
    
    console.log('🎉 Database setup completed successfully for pgAdmin!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTablesForPgAdmin();