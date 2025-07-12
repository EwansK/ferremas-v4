const database = require('../utils/database');

class User {
  // Get all users with pagination and filtering
  static async findAll({ page = 1, limit = 20, search = '', role = '', sortBy = 'created_at', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (u.name ILIKE $${paramCount} OR u.lastname ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      whereClause += ` AND r.role_name = $${paramCount}`;
      queryParams.push(role);
    }

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'name', 'email', 'role', 'active'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    if (!allowedSortFields.includes(sortBy)) sortBy = 'created_at';
    if (!allowedSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'DESC';

    // Update sortBy to use table aliases
    const sortField = sortBy === 'role' ? 'r.role_name' : `u.${sortBy}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
    `;
    const countResult = await database.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count);

    // Get users
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const usersQuery = `
      SELECT 
        u.id, u.name, u.lastname, u.email, r.role_name as role, u.active, u.created_at, 
        u.updated_at, u.last_login_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await database.query(usersQuery, queryParams);

    return {
      users: result.rows,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNext: page * limit < totalItems,
        hasPrev: page > 1
      }
    };
  }

  // Get user by ID
  static async findById(id) {
    const result = await database.query(
      `SELECT u.id, u.name, u.lastname, u.email, r.role_name as role, u.active, u.created_at, u.updated_at, u.last_login_at 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get user by email
  static async findByEmail(email) {
    const result = await database.query(
      `SELECT u.id, u.name, u.lastname, u.email, r.role_name as role, u.active, u.created_at, u.updated_at, u.last_login_at 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0];
  }

  // Update user
  static async updateById(id, updateData) {
    const allowedFields = ['name', 'lastname', 'email', 'role_id', 'active'];
    const fields = [];
    const values = [];
    let paramCount = 0;

    // Handle role conversion
    if (updateData.role && !updateData.role_id) {
      // Convert role name to role_id
      const roleResult = await database.query('SELECT id FROM roles WHERE role_name = $1', [updateData.role]);
      if (roleResult.rows[0]) {
        updateData.role_id = roleResult.rows[0].id;
      }
      delete updateData.role;
    }

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    values.push(new Date());
    fields.push(`updated_at = $${paramCount}`);

    paramCount++;
    values.push(id);

    const updateQuery = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, lastname, email, role, active, created_at, updated_at
    `;

    const result = await database.query(updateQuery, values);
    return result.rows[0];
  }

  // Delete user (soft delete by setting active = false)
  static async deleteById(id) {
    const result = await database.query(
      'UPDATE users SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  // Hard delete user (permanent deletion)
  static async hardDeleteById(id) {
    const result = await database.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  // Get user statistics
  static async getStatistics() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE active = true) as active_users,
        COUNT(*) FILTER (WHERE active = false) as inactive_users,
        COUNT(*) FILTER (WHERE role = 'customer') as customers,
        COUNT(*) FILTER (WHERE role = 'manager') as managers,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days,
        COUNT(*) FILTER (WHERE last_login_at >= CURRENT_DATE - INTERVAL '7 days') as active_last_7_days
      FROM users
    `;

    const result = await database.query(statsQuery);
    return result.rows[0];
  }

  // Get user activity summary
  static async getActivitySummary(userId, days = 30) {
    const result = await database.query(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        array_agg(DISTINCT action) as actions_performed
      FROM activity_logs 
      WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
    `, [userId]);

    return result.rows[0];
  }

  // Update last login
  static async updateLastLogin(id) {
    const result = await database.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING last_login_at',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = User;