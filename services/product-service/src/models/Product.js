const database = require('../utils/database');

class Product {
  static async findAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const { whereClause, values } = database.buildWhereClause(filters);
    
    // Build ORDER BY clause
    const orderBy = database.buildOrderBy(sortBy, sortOrder);

    // Count total items for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    
    const countResult = await database.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get products with category information
    const productsQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price_clp,
        p.quantity,
        p.image_link,
        p.created_at,
        c.id as category_id,
        c.name as category_name,
        CASE WHEN p.quantity > 0 THEN true ELSE false END as in_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ${orderBy}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const result = await database.query(productsQuery, [...values, limit, offset]);

    return {
      products: result.rows.map(this.formatProduct),
      pagination: database.buildPaginationInfo(page, limit, total)
    };
  }

  static async findById(id) {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price_clp,
        p.quantity,
        p.image_link,
        p.created_at,
        c.id as category_id,
        c.name as category_name,
        CASE WHEN p.quantity > 0 THEN true ELSE false END as in_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;

    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.formatProduct(result.rows[0]);
  }

  static async findByCategory(categoryId, pagination = {}) {
    return this.findAll({ categoryId }, pagination);
  }

  static async search(searchTerm, pagination = {}) {
    return this.findAll({ search: searchTerm }, pagination);
  }

  static async findFeatured(limit = 10) {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price_clp,
        p.quantity,
        p.image_link,
        p.created_at,
        c.id as category_id,
        c.name as category_name,
        CASE WHEN p.quantity > 0 THEN true ELSE false END as in_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.quantity > 0
      ORDER BY p.created_at DESC
      LIMIT $1
    `;

    const result = await database.query(query, [limit]);
    return result.rows.map(this.formatProduct);
  }

  static async getStockInfo(productId) {
    const query = `
      SELECT 
        id,
        name,
        quantity,
        CASE WHEN quantity > 0 THEN true ELSE false END as in_stock,
        CASE 
          WHEN quantity = 0 THEN 'out_of_stock'
          WHEN quantity <= 5 THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products 
      WHERE id = $1
    `;

    const result = await database.query(query, [productId]);
    return result.rows[0] || null;
  }

  static async getProductCounts() {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN quantity > 0 THEN 1 END) as in_stock_products,
        COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_products,
        COUNT(CASE WHEN quantity <= 5 AND quantity > 0 THEN 1 END) as low_stock_products
      FROM products
    `;

    const result = await database.query(query);
    return result.rows[0];
  }

  static formatProduct(row) {
    const usdRate = parseFloat(process.env.DEFAULT_USD_RATE) || 0.00125;
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price_clp: parseFloat(row.price_clp),
      price_usd: Math.round(parseFloat(row.price_clp) * usdRate * 100) / 100, // USD hint
      quantity: row.quantity,
      in_stock: row.in_stock,
      image_link: row.image_link,
      category: row.category_id ? {
        id: row.category_id,
        name: row.category_name
      } : null,
      created_at: row.created_at
    };
  }
}

module.exports = Product;