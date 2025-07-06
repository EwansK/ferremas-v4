#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Test database configuration
const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:testpassword@localhost:5433/ferremas_test'
});

// Test data generators
const generateTestUsers = async () => {
  const users = [
    {
      id: 'test-admin-001',
      name: 'Test',
      lastname: 'Admin',
      email: 'test.admin@ferremas.cl',
      password: 'password123',
      role: 'admin'
    },
    {
      id: 'test-manager-001',
      name: 'Test',
      lastname: 'Manager',
      email: 'test.manager@ferremas.cl',
      password: 'password123',
      role: 'manager'
    },
    {
      id: 'test-customer-001',
      name: 'Test',
      lastname: 'Customer',
      email: 'test.customer@ferremas.cl',
      password: 'password123',
      role: 'customer'
    },
    {
      id: 'test-inactive-001',
      name: 'Inactive',
      lastname: 'User',
      email: 'inactive@ferremas.cl',
      password: 'password123',
      role: 'customer',
      active: false
    }
  ];

  console.log('Generating test users...');
  
  for (const user of users) {
    try {
      // Get role ID
      const roleResult = await pool.query(
        'SELECT id FROM roles WHERE role_name = $1',
        [user.role]
      );
      
      if (roleResult.rows.length === 0) {
        console.warn(`Role ${user.role} not found, skipping user ${user.email}`);
        continue;
      }

      const roleId = roleResult.rows[0].id;
      const hashedPassword = await bcrypt.hash(user.password, 12);

      await pool.query(
        `INSERT INTO users (id, name, lastname, email, password_hash, role_id, active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (email) DO UPDATE SET 
         name = EXCLUDED.name,
         lastname = EXCLUDED.lastname,
         password_hash = EXCLUDED.password_hash,
         role_id = EXCLUDED.role_id,
         active = EXCLUDED.active`,
        [user.id, user.name, user.lastname, user.email, hashedPassword, roleId, user.active !== false]
      );

      console.log(`✓ Created test user: ${user.email}`);
    } catch (error) {
      console.error(`✗ Failed to create user ${user.email}:`, error.message);
    }
  }
};

const generateTestProducts = async () => {
  const products = [
    {
      id: 'test-product-001',
      name: 'Test Martillo',
      price_clp: 15990,
      quantity: 50,
      description: 'Martillo de prueba para testing',
      image_link: '/uploads/test-martillo.jpg'
    },
    {
      id: 'test-product-002',
      name: 'Test Destornillador',
      price_clp: 8990,
      quantity: 0, // Out of stock for testing
      description: 'Destornillador de prueba',
      image_link: '/uploads/test-destornillador.jpg'
    },
    {
      id: 'test-product-003',
      name: 'Test Taladro',
      price_clp: 89990,
      quantity: 5, // Low stock for testing
      description: 'Taladro inalámbrico de prueba',
      image_link: '/uploads/test-taladro.jpg'
    }
  ];

  console.log('Generating test products...');

  // Get first category for test products
  const categoryResult = await pool.query('SELECT id FROM categories LIMIT 1');
  if (categoryResult.rows.length === 0) {
    console.warn('No categories found, skipping test products');
    return;
  }

  const categoryId = categoryResult.rows[0].id;

  for (const product of products) {
    try {
      await pool.query(
        `INSERT INTO products (id, category_id, name, price_clp, quantity, description, image_link) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         price_clp = EXCLUDED.price_clp,
         quantity = EXCLUDED.quantity,
         description = EXCLUDED.description,
         image_link = EXCLUDED.image_link`,
        [product.id, categoryId, product.name, product.price_clp, product.quantity, product.description, product.image_link]
      );

      console.log(`✓ Created test product: ${product.name}`);
    } catch (error) {
      console.error(`✗ Failed to create product ${product.name}:`, error.message);
    }
  }
};

const generateTestOrders = async () => {
  console.log('Generating test orders...');

  try {
    // Get test customer
    const customerResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['test.customer@ferremas.cl']
    );

    if (customerResult.rows.length === 0) {
      console.warn('Test customer not found, skipping orders');
      return;
    }

    const customerId = customerResult.rows[0].id;

    // Get test product
    const productResult = await pool.query(
      'SELECT id, price_clp FROM products WHERE id = $1',
      ['test-product-001']
    );

    if (productResult.rows.length === 0) {
      console.warn('Test product not found, skipping orders');
      return;
    }

    const product = productResult.rows[0];

    // Create test order
    const orderResult = await pool.query(
      `INSERT INTO orders (id, user_id, total_clp, status) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (id) DO UPDATE SET 
       total_clp = EXCLUDED.total_clp,
       status = EXCLUDED.status 
       RETURNING id`,
      ['test-order-001', customerId, product.price_clp * 2, 'completed']
    );

    const orderId = orderResult.rows[0].id;

    // Create order items
    await pool.query(
      `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_clp) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (id) DO UPDATE SET 
       quantity = EXCLUDED.quantity,
       unit_price_clp = EXCLUDED.unit_price_clp`,
      ['test-order-item-001', orderId, product.id, 2, product.price_clp]
    );

    console.log('✓ Created test order');
  } catch (error) {
    console.error('✗ Failed to create test order:', error.message);
  }
};

const generateTestCartItems = async () => {
  console.log('Generating test cart items...');

  try {
    // Get test customer
    const customerResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['test.customer@ferremas.cl']
    );

    if (customerResult.rows.length === 0) {
      console.warn('Test customer not found, skipping cart items');
      return;
    }

    const customerId = customerResult.rows[0].id;

    // Get test products
    const productsResult = await pool.query(
      'SELECT id FROM products WHERE id LIKE $1',
      ['test-product-%']
    );

    for (let i = 0; i < productsResult.rows.length && i < 2; i++) {
      const product = productsResult.rows[i];
      
      await pool.query(
        `INSERT INTO cart_items (id, user_id, product_id, quantity) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (user_id, product_id) DO UPDATE SET 
         quantity = EXCLUDED.quantity`,
        [`test-cart-item-${i + 1}`, customerId, product.id, i + 1]
      );
    }

    console.log('✓ Created test cart items');
  } catch (error) {
    console.error('✗ Failed to create test cart items:', error.message);
  }
};

// Main function
const main = async () => {
  try {
    console.log('🌱 Generating test data for Ferremas...\n');

    await generateTestUsers();
    await generateTestProducts();
    await generateTestOrders();
    await generateTestCartItems();

    console.log('\n✅ Test data generation completed successfully!');
    console.log('\nTest accounts created:');
    console.log('- Admin: test.admin@ferremas.cl / password123');
    console.log('- Manager: test.manager@ferremas.cl / password123');
    console.log('- Customer: test.customer@ferremas.cl / password123');
    console.log('- Inactive: inactive@ferremas.cl / password123 (inactive)');

  } catch (error) {
    console.error('❌ Error generating test data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateTestUsers,
  generateTestProducts,
  generateTestOrders,
  generateTestCartItems
};