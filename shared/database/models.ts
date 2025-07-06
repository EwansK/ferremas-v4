export interface Role {
  id: string;
  role_name: string;
}

export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  password_hash: string;
  role_id: string;
  active: boolean;
  created_at: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: Date;
  created_at: Date;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  quantity: number;
  price_clp: number;
  description?: string;
  image_link?: string;
  created_at: Date;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: Date;
}

export interface Order {
  id: string;
  user_id: string;
  total_clp: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_clp: number;
  created_at: Date;
}

// DTOs for API requests/responses
export interface CreateUserDTO {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role_id: string;
}

export interface UpdateUserDTO {
  name?: string;
  lastname?: string;
  active?: boolean;
}

export interface CreateProductDTO {
  category_id: string;
  name: string;
  quantity: number;
  price_clp: number;
  description?: string;
  image_link?: string;
}

export interface UpdateProductDTO {
  category_id?: string;
  name?: string;
  quantity?: number;
  price_clp?: number;
  description?: string;
  image_link?: string;
}

export interface CreateCategoryDTO {
  name: string;
}

export interface AddToCartDTO {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemDTO {
  quantity: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductWithDetails extends Product {
  category: Category;
  in_stock: boolean;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
  total_price_clp: number;
}

export interface UserWithRole extends User {
  role: Role;
}