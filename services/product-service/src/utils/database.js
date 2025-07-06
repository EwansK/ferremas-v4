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

  async close() {
    await this.pool.end();
  }

  // Build pagination info
  buildPaginationInfo(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    return {
      currentPage: page,
      pageSize: limit,
      totalItems: total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  // Build dynamic WHERE clause for filters
  buildWhereClause(filters) {
    const conditions = [];
    const values = [];
    let paramCount = 1;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'search') {
          // Full-text search
          conditions.push(`(
            p.name ILIKE $${paramCount} OR 
            p.description ILIKE $${paramCount}
          )`);
          values.push(`%${value}%`);
        } else if (key === 'categoryId') {
          conditions.push(`p.category_id = $${paramCount}`);
          values.push(value);
        } else if (key === 'minPrice') {
          conditions.push(`p.price_clp >= $${paramCount}`);
          values.push(value);
        } else if (key === 'maxPrice') {
          conditions.push(`p.price_clp <= $${paramCount}`);
          values.push(value);
        } else if (key === 'inStock') {
          if (value === true || value === 'true') {
            conditions.push(`p.quantity > 0`);
          }
        }
        paramCount++;
      }
    });

    return {
      whereClause: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
      values
    };
  }

  // Build ORDER BY clause
  buildOrderBy(sortBy = 'created_at', sortOrder = 'DESC') {
    const allowedSortFields = ['name', 'price_clp', 'quantity', 'created_at'];
    const allowedSortOrders = ['ASC', 'DESC'];

    const field = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    return `ORDER BY p.${field} ${order}`;
  }
}

module.exports = new Database();