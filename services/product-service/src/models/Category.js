const database = require('../utils/database');

class Category {
  static async findAll() {
    const query = `
      SELECT 
        c.id,
        c.name,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
    `;

    const result = await database.query(query);
    return result.rows.map(this.formatCategory);
  }

  static async findById(id) {
    const query = `
      SELECT 
        c.id,
        c.name,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.id = $1
      GROUP BY c.id, c.name
    `;

    const result = await database.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.formatCategory(result.rows[0]);
  }

  static async findWithProducts(categoryId, pagination = {}) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    // Get category info
    const category = await this.findById(categoryId);
    if (!category) {
      return null;
    }

    // Get products in this category
    const orderBy = database.buildOrderBy(sortBy, sortOrder);
    
    // Count total products in category
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE p.category_id = $1
    `;
    
    const countResult = await database.query(countQuery, [categoryId]);
    const total = parseInt(countResult.rows[0].total);

    // Get products
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
      WHERE p.category_id = $1
      ${orderBy}
      LIMIT $2 OFFSET $3
    `;

    const productsResult = await database.query(productsQuery, [categoryId, limit, offset]);

    return {
      category,
      products: productsResult.rows.map(row => {
        const Product = require('./Product');
        return Product.formatProduct(row);
      }),
      pagination: database.buildPaginationInfo(page, limit, total)
    };
  }

  static async getCategoryStats() {
    const query = `
      SELECT 
        c.id,
        c.name,
        COUNT(p.id) as product_count,
        COUNT(CASE WHEN p.quantity > 0 THEN 1 END) as in_stock_count,
        COALESCE(MIN(p.price_clp), 0) as min_price,
        COALESCE(MAX(p.price_clp), 0) as max_price,
        COALESCE(AVG(p.price_clp), 0) as avg_price
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY product_count DESC, c.name ASC
    `;

    const result = await database.query(query);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      product_count: parseInt(row.product_count),
      in_stock_count: parseInt(row.in_stock_count),
      price_range: {
        min: parseFloat(row.min_price),
        max: parseFloat(row.max_price),
        avg: Math.round(parseFloat(row.avg_price) * 100) / 100
      }
    }));
  }

  static async searchCategories(searchTerm) {
    const query = `
      SELECT 
        c.id,
        c.name,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.name ILIKE $1
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
    `;

    const result = await database.query(query, [`%${searchTerm}%`]);
    return result.rows.map(this.formatCategory);
  }

  static formatCategory(row) {
    return {
      id: row.id,
      name: row.name,
      product_count: parseInt(row.product_count)
    };
  }
}

module.exports = Category;