const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { validateSchema, activitySchemas } = require('../utils/validation');

// GET /analytics/dashboard - Get comprehensive dashboard data
router.get('/dashboard',
  validateSchema(activitySchemas.getStatsQuery, 'query'),
  analyticsController.getDashboardData
);

// GET /analytics/activity-logs - Get activity logs with filtering
router.get('/activity-logs',
  validateSchema(activitySchemas.getActivityQuery, 'query'),
  analyticsController.getActivityLogs
);

// GET /analytics/activity-summary - Get activity summary by action
router.get('/activity-summary',
  validateSchema(activitySchemas.getStatsQuery, 'query'),
  analyticsController.getActivitySummary
);

// GET /analytics/daily-stats - Get daily activity statistics
router.get('/daily-stats',
  validateSchema(activitySchemas.getStatsQuery, 'query'),
  analyticsController.getDailyStats
);

// GET /analytics/hourly-activity - Get hourly activity pattern
router.get('/hourly-activity',
  validateSchema(activitySchemas.getStatsQuery, 'query'),
  analyticsController.getHourlyActivity
);

// GET /analytics/active-users - Get most active users
router.get('/active-users',
  validateSchema(activitySchemas.getStatsQuery, 'query'),
  analyticsController.getMostActiveUsers
);

// GET /analytics/system-health - Get system health metrics
router.get('/system-health',
  analyticsController.getSystemHealth
);

// GET /analytics/export - Export activity data
router.get('/export',
  validateSchema(activitySchemas.getActivityQuery, 'query'),
  analyticsController.exportActivityData
);

module.exports = router;