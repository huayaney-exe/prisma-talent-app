/**
 * Lead Form Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LeadForm } from '../LeadForm'
import { leadService } from '@/services/leadService'

vi.mock('@/services/leadService', () => ({
  leadService: {
    submitLead: vi.fn(),
  },
}))

describe('LeadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  it('renders form with all required fields', () => {
    render(<LeadForm />)

    expect(screen.getByText('Conecta con Talento Curado')).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email corporativo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tu cargo actual/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre de la empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de conversación/i)).toBeInTheDocument()
  })

  it('does not show position fields initially', () => {
    render(<LeadForm />)

    expect(screen.queryByLabelText(/título del rol/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/tipo de rol/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/seniority/i)).not.toBeInTheDocument()
  })

  // ============================================================================
  // PROGRESSIVE DISCLOSURE TESTS
  // ============================================================================

  it('shows position fields when intent is "hiring"', async () => {
    render(<LeadForm />)

    const intentSelect = screen.getByLabelText(/tipo de conversación/i)
    fireEvent.change(intentSelect, { target: { value: 'hiring' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/título del rol/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/tipo de rol/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/modalidad de trabajo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/urgencia/i)).toBeInTheDocument()
    })
  })

  it('hides position fields when intent is "conversation"', async () => {
    render(<LeadForm />)

    const intentSelect = screen.getByLabelText(/tipo de conversación/i)

    // First select "hiring" to show fields
    fireEvent.change(intentSelect, { target: { value: 'hiring' } })
    await waitFor(() => {
      expect(screen.getByLabelText(/título del rol/i)).toBeInTheDocument()
    })

    // Then select "conversation" to hide fields
    fireEvent.change(intentSelect, { target: { value: 'conversation' } })
    await waitFor(() => {
      expect(screen.queryByLabelText(/título del rol/i)).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  it('shows validation errors for required fields', async () => {
    render(<LeadForm />)

    const submitButton = screen.getByRole('button', { name: /enviar solicitud/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/nombre debe tener al menos 2 caracteres/i)).toBeInTheDocument()
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    render(<LeadForm />)

    const emailInput = screen.getByLabelText(/email corporativo/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)

    const submitButton = screen.getByRole('button', { name: /enviar solicitud/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
    })
  })

  it('requires position fields when intent is "hiring"', async () => {
    render(<LeadForm />)

    // Fill basic fields
    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/email corporativo/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: '+51999999999' },
    })
    fireEvent.change(screen.getByLabelText(/tu cargo actual/i), {
      target: { value: 'CEO' },
    })
    fireEvent.change(screen.getByLabelText(/nombre de la empresa/i), {
      target: { value: 'Test Company' },
    })

    // Select "hiring" intent
    fireEvent.change(screen.getByLabelText(/tipo de conversación/i), {
      target: { value: 'hiring' },
    })

    const submitButton = screen.getByRole('button', { name: /enviar solicitud/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/título del rol.*requeridos cuando el intento es contratar/i)
      ).toBeInTheDocument()
    })
  })

  // ============================================================================
  // SUBMISSION TESTS
  // ============================================================================

  it('submits form with valid data', async () => {
    const mockResponse = {
      id: '123',
      company_id: '456',
      subscription_status: 'active',
      lead_submitted_at: '2024-01-01T00:00:00Z',
      message: 'Lead created successfully',
    }

    vi.mocked(leadService.submitLead).mockResolvedValue(mockResponse)

    render(<LeadForm />)

    // Fill form
    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/email corporativo/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: '+51999999999' },
    })
    fireEvent.change(screen.getByLabelText(/tu cargo actual/i), {
      target: { value: 'CEO' },
    })
    fireEvent.change(screen.getByLabelText(/nombre de la empresa/i), {
      target: { value: 'Test Company' },
    })
    fireEvent.change(screen.getByLabelText(/tipo de conversación/i), {
      target: { value: 'conversation' },
    })

    const submitButton = screen.getByRole('button', { name: /enviar solicitud/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(leadService.submitLead).toHaveBeenCalledWith({
        contact_name: 'Test User',
        contact_email: 'test@example.com',
        contact_phone: '+51999999999',
        contact_position: 'CEO',
        company_name: 'Test Company',
        intent: 'conversation',
        company_size: '',
        industry: '',
      })
    })

    // Should show success modal
    await waitFor(() => {
      expect(screen.getByText(/solicitud recibida/i)).toBeInTheDocument()
    })
  })

  it('handles submission errors', async () => {
    vi.mocked(leadService.submitLead).mockRejectedValue(
      new Error('Error al enviar el formulario')
    )

    render(<LeadForm />)

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/email corporativo/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: '+51999999999' },
    })
    fireEvent.change(screen.getByLabelText(/tu cargo actual/i), {
      target: { value: 'CEO' },
    })
    fireEvent.change(screen.getByLabelText(/nombre de la empresa/i), {
      target: { value: 'Test Company' },
    })
    fireEvent.change(screen.getByLabelText(/tipo de conversación/i), {
      target: { value: 'conversation' },
    })

    const submitButton = screen.getByRole('button', { name: /enviar solicitud/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/error al enviar el formulario/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // SUCCESS MODAL TESTS
  // ============================================================================

  it('closes success modal when close button is clicked', async () => {
    const mockResponse = {
      id: '123',
      company_id: '456',
      subscription_status: 'active',
      lead_submitted_at: '2024-01-01T00:00:00Z',
      message: 'Lead created successfully',
    }

    vi.mocked(leadService.submitLead).mockResolvedValue(mockResponse)

    render(<LeadForm />)

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/email corporativo/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: '+51999999999' },
    })
    fireEvent.change(screen.getByLabelText(/tu cargo actual/i), {
      target: { value: 'CEO' },
    })
    fireEvent.change(screen.getByLabelText(/nombre de la empresa/i), {
      target: { value: 'Test Company' },
    })
    fireEvent.change(screen.getByLabelText(/tipo de conversación/i), {
      target: { value: 'conversation' },
    })

    const submitButton = screen.getByRole('button', { name: /enviar solicitud/i })
    fireEvent.click(submitButton)

    // Wait for success modal
    await waitFor(() => {
      expect(screen.getByText(/solicitud recibida/i)).toBeInTheDocument()
    })

    // Click close button
    const closeButton = screen.getByRole('button', { name: /cerrar/i })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText(/solicitud recibida/i)).not.toBeInTheDocument()
    })
  })
})
