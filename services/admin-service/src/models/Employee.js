const database = require('../utils/database');
const bcrypt = require('bcrypt');

class Employee {
  // Create new employee with user account
  static async create({ name, lastname, email, role, password, department, position, phone, address }) {
    return await database.transaction(async (client) => {
      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user account first
      const userResult = await client.query(`
        INSERT INTO users (name, lastname, email, password, role, active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id, name, lastname, email, role, active, created_at
      `, [name, lastname, email, hashedPassword, role]);

      const user = userResult.rows[0];

      // Create employee record
      const employeeResult = await client.query(`
        INSERT INTO employees (user_id, department, position, phone, address, hire_date)
        VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
        RETURNING *
      `, [user.id, department, position, phone, address]);

      const employee = employeeResult.rows[0];

      return {
        user,
        employee
      };
    });
  }

  // Get all employees with user information
  static async findAll({ page = 1, limit = 20, search = '', department = '', position = '', sortBy = 'hire_date', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE u.role IN (\'manager\', \'admin\') AND u.active = true';
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (u.name ILIKE $${paramCount} OR u.lastname ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (department) {
      paramCount++;
      whereClause += ` AND e.department = $${paramCount}`;
      queryParams.push(department);
    }

    if (position) {
      paramCount++;
      whereClause += ` AND e.position = $${paramCount}`;
      queryParams.push(position);
    }

    // Validate sort parameters
    const allowedSortFields = ['hire_date', 'name', 'email', 'department', 'position'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    if (!allowedSortFields.includes(sortBy)) sortBy = 'hire_date';
    if (!allowedSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      ${whereClause}
    `;
    const countResult = await database.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count);

    // Get employees
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const sortField = sortBy === 'name' ? 'u.name' : 
                     sortBy === 'email' ? 'u.email' : 
                     `e.${sortBy}`;

    const employeesQuery = `
      SELECT 
        e.id as employee_id,
        e.user_id,
        e.department,
        e.position,
        e.phone,
        e.address,
        e.hire_date,
        e.created_at as employee_created_at,
        u.id as user_id,
        u.name,
        u.lastname,
        u.email,
        u.role,
        u.active,
        u.created_at as user_created_at,
        u.last_login_at
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await database.query(employeesQuery, queryParams);

    return {
      employees: result.rows,
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

  // Get employee by ID with user information
  static async findById(id) {
    const result = await database.query(`
      SELECT 
        e.id as employee_id,
        e.user_id,
        e.department,
        e.position,
        e.phone,
        e.address,
        e.hire_date,
        e.created_at as employee_created_at,
        u.id as user_id,
        u.name,
        u.lastname,
        u.email,
        u.role,
        u.active,
        u.created_at as user_created_at,
        u.last_login_at
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE e.id = $1
    `, [id]);

    return result.rows[0];
  }

  // Get employee by user ID
  static async findByUserId(userId) {
    const result = await database.query(`
      SELECT 
        e.id as employee_id,
        e.user_id,
        e.department,
        e.position,
        e.phone,
        e.address,
        e.hire_date,
        e.created_at as employee_created_at,
        u.id as user_id,
        u.name,
        u.lastname,
        u.email,
        u.role,
        u.active,
        u.created_at as user_created_at,
        u.last_login_at
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE e.user_id = $1
    `, [userId]);

    return result.rows[0];
  }

  // Update employee information
  static async updateById(id, updateData) {
    return await database.transaction(async (client) => {
      // Get current employee
      const currentEmployee = await this.findById(id);
      if (!currentEmployee) {
        throw new Error('Employee not found');
      }

      // Separate user and employee fields
      const userFields = ['name', 'lastname', 'email', 'role', 'active'];
      const employeeFields = ['department', 'position', 'phone', 'address'];

      const userUpdates = {};
      const employeeUpdates = {};

      Object.entries(updateData).forEach(([key, value]) => {
        if (userFields.includes(key) && value !== undefined) {
          userUpdates[key] = value;
        } else if (employeeFields.includes(key) && value !== undefined) {
          employeeUpdates[key] = value;
        }
      });

      let updatedUser = null;
      let updatedEmployee = null;

      // Update user if there are user fields to update
      if (Object.keys(userUpdates).length > 0) {
        const userUpdateFields = [];
        const userValues = [];
        let paramCount = 0;

        Object.entries(userUpdates).forEach(([key, value]) => {
          paramCount++;
          userUpdateFields.push(`${key} = $${paramCount}`);
          userValues.push(value);
        });

        paramCount++;
        userValues.push(new Date());
        userUpdateFields.push(`updated_at = $${paramCount}`);

        paramCount++;
        userValues.push(currentEmployee.user_id);

        const userUpdateQuery = `
          UPDATE users 
          SET ${userUpdateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id, name, lastname, email, role, active, created_at, updated_at
        `;

        const userResult = await client.query(userUpdateQuery, userValues);
        updatedUser = userResult.rows[0];
      }

      // Update employee if there are employee fields to update
      if (Object.keys(employeeUpdates).length > 0) {
        const employeeUpdateFields = [];
        const employeeValues = [];
        let paramCount = 0;

        Object.entries(employeeUpdates).forEach(([key, value]) => {
          paramCount++;
          employeeUpdateFields.push(`${key} = $${paramCount}`);
          employeeValues.push(value);
        });

        paramCount++;
        employeeValues.push(id);

        const employeeUpdateQuery = `
          UPDATE employees 
          SET ${employeeUpdateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `;

        const employeeResult = await client.query(employeeUpdateQuery, employeeValues);
        updatedEmployee = employeeResult.rows[0];
      }

      // Return updated employee with user info
      return await this.findById(id);
    });
  }

  // Deactivate employee (sets user as inactive)
  static async deactivateById(id) {
    return await database.transaction(async (client) => {
      const employee = await this.findById(id);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Deactivate user account
      await client.query(
        'UPDATE users SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [employee.user_id]
      );

      return { id, deactivated: true };
    });
  }

  // Get employee statistics
  static async getStatistics() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE u.active = true) as active_employees,
        COUNT(*) FILTER (WHERE u.active = false) as inactive_employees,
        COUNT(*) FILTER (WHERE u.role = 'manager') as managers,
        COUNT(*) FILTER (WHERE u.role = 'admin') as admins,
        COUNT(*) FILTER (WHERE e.hire_date >= CURRENT_DATE - INTERVAL '30 days') as new_hires_last_30_days,
        COUNT(DISTINCT e.department) as total_departments,
        COUNT(DISTINCT e.position) as total_positions
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
    `;

    const result = await database.query(statsQuery);
    return result.rows[0];
  }

  // Get departments list
  static async getDepartments() {
    const result = await database.query(`
      SELECT 
        department,
        COUNT(*) as employee_count
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE u.active = true
      GROUP BY department
      ORDER BY employee_count DESC
    `);

    return result.rows;
  }

  // Get positions list
  static async getPositions() {
    const result = await database.query(`
      SELECT 
        position,
        COUNT(*) as employee_count
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE u.active = true
      GROUP BY position
      ORDER BY employee_count DESC
    `);

    return result.rows;
  }
}

module.exports = Employee;