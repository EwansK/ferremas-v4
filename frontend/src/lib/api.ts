import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import type {
  ApiResponse,
  LoginCredentials,
  RegisterData,
  LoginResponse,
  Product,
  ProductsResponse,
  ProductFilters,
  Category,
  CreateProductData,
  UpdateProductData,
  CreateCategoryData,
  UpdateCategoryData,
  UsersResponse,
  UserResponse,
  UpdateUserData,
} from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use different URLs for server-side vs client-side
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: use internal Docker service name for local dev, AWS internal URL for production
      this.baseURL = process.env.AWS_INTERNAL_API_URL || 'http://api-gateway:3000';
    } else {
      // Client-side: use public URL (AWS ALB/CloudFront or localhost)
      this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh or redirect to login
          this.clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper method to handle API responses
  private handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'API request failed');
  }

  // Helper method to handle API errors
  private handleError(error: AxiosError): never {
    if (error.response?.data) {
      const apiError = error.response.data as ApiResponse;
      throw new Error(apiError.message || 'API request failed');
    }
    throw new Error(error.message || 'Network error');
  }

  // Auth methods
  setAuthToken(token: string) {
    Cookies.set('accessToken', token, { expires: 1 }); // 1 day
  }

  clearAuth() {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
  }

  saveUser(user: { id: string; email: string; name: string; role: string }) {
    Cookies.set('user', JSON.stringify(user), { expires: 1 });
  }

  getUser() {
    const userStr = Cookies.get('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Authentication API
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await this.client.post<ApiResponse<LoginResponse>>('/api/auth/login', credentials);
      const data = this.handleResponse(response);
      
      // Save tokens and user
      this.setAuthToken(data.tokens.accessToken);
      Cookies.set('refreshToken', data.tokens.refreshToken, { expires: 7 });
      this.saveUser(data.user);
      
      return data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response = await this.client.post<ApiResponse<LoginResponse>>('/api/auth/register', userData);
      const data = this.handleResponse(response);
      
      // Save tokens and user
      this.setAuthToken(data.tokens.accessToken);
      Cookies.set('refreshToken', data.tokens.refreshToken, { expires: 7 });
      this.saveUser(data.user);
      
      return data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      this.clearAuth();
    }
  }

  // Product API
  async getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await this.client.get<ApiResponse<ProductsResponse>>(`/api/products?${params}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getProduct(id: string): Promise<Product> {
    try {
      const response = await this.client.get<ApiResponse<Product>>(`/api/products/${id}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getCategories(): Promise<{ categories: Category[]; count: number }> {
    try {
      const response = await this.client.get<ApiResponse<{ categories: Category[]; count: number }>>('/api/categories');
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Helper method to get the right endpoint - both admin and manager use manager endpoints
  private getManagerEndpoint(path: string): string {
    return `/api/manager${path}`;
  }

  // Manager API
  async createProduct(productData: CreateProductData): Promise<{ product: Product }> {
    try {
      const response = await this.client.post<ApiResponse<{ product: Product }>>(this.getManagerEndpoint('/products'), productData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async updateProduct(id: string, productData: UpdateProductData): Promise<{ product: Product }> {
    try {
      const response = await this.client.put<ApiResponse<{ product: Product }>>(this.getManagerEndpoint(`/products/${id}`), productData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await this.client.delete(this.getManagerEndpoint(`/products/${id}`));
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getManagerCategories(): Promise<{ categories: Category[]; count: number }> {
    try {
      const response = await this.client.get<ApiResponse<{ categories: Category[]; count: number }>>(this.getManagerEndpoint('/categories'));
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async createCategory(categoryData: CreateCategoryData): Promise<{ category: Category }> {
    try {
      const response = await this.client.post<ApiResponse<{ category: Category }>>(this.getManagerEndpoint('/categories'), categoryData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async updateCategory(id: string, categoryData: UpdateCategoryData): Promise<{ category: Category }> {
    try {
      const response = await this.client.put<ApiResponse<{ category: Category }>>(this.getManagerEndpoint(`/categories/${id}`), categoryData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await this.client.delete(this.getManagerEndpoint(`/categories/${id}`));
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getInventory(filters?: ProductFilters): Promise<ProductsResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await this.client.get<ApiResponse<ProductsResponse>>(this.getManagerEndpoint(`/products/inventory?${params}`));
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async updateStock(id: string, quantity: number): Promise<{ product: Product }> {
    try {
      const response = await this.client.put<ApiResponse<{ product: Product }>>(this.getManagerEndpoint(`/products/${id}/stock`), { quantity });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Admin API - User Management
  async getUsers(filters?: { page?: number; limit?: number; search?: string; role?: string }): Promise<UsersResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await this.client.get<ApiResponse<UsersResponse>>(`/api/admin/users?${params}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getUserById(id: string): Promise<UserResponse> {
    try {
      const response = await this.client.get<ApiResponse<UserResponse>>(`/api/admin/users/${id}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<UserResponse> {
    try {
      const response = await this.client.put<ApiResponse<UserResponse>>(`/api/admin/users/${id}`, userData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async deactivateUser(id: string): Promise<void> {
    try {
      await this.client.delete(`/api/admin/users/${id}`);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async reactivateUser(id: string): Promise<UserResponse> {
    try {
      const response = await this.client.post<ApiResponse<UserResponse>>(`/api/admin/users/${id}/reactivate`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Health check
  async getSystemHealth(): Promise<{ success: boolean; data?: { [key: string]: unknown } }> {
    try {
      const response = await this.client.get<ApiResponse<{ [key: string]: unknown }>>('/health/system');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Cart API methods
  async getCart(): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.get('/api/cart');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async addToCart(productId: string, quantity: number): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.post('/api/cart/items', 
        { product_id: productId, quantity }
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async updateCartQuantity(productId: string, quantity: number): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.put(`/api/cart/items/${productId}`, 
        { quantity }
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async removeFromCart(productId: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.delete(`/api/cart/items/${productId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async clearCart(): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.delete('/api/cart');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getCartCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await this.client.get('/api/cart/count');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async validateCart(): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.get('/api/cart/validate');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async mergeGuestCart(guestItems: unknown[]): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.post('/api/cart/merge', 
        { guest_cart_items: guestItems }
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async addMultipleToCart(items: { product_id: string; quantity: number }[]): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.post('/api/cart/items/bulk', 
        { items }
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export cart API functions for use in CartContext
export const cartAPI = {
  getCart: () => apiClient.getCart(),
  addItem: (productId: string, quantity: number) => apiClient.addToCart(productId, quantity),
  updateQuantity: (productId: string, quantity: number) => apiClient.updateCartQuantity(productId, quantity),
  removeItem: (productId: string) => apiClient.removeFromCart(productId),
  clearCart: () => apiClient.clearCart(),
  getCount: () => apiClient.getCartCount(),
  validateCart: () => apiClient.validateCart(),
  mergeGuestCart: (guestItems: unknown[]) => apiClient.mergeGuestCart(guestItems),
  addMultiple: (items: { product_id: string; quantity: number }[]) => apiClient.addMultipleToCart(items)
};

export default apiClient;
