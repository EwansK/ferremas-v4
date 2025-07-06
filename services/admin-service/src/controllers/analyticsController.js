const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

class AnalyticsController {
  // Get activity logs with filtering
  async getActivityLogs(req, res) {
    try {
      const { page, limit, userId, action, startDate, endDate, sortOrder } = req.query;
      
      const result = await ActivityLog.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        userId,
        action,
        startDate,
        endDate,
        sortOrder
      });

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'view_activity_logs',
        details: {
          filters: { userId, action, startDate, endDate },
          resultsCount: result.logs.length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching activity logs'
      });
    }
  }

  // Get activity summary by action
  async getActivitySummary(req, res) {
    try {
      const { days = 30 } = req.query;
      
      const actionSummary = await ActivityLog.getActionSummary(parseInt(days));
      
      res.json({
        success: true,
        data: {
          actionSummary,
          period: `${days} days`
        }
      });

    } catch (error) {
      console.error('Error fetching activity summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching activity summary'
      });
    }
  }

  // Get daily activity statistics
  async getDailyStats(req, res) {
    try {
      const { days = 30 } = req.query;
      
      const dailyStats = await ActivityLog.getDailyStats(parseInt(days));
      
      res.json({
        success: true,
        data: {
          dailyStats,
          period: `${days} days`
        }
      });

    } catch (error) {
      console.error('Error fetching daily stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching daily statistics'
      });
    }
  }

  // Get hourly activity pattern
  async getHourlyActivity(req, res) {
    try {
      const { days = 7 } = req.query;
      
      const hourlyActivity = await ActivityLog.getHourlyActivity(parseInt(days));
      
      res.json({
        success: true,
        data: {
          hourlyActivity,
          period: `${days} days`
        }
      });

    } catch (error) {
      console.error('Error fetching hourly activity:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching hourly activity data'
      });
    }
  }

  // Get most active users
  async getMostActiveUsers(req, res) {
    try {
      const { days = 30, limit = 10 } = req.query;
      
      const activeUsers = await ActivityLog.getMostActiveUsers(
        parseInt(days), 
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: {
          activeUsers,
          period: `${days} days`,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching most active users:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching most active users'
      });
    }
  }

  // Get comprehensive dashboard data
  async getDashboardData(req, res) {
    try {
      const { days = 30 } = req.query;
      const daysInt = parseInt(days);

      // Get all data in parallel
      const [
        userStats,
        actionSummary,
        dailyStats,
        hourlyActivity,
        mostActiveUsers
      ] = await Promise.all([
        User.getStatistics(),
        ActivityLog.getActionSummary(daysInt),
        ActivityLog.getDailyStats(daysInt),
        ActivityLog.getHourlyActivity(Math.min(daysInt, 7)), // Max 7 days for hourly
        ActivityLog.getMostActiveUsers(daysInt, 5) // Top 5 users
      ]);

      // Calculate additional metrics
      const totalActivities = dailyStats.reduce((sum, day) => sum + parseInt(day.total_activities), 0);
      const avgActivitiesPerDay = totalActivities / Math.max(dailyStats.length, 1);
      
      const dashboard = {
        userStatistics: userStats,
        activityOverview: {
          totalActivities,
          avgActivitiesPerDay: Math.round(avgActivitiesPerDay * 100) / 100,
          totalActions: actionSummary.length,
          period: `${days} days`
        },
        actionSummary: actionSummary.slice(0, 10), // Top 10 actions
        dailyStats: dailyStats.slice(0, 30), // Last 30 days
        hourlyActivity,
        mostActiveUsers,
        generatedAt: new Date().toISOString()
      };

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'view_admin_dashboard',
        details: { 
          period: `${days} days`,
          dataPoints: {
            userStats: !!userStats,
            actionSummary: actionSummary.length,
            dailyStats: dailyStats.length,
            hourlyActivity: hourlyActivity.length,
            mostActiveUsers: mostActiveUsers.length
          }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard data'
      });
    }
  }

  // Get system health metrics
  async getSystemHealth(req, res) {
    try {
      const database = require('../utils/database');
      
      // Database connection check
      const dbCheck = await database.query('SELECT NOW()');
      const dbLatency = Date.now() - new Date(dbCheck.rows[0].now);

      // Recent activity check
      const recentActivity = await database.query(`
        SELECT COUNT(*) as count 
        FROM activity_logs 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      `);

      // Database size check
      const dbSize = await database.query(`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size,
          pg_database_size(current_database()) as size_bytes
      `);

      const health = {
        status: 'healthy',
        database: {
          connected: true,
          latency: `${dbLatency}ms`,
          size: dbSize.rows[0].size,
          sizeBytes: parseInt(dbSize.rows[0].size_bytes)
        },
        activity: {
          recentHour: parseInt(recentActivity.rows[0].count)
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      console.error('Error checking system health:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking system health',
        data: {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Export activity data
  async exportActivityData(req, res) {
    try {
      const { format = 'json', startDate, endDate, userId, action } = req.query;
      
      // Get data without pagination for export
      const result = await ActivityLog.findAll({
        page: 1,
        limit: 10000, // Large limit for export
        userId,
        action,
        startDate,
        endDate,
        sortOrder: 'DESC'
      });

      // Log the export activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'export_activity_data',
        details: {
          format,
          filters: { userId, action, startDate, endDate },
          recordCount: result.logs.length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(result.logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="activity_logs_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        // Return JSON format
        res.json({
          success: true,
          data: result,
          exportInfo: {
            format,
            generatedAt: new Date().toISOString(),
            recordCount: result.logs.length
          }
        });
      }

    } catch (error) {
      console.error('Error exporting activity data:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting activity data'
      });
    }
  }

  // Helper method to convert data to CSV
  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = [
      'ID', 'User ID', 'Name', 'Email', 'Role', 'Action', 
      'IP Address', 'Created At', 'Details'
    ];

    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = [
        row.id,
        row.user_id,
        `"${row.name || ''}"`,
        `"${row.email || ''}"`,
        row.role || '',
        row.action,
        row.ip_address || '',
        row.created_at,
        `"${JSON.stringify(row.details || {}).replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }
}

module.exports = new AnalyticsController();