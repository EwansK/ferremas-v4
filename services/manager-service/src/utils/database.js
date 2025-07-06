const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async query(text, params) {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async transaction(callback) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }

  // Generate unique slug for products/categories
  async generateUniqueSlug(table, baseSlug, excludeId = null) {
    let slug = this.createSlug(baseSlug);
    let counter = 1;

    while (true) {
      let query = `SELECT COUNT(*) FROM ${table} WHERE slug = $1`;
      const params = [slug];

      if (excludeId) {
        query += ` AND id != $2`;
        params.push(excludeId);
      }

      const result = await this.query(query, params);
      const count = parseInt(result.rows[0].count);

      if (count === 0) {
        return slug;
      }

      slug = `${this.createSlug(baseSlug)}-${counter}`;
      counter++;
    }
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  // Log activity for audit trail
  async logActivity(userId, action, entityType, entityId, oldValues = null, newValues = null, ipAddress = null) {
    try {
      await this.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, action, entityType, entityId, oldValues, newValues, ipAddress]
      );
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error as logging shouldn't break the main operation
    }
  }
}

module.exports = new Database();