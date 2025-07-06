#!/usr/bin/env node

const { Pool } = require('pg');

// Test database configuration
const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:testpassword@localhost:5433/ferremas_test'
});

const cleanTestData = async () => {
  try {
    console.log('🧹 Cleaning test data from database...\n');

    // Clean in reverse order to respect foreign key constraints
    console.log('Cleaning cart items...');
    await pool.query("DELETE FROM cart_items WHERE id LIKE 'test-%'");

    console.log('Cleaning order items...');
    await pool.query("DELETE FROM order_items WHERE id LIKE 'test-%'");

    console.log('Cleaning orders...');
    await pool.query("DELETE FROM orders WHERE id LIKE 'test-%'");

    console.log('Cleaning products...');
    await pool.query("DELETE FROM products WHERE id LIKE 'test-%'");

    console.log('Cleaning users...');
    await pool.query("DELETE FROM users WHERE email LIKE '%@ferremas.cl' AND email LIKE 'test%'");
    await pool.query("DELETE FROM users WHERE email = 'inactive@ferremas.cl'");

    console.log('\n✅ Test data cleaned successfully!');

  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  cleanTestData();
}

module.exports = { cleanTestData };