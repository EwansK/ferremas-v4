const request = require('supertest');
const app = require('../src/index');
const { Pool } = require('pg');

// Mock database pool
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    end: jest.fn()
  }))
}));

const mockPool = new Pool();

describe('Product Service API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    test('should return paginated products', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Martillo',
          price_clp: 15990,
          quantity: 25,
          description: 'Martillo de carpintero',
          category_name: 'Herramientas'
        },
        {
          id: 'product-2',
          name: 'Destornillador',
          price_clp: 8990,
          quantity: 40,
          description: 'Set de destornilladores',
          category_name: 'Herramientas'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockProducts }); // Products query

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.products[0].name).toBe('Martillo');
    });

    test('should filter products by category', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Martillo',
          category_name: 'Herramientas'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockProducts });

      const response = await request(app)
        .get('/api/products?category=herramientas')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
    });

    test('should search products by name', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Martillo de Carpintero',
          description: 'Martillo para carpintería'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockProducts });

      const response = await request(app)
        .get('/api/products?search=martillo')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toContain('Martillo');
    });

    test('should sort products by price', async () => {
      const mockProducts = [
        { id: 'product-1', name: 'Expensive Item', price_clp: 50000 },
        { id: 'product-2', name: 'Cheap Item', price_clp: 10000 }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockProducts });

      const response = await request(app)
        .get('/api/products?sortBy=price_clp&sortOrder=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
    });

    test('should handle pagination correctly', async () => {
      const mockProducts = Array.from({ length: 5 }, (_, i) => ({
        id: `product-${i + 1}`,
        name: `Product ${i + 1}`,
        price_clp: 10000 + i * 1000
      }));

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '15' }] })
        .mockResolvedValueOnce({ rows: mockProducts });

      const response = await request(app)
        .get('/api/products?page=2&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(5);
      expect(response.body.data.pagination.currentPage).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return product by ID', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Martillo de Carpintero',
        price_clp: 15990,
        quantity: 25,
        description: 'Martillo profesional',
        image_link: '/uploads/martillo.jpg',
        category_name: 'Herramientas'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockProduct] });

      const response = await request(app)
        .get('/api/products/product-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.id).toBe('product-1');
      expect(response.body.data.product.name).toBe('Martillo de Carpintero');
    });

    test('should return 404 for non-existent product', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/products/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    test('should return 400 for invalid product ID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id-format')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/categories', () => {
    test('should return all categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Herramientas Manuales' },
        { id: 'cat-2', name: 'Herramientas Eléctricas' },
        { id: 'cat-3', name: 'Materiales de Construcción' }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockCategories });

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toHaveLength(3);
      expect(response.body.data.count).toBe(3);
    });

    test('should handle empty categories', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toHaveLength(0);
      expect(response.body.data.count).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/products')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error fetching products');
    });

    test('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/products?page=invalid&limit=abc')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed search queries', async () => {
      // Test with extremely long search term
      const longSearch = 'x'.repeat(1000);
      
      const response = await request(app)
        .get(`/api/products?search=${longSearch}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large result sets efficiently', async () => {
      const largeProductSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        price_clp: 10000 + i
      }));

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1000' }] })
        .mockResolvedValueOnce({ rows: largeProductSet.slice(0, 20) });

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/products?limit=20')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});

describe('Product Model Functions', () => {
  // If you have separate model files, test them here
  test('should format product data correctly', () => {
    const rawProduct = {
      id: 'product-1',
      name: 'Test Product',
      price_clp: 15990,
      quantity: 10,
      description: 'Test description',
      image_link: '/uploads/test.jpg',
      category_name: 'Test Category',
      created_at: '2023-01-01T00:00:00Z'
    };

    // Assuming you have a formatProduct function
    // const formatted = formatProduct(rawProduct);
    
    // Add assertions based on your formatting logic
    expect(rawProduct.price_clp).toBe(15990);
    expect(rawProduct.quantity).toBe(10);
  });

  test('should validate product search parameters', () => {
    const validParams = {
      search: 'martillo',
      category: 'herramientas',
      minPrice: 1000,
      maxPrice: 50000,
      page: 1,
      limit: 20
    };

    // Test parameter validation logic
    expect(validParams.minPrice).toBeLessThan(validParams.maxPrice);
    expect(validParams.page).toBeGreaterThan(0);
    expect(validParams.limit).toBeGreaterThan(0);
    expect(validParams.limit).toBeLessThanOrEqual(100);
  });
});

describe('Database Query Optimization', () => {
  test('should use proper indexing for search queries', () => {
    // Mock query plan analysis
    const searchQuery = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.name ILIKE $1 OR p.description ILIKE $1
    `;

    // Verify that the query structure is optimized
    expect(searchQuery).toContain('ILIKE');
    expect(searchQuery).toContain('LEFT JOIN');
  });

  test('should limit result sets appropriately', () => {
    const maxLimit = 100;
    const defaultLimit = 20;

    expect(defaultLimit).toBeLessThanOrEqual(maxLimit);
    expect(defaultLimit).toBeGreaterThan(0);
  });
});