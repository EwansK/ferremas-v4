import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import ProductCard from '@/components/ProductCard'

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
}

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider value={mockAuthContext as any}>
    {children}
  </AuthProvider>
)

const mockProduct = {
  id: 'product-1',
  name: 'Martillo de Carpintero',
  price_clp: 15990,
  quantity: 25,
  description: 'Martillo profesional para carpintería',
  image_link: '/uploads/martillo.jpg',
  category_name: 'Herramientas Manuales'
}

describe('ProductCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders product information correctly', () => {
    render(
      <MockAuthProvider>
        <ProductCard product={mockProduct} />
      </MockAuthProvider>
    )

    expect(screen.getByText('Martillo de Carpintero')).toBeInTheDocument()
    expect(screen.getByText('$15.990')).toBeInTheDocument()
    expect(screen.getByText('25 disponibles')).toBeInTheDocument()
    expect(screen.getByText('Herramientas Manuales')).toBeInTheDocument()
  })

  test('displays product image with correct alt text', () => {
    render(
      <MockAuthProvider>
        <ProductCard product={mockProduct} />
      </MockAuthProvider>
    )

    const image = screen.getByAltText('Martillo de Carpintero')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/uploads/martillo.jpg')
  })

  test('shows out of stock message when quantity is 0', () => {
    const outOfStockProduct = { ...mockProduct, quantity: 0 }
    
    render(
      <MockAuthProvider>
        <ProductCard product={outOfStockProduct} />
      </MockAuthProvider>
    )

    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(screen.queryByText('0 disponibles')).not.toBeInTheDocument()
  })

  test('shows low stock warning when quantity is low', () => {
    const lowStockProduct = { ...mockProduct, quantity: 3 }
    
    render(
      <MockAuthProvider>
        <ProductCard product={lowStockProduct} />
      </MockAuthProvider>
    )

    expect(screen.getByText('¡Últimas unidades!')).toBeInTheDocument()
    expect(screen.getByText('3 disponibles')).toBeInTheDocument()
  })

  test('formats price correctly with Chilean peso', () => {
    const expensiveProduct = { ...mockProduct, price_clp: 1299990 }
    
    render(
      <MockAuthProvider>
        <ProductCard product={expensiveProduct} />
      </MockAuthProvider>
    )

    expect(screen.getByText('$1.299.990')).toBeInTheDocument()
  })

  test('handles missing image gracefully', () => {
    const productWithoutImage = { ...mockProduct, image_link: null }
    
    render(
      <MockAuthProvider>
        <ProductCard product={productWithoutImage} />
      </MockAuthProvider>
    )

    const image = screen.getByAltText('Martillo de Carpintero')
    expect(image).toHaveAttribute('src', '/placeholder-product.jpg')
  })

  test('truncates long product names', () => {
    const longNameProduct = {
      ...mockProduct,
      name: 'Este es un nombre de producto muy largo que debería ser truncado para mantener el diseño consistente'
    }
    
    render(
      <MockAuthProvider>
        <ProductCard product={longNameProduct} />
      </MockAuthProvider>
    )

    const productName = screen.getByText(/Este es un nombre de producto muy largo/)
    expect(productName).toBeInTheDocument()
  })

  test('calls onAddToCart when add to cart button is clicked', () => {
    const mockOnAddToCart = jest.fn()
    
    render(
      <MockAuthProvider>
        <ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />
      </MockAuthProvider>
    )

    const addToCartButton = screen.getByText('Agregar al Carrito')
    fireEvent.click(addToCartButton)

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct)
  })

  test('disables add to cart button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, quantity: 0 }
    
    render(
      <MockAuthProvider>
        <ProductCard product={outOfStockProduct} />
      </MockAuthProvider>
    )

    const addToCartButton = screen.getByText('Agotado')
    expect(addToCartButton).toBeDisabled()
  })

  test('shows login prompt for unauthenticated users', () => {
    render(
      <MockAuthProvider>
        <ProductCard product={mockProduct} />
      </MockAuthProvider>
    )

    const addToCartButton = screen.getByText('Iniciar Sesión para Comprar')
    expect(addToCartButton).toBeInTheDocument()
  })

  test('shows add to cart for authenticated users', () => {
    const authenticatedContext = {
      ...mockAuthContext,
      isAuthenticated: true,
      user: { id: 'user-1', role: 'customer' }
    }

    render(
      <AuthProvider value={authenticatedContext as any}>
        <ProductCard product={mockProduct} />
      </AuthProvider>
    )

    expect(screen.getByText('Agregar al Carrito')).toBeInTheDocument()
  })
})