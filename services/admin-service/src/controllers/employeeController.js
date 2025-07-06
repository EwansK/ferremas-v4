const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const { customValidations } = require('../utils/validation');

class EmployeeController {
  // Get all employees with pagination and filtering
  async getEmployees(req, res) {
    try {
      const { page, limit, search, department, position, sortBy, sortOrder } = req.query;
      
      const result = await Employee.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        department,
        position,
        sortBy,
        sortOrder
      });

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'view_employees',
        details: {
          filters: { search, department, position, sortBy, sortOrder },
          resultsCount: result.employees.length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employees'
      });
    }
  }

  // Get employee by ID
  async getEmployeeById(req, res) {
    try {
      const { id } = req.params;
      
      const employee = await Employee.findById(id);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'view_employee_details',
        details: { employeeId: id, targetUserId: employee.user_id },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: { employee }
      });

    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employee details'
      });
    }
  }

  // Create new employee
  async createEmployee(req, res) {
    try {
      const { name, lastname, email, role, password, department, position, phone, address } = req.body;

      // Check if email already exists
      const isEmailUnique = await customValidations.isEmailUnique(email);
      if (!isEmailUnique) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Validate role
      if (!['manager', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be manager or admin'
        });
      }

      // Check if admin can create this role
      if (!customValidations.canManageUser(req.user.role, role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create user with this role'
        });
      }

      // Create employee
      const result = await Employee.create({
        name,
        lastname,
        email,
        role,
        password,
        department,
        position,
        phone,
        address
      });

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'create_employee',
        details: {
          newEmployeeId: result.employee.id,
          newUserId: result.user.id,
          email: result.user.email,
          role: result.user.role,
          department: result.employee.department,
          position: result.employee.position
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = result.user;

      res.status(201).json({
        success: true,
        data: {
          user: userWithoutPassword,
          employee: result.employee
        },
        message: 'Employee created successfully'
      });

    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating employee'
      });
    }
  }

  // Update employee
  async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if employee exists
      const existingEmployee = await Employee.findById(id);
      if (!existingEmployee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Check if admin can manage this user
      if (!customValidations.canManageUser(req.user.role, existingEmployee.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to manage this employee'
        });
      }

      // Prevent admin from changing their own role
      if (existingEmployee.user_id === req.user.id && updateData.role && updateData.role !== req.user.role) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change your own role'
        });
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingEmployee.email) {
        const isUnique = await customValidations.isEmailUnique(updateData.email, existingEmployee.user_id);
        if (!isUnique) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      // Update the employee
      const updatedEmployee = await Employee.updateById(id, updateData);

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'update_employee',
        details: {
          employeeId: id,
          targetUserId: existingEmployee.user_id,
          changes: updateData,
          previousData: {
            name: existingEmployee.name,
            lastname: existingEmployee.lastname,
            email: existingEmployee.email,
            role: existingEmployee.role,
            department: existingEmployee.department,
            position: existingEmployee.position,
            phone: existingEmployee.phone
          }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: { employee: updatedEmployee },
        message: 'Employee updated successfully'
      });

    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating employee'
      });
    }
  }

  // Deactivate employee
  async deactivateEmployee(req, res) {
    try {
      const { id } = req.params;

      // Check if employee exists
      const existingEmployee = await Employee.findById(id);
      if (!existingEmployee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Prevent admin from deactivating themselves
      if (existingEmployee.user_id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      // Check if admin can manage this user
      if (!customValidations.canManageUser(req.user.role, existingEmployee.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to deactivate this employee'
        });
      }

      // Deactivate the employee
      await Employee.deactivateById(id);

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'deactivate_employee',
        details: {
          employeeId: id,
          targetUserId: existingEmployee.user_id,
          targetUserEmail: existingEmployee.email,
          targetUserRole: existingEmployee.role,
          department: existingEmployee.department,
          position: existingEmployee.position
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Employee deactivated successfully'
      });

    } catch (error) {
      console.error('Error deactivating employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error deactivating employee'
      });
    }
  }

  // Get employee statistics
  async getEmployeeStatistics(req, res) {
    try {
      const stats = await Employee.getStatistics();

      // Log the activity
      await ActivityLog.create({
        userId: req.user.id,
        action: 'view_employee_statistics',
        details: { statsRequested: true },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: { statistics: stats }
      });

    } catch (error) {
      console.error('Error fetching employee statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employee statistics'
      });
    }
  }

  // Get departments
  async getDepartments(req, res) {
    try {
      const departments = await Employee.getDepartments();

      res.json({
        success: true,
        data: { departments }
      });

    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching departments'
      });
    }
  }

  // Get positions
  async getPositions(req, res) {
    try {
      const positions = await Employee.getPositions();

      res.json({
        success: true,
        data: { positions }
      });

    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching positions'
      });
    }
  }
}

module.exports = new EmployeeController();