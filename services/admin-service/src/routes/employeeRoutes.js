const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { validateSchema, employeeSchemas } = require('../utils/validation');

// GET /employees - Get all employees with pagination and filtering
router.get('/', 
  validateSchema(employeeSchemas.getEmployeesQuery, 'query'),
  employeeController.getEmployees
);

// GET /employees/statistics - Get employee statistics
router.get('/statistics',
  employeeController.getEmployeeStatistics
);

// GET /employees/departments - Get departments list
router.get('/departments',
  employeeController.getDepartments
);

// GET /employees/positions - Get positions list
router.get('/positions',
  employeeController.getPositions
);

// GET /employees/:id - Get employee by ID
router.get('/:id',
  validateSchema(employeeSchemas.employeeId, 'params'),
  employeeController.getEmployeeById
);

// POST /employees - Create new employee
router.post('/',
  validateSchema(employeeSchemas.createEmployee, 'body'),
  employeeController.createEmployee
);

// PUT /employees/:id - Update employee
router.put('/:id',
  validateSchema(employeeSchemas.employeeId, 'params'),
  validateSchema(employeeSchemas.updateEmployee, 'body'),
  employeeController.updateEmployee
);

// DELETE /employees/:id - Deactivate employee
router.delete('/:id',
  validateSchema(employeeSchemas.employeeId, 'params'),
  employeeController.deactivateEmployee
);

module.exports = router;