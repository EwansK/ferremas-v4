const database = require('../utils/database');

class ActivityLog {
  // Create new activity log
  static async create({ userId, action, details = {}, ipAddress, userAgent }) {
    const result = await database.query(`
      INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, action, JSON.stringify(details), ipAddress, userAgent]);

    return result.rows[0];
  }

  // Get activity logs with pagination and filtering
  static async findAll({ 
    page = 1, 
    limit = 50, 
    userId = null, 
    action = null, 
    startDate = null, 
    endDate = null,
    sortOrder = 'DESC' 
  }) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      whereClause += ` AND ual.user_id = $${paramCount}`;
      queryParams.push(userId);
    }

    if (action) {
      paramCount++;
      whereClause += ` AND ual.action = $${paramCount}`;
      queryParams.push(action);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND ual.created_at >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND ual.created_at <= $${paramCount}`;
      queryParams.push(endDate);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM activity_logs ual 
      ${whereClause}
    `;
    const countResult = await database.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count);

    // Get activity logs with user information
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const logsQuery = `
      SELECT 
        ual.id,
        ual.user_id,
        ual.action,
        ual.details,
        ual.ip_address,
        ual.user_agent,
        ual.created_at,
        u.name,
        u.lastname,
        u.email,
        u.role
      FROM activity_logs ual
      LEFT JOIN users u ON ual.user_id = u.id
      ${whereClause}
      ORDER BY ual.created_at ${sortOrder}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await database.query(logsQuery, queryParams);

    return {
      logs: result.rows,
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

  // Get activity summary by action
  static async getActionSummary(days = 30) {
    const result = await database.query(`
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM activity_logs 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY action
      ORDER BY count DESC
    `);

    return result.rows;
  }

  // Get daily activity stats
  static async getDailyStats(days = 30) {
    const result = await database.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_activities,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT action) as unique_actions
      FROM activity_logs 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return result.rows;
  }

  // Get user activity by hour for heatmap
  static async getHourlyActivity(days = 7) {
    const result = await database.query(`
      SELECT 
        EXTRACT(hour FROM created_at) as hour,
        COUNT(*) as activity_count
      FROM activity_logs 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY EXTRACT(hour FROM created_at)
      ORDER BY hour
    `);

    return result.rows;
  }

  // Delete old activity logs (cleanup)
  static async deleteOldLogs(days = 90) {
    const result = await database.query(`
      DELETE FROM activity_logs 
      WHERE created_at < CURRENT_DATE - INTERVAL '${days} days'
    `);

    return result.rowCount;
  }

  // Get most active users
  static async getMostActiveUsers(days = 30, limit = 10) {
    const result = await database.query(`
      SELECT 
        ual.user_id,
        u.name,
        u.lastname,
        u.email,
        u.role,
        COUNT(*) as activity_count,
        COUNT(DISTINCT ual.action) as unique_actions,
        MAX(ual.created_at) as last_activity
      FROM activity_logs ual
      LEFT JOIN users u ON ual.user_id = u.id
      WHERE ual.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY ual.user_id, u.name, u.lastname, u.email, u.role
      ORDER BY activity_count DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }
}

module.exports = ActivityLog;