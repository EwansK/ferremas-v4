const { Pool } = require('pg');
require('dotenv').config();

async function testDatabaseConnection() {
  // Database configuration
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ferremas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: {
      rejectUnauthorized: false
    }
  };

  console.log('Testing database connection...');
  console.log('Config:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password ? '***hidden***' : 'not set'
  });

  const pool = new Pool(config);

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Query test successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].postgres_version);
    
    // Test if our tables exist (this will work after schema is created)
    try {
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      if (tablesResult.rows.length > 0) {
        console.log('✅ Found tables in database:');
        tablesResult.rows.forEach(row => {
          console.log(`  - ${row.table_name}`);
        });
      } else {
        console.log('ℹ️  No tables found. Run the schema SQL file to create tables.');
      }
    } catch (error) {
      console.log('ℹ️  Could not check tables (this is normal if schema not created yet)');
    }
    
    client.release();
    await pool.end();
    
    console.log('✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure PostgreSQL is running and the connection details are correct.');
    } else if (error.code === '28P01') {
      console.error('💡 Authentication failed. Check your username and password.');
    } else if (error.code === '3D000') {
      console.error('💡 Database does not exist. Create the database first.');
    }
    
    process.exit(1);
  }
}

testDatabaseConnection();