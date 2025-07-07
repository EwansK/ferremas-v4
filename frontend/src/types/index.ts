// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
}

// User & Auth Types
export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: 'customer' | 'manager' | 'admin';
  active: boolean;
  created_at?: string;
  last_login?: string;
}

// Backend API User data structure (from the actual API response)
export interface ApiUser {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: 'customer' | 'manager' | 'admin';
  active: boolean;
  created_at?: string;
  last_login?: string;
}

export interface UsersResponse {
  users: ApiUser[];
  pagination: Pagination;
}

export interface UserResponse {
  user: User;
  activitySummary?: ActivitySummary;
}

export interface ActivitySummary {
  lastLogin?: string;
  totalLogins?: number;
  activitiesCount?: number;
}

export interface UpdateUserData {
  name?: string;
  lastname?: string;
  email?: string;
  role?: string;
  active?: boolean;
}
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  lastname: string;
  email: string;
  password: string;
}

// Product Types
export interface Category {
  id: string;
  name: string;
  product_count?: number;
  in_stock_count?: number;
  out_of_stock_count?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price_clp: number;
  price_usd?: number;
  quantity: number;
  in_stock: boolean;
  image_link?: string;
  category: {
    id: string;
    name: string;
  };
  created_at: string;
  stock_status?: 'in_stock' | 'out_of_stock';
}

export interface ProductFilters {
  category?: string;
  search?: string;
  sortBy?: 'name' | 'price_clp' | 'created_at' | 'quantity';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    sortBy: string;
    sortOrder: string;
  };
}

// Manager Types
export interface CreateProductData {
  name: string;
  description: string;
  price_clp: number;
  quantity: number;
  category_id: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id?: string;
}

export interface CreateCategoryData {
  name: string;
}

export interface UpdateCategoryData {
  name: string;
}

// Pagination Types
export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Component Props Types
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}
