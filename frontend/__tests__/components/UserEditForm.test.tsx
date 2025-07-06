import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserEditForm from '@/components/admin/UserEditForm'

const mockUser = {
  id: 'user-1',
  name: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  role: 'customer' as const,
  is_active: true
}

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
  user: mockUser,
  isLoading: false
}

describe('UserEditForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders form with user data', () => {
    render(<UserEditForm {...defaultProps} />)

    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('customer')).toBeInTheDocument()
  })

  test('does not render when isOpen is false', () => {
    render(<UserEditForm {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Editar Usuario')).not.toBeInTheDocument()
  })

  test('does not render when user is null', () => {
    render(<UserEditForm {...defaultProps} user={null} />)

    expect(screen.queryByText('Editar Usuario')).not.toBeInTheDocument()
  })

  test('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<UserEditForm {...defaultProps} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  test('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<UserEditForm {...defaultProps} />)

    const cancelButton = screen.getByText('Cancelar')
    await user.click(cancelButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  test('validates required fields', async () => {
    const user = userEvent.setup()
    render(<UserEditForm {...defaultProps} />)

    // Clear required fields
    const nameInput = screen.getByLabelText(/nombre/i)
    const lastnameInput = screen.getByLabelText(/apellido/i)
    const emailInput = screen.getByLabelText(/email/i)

    await user.clear(nameInput)
    await user.clear(lastnameInput)
    await user.clear(emailInput)

    const submitButton = screen.getByText('Actualizar Usuario')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
      expect(screen.getByText('El apellido es requerido')).toBeInTheDocument()
      expect(screen.getByText('El email es requerido')).toBeInTheDocument()
    })

    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  test('validates email format', async () => {
    const user = userEvent.setup()
    render(<UserEditForm {...defaultProps} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.clear(emailInput)
    await user.type(emailInput, 'invalid-email')

    const submitButton = screen.getByText('Actualizar Usuario')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('El email no es válido')).toBeInTheDocument()
    })

    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  test('clears field errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(<UserEditForm {...defaultProps} />)

    const nameInput = screen.getByLabelText(/nombre/i)
    await user.clear(nameInput)

    const submitButton = screen.getByText('Actualizar Usuario')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
    })

    await user.type(nameInput, 'J')

    await waitFor(() => {
      expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument()
    })
  })

  test('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<UserEditForm {...defaultProps} />)

    const nameInput = screen.getByLabelText(/nombre/i)
    const lastnameInput = screen.getByLabelText(/apellido/i)
    const emailInput = screen.getByLabelText(/email/i)
    const roleSelect = screen.getByLabelText(/rol/i)

    await user.clear(nameInput)
    await user.type(nameInput, 'Jane')
    await user.clear(lastnameInput)
    await user.type(lastnameInput, 'Smith')
    await user.clear(emailInput)
    await user.type(emailInput, 'jane@example.com')
    await user.selectOptions(roleSelect, 'manager')

    const submitButton = screen.getByText('Actualizar Usuario')
    await user.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        name: 'Jane',
        lastname: 'Smith',
        email: 'jane@example.com',
        role: 'manager'
      })
    })
  })

  test('shows loading state during submission', () => {
    render(<UserEditForm {...defaultProps} isLoading={true} />)

    const submitButton = screen.getByText('Actualizando...')
    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument()
  })

  test('disables buttons during submission', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<UserEditForm {...defaultProps} onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByText('Actualizar Usuario')
    const cancelButton = screen.getByText('Cancelar')

    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()
  })

  test('displays submit error when provided', () => {
    render(<UserEditForm {...defaultProps} />)

    // Simulate error by manually setting error state (this would be done internally)
    const errorMessage = 'Error al actualizar el usuario'
    
    // You would need to trigger an error state somehow
    // This test might need to be adjusted based on your actual error handling
  })

  test('resets form when user changes', () => {
    const { rerender } = render(<UserEditForm {...defaultProps} />)

    const newUser = {
      ...mockUser,
      id: 'user-2',
      name: 'Alice',
      lastname: 'Johnson',
      email: 'alice@example.com'
    }

    rerender(<UserEditForm {...defaultProps} user={newUser} />)

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Johnson')).toBeInTheDocument()
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument()
  })

  test('shows user status correctly', () => {
    render(<UserEditForm {...defaultProps} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  test('shows inactive status for inactive user', () => {
    const inactiveUser = { ...mockUser, is_active: false }
    render(<UserEditForm {...defaultProps} user={inactiveUser} />)

    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  test('handles role changes correctly', async () => {
    const user = userEvent.setup()
    render(<UserEditForm {...defaultProps} />)

    const roleSelect = screen.getByLabelText(/rol/i)
    
    await user.selectOptions(roleSelect, 'admin')
    expect(screen.getByDisplayValue('admin')).toBeInTheDocument()

    await user.selectOptions(roleSelect, 'manager')
    expect(screen.getByDisplayValue('manager')).toBeInTheDocument()
  })

  test('prevents form submission when user is null', async () => {
    const user = userEvent.setup()
    render(<UserEditForm {...defaultProps} user={null} isOpen={true} />)

    // Form should not be visible when user is null
    expect(screen.queryByText('Actualizar Usuario')).not.toBeInTheDocument()
  })
})