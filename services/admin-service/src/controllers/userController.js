const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { customValidations } = require('../utils/validation');

class UserController {
  // Get all users with pagination and filtering
  async getUsers(req, res) {
    try {
      const { page, limit, search, role, sortBy, sortOrder } = req.query;
      
      const result = await User.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        role,
        sortBy,
        sortOrder
      });

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'view_users',
        details: {
          filters: { search, role, sortBy, sortOrder },
          resultsCount: result.users.length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users'
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user activity summary
      const activitySummary = await User.getActivitySummary(id);

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'view_user_details',
        details: { targetUserId: id },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: {
          user,
          activitySummary
        }
      });

    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user details'
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if admin can manage this user
      if (!customValidations.canManageUser(req.user.role, existingUser.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to manage this user'
        });
      }

      // Prevent admin from changing their own role
      if (id === req.user.id && updateData.role && updateData.role !== req.user.role) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change your own role'
        });
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingUser.email) {
        const isUnique = await customValidations.isEmailUnique(updateData.email, id);
        if (!isUnique) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      // Update the user
      const updatedUser = await User.updateById(id, updateData);

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'update_user',
        details: {
          targetUserId: id,
          changes: updateData,
          previousData: {
            name: existingUser.name,
            lastname: existingUser.lastname,
            email: existingUser.email,
            role: existingUser.role,
            active: existingUser.active
          }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: { user: updatedUser },
        message: 'User updated successfully'
      });

    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user'
      });
    }
  }

  // Deactivate user (soft delete)
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent admin from deactivating themselves
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      // Check if admin can manage this user
      if (!customValidations.canManageUser(req.user.role, existingUser.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to deactivate this user'
        });
      }

      // Deactivate the user
      await User.deleteById(id);

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'deactivate_user',
        details: {
          targetUserId: id,
          targetUserEmail: existingUser.email,
          targetUserRole: existingUser.role
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'User deactivated successfully'
      });

    } catch (error) {
      console.error('Error deactivating user:', error);
      res.status(500).json({
        success: false,
        message: 'Error deactivating user'
      });
    }
  }

  // Reactivate user
  async reactivateUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if admin can manage this user
      if (!customValidations.canManageUser(req.user.role, existingUser.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to reactivate this user'
        });
      }

      // Reactivate the user
      const updatedUser = await User.updateById(id, { active: true });

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'reactivate_user',
        details: {
          targetUserId: id,
          targetUserEmail: existingUser.email,
          targetUserRole: existingUser.role
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: { user: updatedUser },
        message: 'User reactivated successfully'
      });

    } catch (error) {
      console.error('Error reactivating user:', error);
      res.status(500).json({
        success: false,
        message: 'Error reactivating user'
      });
    }
  }

  // Get user statistics
  async getUserStatistics(req, res) {
    try {
      const stats = await User.getStatistics();

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'view_user_statistics',
        details: { statsRequested: true },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: { statistics: stats }
      });

    } catch (error) {
      console.error('Error fetching user statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics'
      });
    }
  }

  // Bulk update users
  async bulkUpdateUsers(req, res) {
    try {
      const { userIds, updateData } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      const results = {
        updated: [],
        failed: [],
        skipped: []
      };

      for (const userId of userIds) {
        try {
          // Check if user exists
          const existingUser = await User.findById(userId);
          if (!existingUser) {
            results.failed.push({ userId, reason: 'User not found' });
            continue;
          }

          // Skip own account for certain operations
          if (userId === req.user.id && (updateData.role || updateData.active === false)) {
            results.skipped.push({ userId, reason: 'Cannot modify own account' });
            continue;
          }

          // Check permissions
          if (!customValidations.canManageUser(req.user.role, existingUser.role)) {
            results.skipped.push({ userId, reason: 'Insufficient permissions' });
            continue;
          }

          // Update user
          const updatedUser = await User.updateById(userId, updateData);
          results.updated.push({ userId, user: updatedUser });

        } catch (error) {
          results.failed.push({ userId, reason: error.message });
        }
      }

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'bulk_update_users',
        details: {
          userIds,
          updateData,
          results: {
            updatedCount: results.updated.length,
            failedCount: results.failed.length,
            skippedCount: results.skipped.length
          }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: results,
        message: `Bulk update completed. Updated: ${results.updated.length}, Failed: ${results.failed.length}, Skipped: ${results.skipped.length}`
      });

    } catch (error) {
      console.error('Error in bulk update:', error);
      res.status(500).json({
        success: false,
        message: 'Error performing bulk update'
      });
    }
  }
}

module.exports = new UserController();