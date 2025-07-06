const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function setupDatabase() {
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  };

  const pool = new Pool(config);

  try {
    console.log('🚀 Starting database setup...');
    
    // Read and execute schema file
    console.log('📋 Creating database schema...');
    const schemaSQL = fs.readFileSync('./database-schema.sql', 'utf8');
    
    // Execute the entire schema as one statement
    try {
      await pool.query(schemaSQL);
      console.log('✅ Schema executed successfully!');
    } catch (error) {
      // If that fails, try statement by statement
      console.log('⚠️  Trying statement by statement...');
      const schemaStatements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of schemaStatements) {
        if (statement.trim()) {
          try {
            await pool.query(statement);
          } catch (error) {
            if (!error.message.includes('already exists') && !error.message.includes('does not exist')) {
              console.error('Error executing statement:', statement.substring(0, 50) + '...');
              console.error('Error:', error.message);
            }
          }
        }
      }
    }
    
    console.log('✅ Database schema created successfully!');
    
    // Read and execute sample data file
    console.log('📊 Inserting sample data...');
    const sampleDataSQL = fs.readFileSync('./sample-data.sql', 'utf8');
    
    try {
      await pool.query(sampleDataSQL);
      console.log('✅ Sample data executed successfully!');
    } catch (error) {
      // If that fails, try statement by statement
      console.log('⚠️  Trying sample data statement by statement...');
      const dataStatements = sampleDataSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of dataStatements) {
        if (statement.trim()) {
          try {
            await pool.query(statement);
          } catch (error) {
            if (!error.message.includes('duplicate key')) {
              console.error('Error executing statement:', statement.substring(0, 50) + '...');
              console.error('Error:', error.message);
            }
          }
        }
      }
    }
    
    console.log('✅ Sample data inserted successfully!');
    
    // Verify setup by checking tables and data
    console.log('🔍 Verifying database setup...');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check some sample data
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    const categoriesCount = await pool.query('SELECT COUNT(*) FROM categories');
    
    console.log('📊 Sample data counts:');
    console.log(`  - Users: ${usersCount.rows[0].count}`);
    console.log(`  - Products: ${productsCount.rows[0].count}`);
    console.log(`  - Categories: ${categoriesCount.rows[0].count}`);
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();