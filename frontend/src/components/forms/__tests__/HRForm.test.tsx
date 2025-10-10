/**
 * HR Form Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HRForm } from '../HRForm'
import { positionService } from '@/services/positionService'

vi.mock('@/services/positionService', () => ({
  positionService: {
    createPosition: vi.fn(),
  },
}))

describe('HRForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  it('renders form with all required fields', () => {
    render(<HRForm />)

    expect(screen.getByText('Crear Nueva Posición')).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre de la posición/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^área$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^seniority$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre completo del líder/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cargo del líder/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email corporativo del líder/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rango salarial/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de contrato/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha objetivo de incorporación/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de posición/i)).toBeInTheDocument()
  })

  it('renders equity checkbox', () => {
    render(<HRForm />)

    const equityCheckbox = screen.getByLabelText(/incluye equity\/opciones/i)
    expect(equityCheckbox).toBeInTheDocument()
    expect(equityCheckbox).not.toBeChecked()
  })

  // ============================================================================
  // PROGRESSIVE DISCLOSURE TESTS
  // ============================================================================

  it('shows equity details field when equity checkbox is checked', async () => {
    render(<HRForm />)

    const equityCheckbox = screen.getByLabelText(/incluye equity\/opciones/i)
    expect(screen.queryByLabelText(/detalles del equity/i)).not.toBeInTheDocument()

    fireEvent.click(equityCheckbox)

    await waitFor(() => {
      expect(screen.getByLabelText(/detalles del equity/i)).toBeInTheDocument()
    })
  })

  it('hides equity details field when equity checkbox is unchecked', async () => {
    render(<HRForm />)

    const equityCheckbox = screen.getByLabelText(/incluye equity\/opciones/i)

    // First check to show field
    fireEvent.click(equityCheckbox)
    await waitFor(() => {
      expect(screen.getByLabelText(/detalles del equity/i)).toBeInTheDocument()
    })

    // Then uncheck to hide field
    fireEvent.click(equityCheckbox)
    await waitFor(() => {
      expect(screen.queryByLabelText(/detalles del equity/i)).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  it('shows validation errors for required fields', async () => {
    render(<HRForm />)

    const submitButton = screen.getByRole('button', {
      name: /crear posición y notificar líder/i,
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/nombre de posición requerido/i)).toBeInTheDocument()
      expect(screen.getByText(/email del líder inválido/i)).toBeInTheDocument()
    })
  })

  it('validates email format for business leader email', async () => {
    render(<HRForm />)

    const emailInput = screen.getByLabelText(/email corporativo del líder/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)

    const submitButton = screen.getByRole('button', {
      name: /crear posición y notificar líder/i,
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email del líder inválido/i)).toBeInTheDocument()
    })
  })

  it('validates date field', async () => {
    render(<HRForm />)

    const dateInput = screen.getByLabelText(/fecha objetivo de incorporación/i)
    fireEvent.change(dateInput, { target: { value: '' } })
    fireEvent.blur(dateInput)

    const submitButton = screen.getByRole('button', {
      name: /crear posición y notificar líder/i,
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/fecha objetivo requerida/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // SUBMISSION TESTS
  // ============================================================================

  it('submits form with valid data', async () => {
    const mockResponse = {
      id: '123',
      company_id: '456',
      position_code: 'POS-001',
      workflow_stage: 'hr_completed' as const,
      position_name: 'Senior Product Manager',
      area: 'product-management' as const,
      seniority: 'senior' as const,
      business_user_name: 'Test Leader',
      business_user_position: 'VP Product',
      business_user_email: 'leader@company.com',
      salary_range: '$100k-$150k',
      equity_included: false,
      contract_type: 'full-time' as const,
      target_fill_date: '2024-06-01',
      position_type: 'new' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    vi.mocked(positionService.createPosition).mockResolvedValue(mockResponse)

    render(<HRForm />)

    // Fill form
    fireEvent.change(screen.getByLabelText(/nombre de la posición/i), {
      target: { value: 'Senior Product Manager' },
    })
    fireEvent.change(screen.getByLabelText(/^área$/i), {
      target: { value: 'product-management' },
    })
    fireEvent.change(screen.getByLabelText(/^seniority$/i), {
      target: { value: 'senior' },
    })
    fireEvent.change(screen.getByLabelText(/nombre completo del líder/i), {
      target: { value: 'Test Leader' },
    })
    fireEvent.change(screen.getByLabelText(/cargo del líder/i), {
      target: { value: 'VP Product' },
    })
    fireEvent.change(screen.getByLabelText(/email corporativo del líder/i), {
      target: { value: 'leader@company.com' },
    })
    fireEvent.change(screen.getByLabelText(/rango salarial/i), {
      target: { value: '$100k-$150k' },
    })
    fireEvent.change(screen.getByLabelText(/tipo de contrato/i), {
      target: { value: 'full-time' },
    })
    fireEvent.change(screen.getByLabelText(/fecha objetivo de incorporación/i), {
      target: { value: '2024-06-01' },
    })
    fireEvent.change(screen.getByLabelText(/tipo de posición/i), {
      target: { value: 'new' },
    })

    const submitButton = screen.getByRole('button', {
      name: /crear posición y notificar líder/i,
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(positionService.createPosition).toHaveBeenCalledWith({
        position_name: 'Senior Product Manager',
        area: 'product-management',
        seniority: 'senior',
        business_user_name: 'Test Leader',
        business_user_position: 'VP Product',
        business_user_email: 'leader@company.com',
        salary_range: '$100k-$150k',
        equity_included: false,
        contract_type: 'full-time',
        target_fill_date: '2024-06-01',
        position_type: 'new',
        critical_notes: '',
        equity_details: '',
      })
    })

    // Should show success modal
    await waitFor(() => {
      expect(screen.getByText(/posición creada/i)).toBeInTheDocument()
      expect(screen.getByText('POS-001')).toBeInTheDocument()
    })
  })

  it('submits form with equity details when equity is included', async () => {
    const mockResponse = {
      id: '123',
      company_id: '456',
      position_code: 'POS-002',
      workflow_stage: 'hr_completed' as const,
      position_name: 'Staff Engineer',
      area: 'engineering-tech' as const,
      seniority: 'lead-staff' as const,
      business_user_name: 'Tech Leader',
      business_user_position: 'CTO',
      business_user_email: 'cto@company.com',
      salary_range: '$150k-$200k',
      equity_included: true,
      equity_details: '0.5% - 1.5% with 4-year vesting',
      contract_type: 'full-time' as const,
      target_fill_date: '2024-07-01',
      position_type: 'new' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    vi.mocked(positionService.createPosition).mockResolvedValue(mockResponse)

    render(<HRForm />)

    // Fill form with equity
    fireEvent.change(screen.getByLabelText(/nombre de la posición/i), {
      target: { value: 'Staff Engineer' },
    })
    fireEvent.change(screen.getByLabelText(/^área$/i), {
      target: { value: 'engineering-tech' },
    })
    fireEvent.change(screen.getByLabelText(/^seniority$/i), {
      target: { value: 'lead-staff' },
    })
    fireEvent.change(screen.getByLabelText(/nombre completo del líder/i), {
      target: { value: 'Tech Leader' },
    })
    fireEvent.change(screen.getByLabelText(/cargo del líder/i), {
      target: { value: 'CTO' },
    })
    fireEvent.change(screen.getByLabelText(/email corporativo del líder/i), {
      target: { value: 'cto@company.com' },
    })
    fireEvent.change(screen.getByLabelText(/rango salarial/i), {
      target: { value: '$150k-$200k' },
    })

    // Check equity checkbox
    fireEvent.click(screen.getByLabelText(/incluye equity\/opciones/i))

    await waitFor(() => {
      expect(screen.getByLabelText(/detalles del equity/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/detalles del equity/i), {
      target: { value: '0.5% - 1.5% with 4-year vesting' },
    })

    fireEvent.change(screen.getByLabelText(/tipo de contrato/i), {
      target: { value: 'full-time' },
    })
    fireEvent.change(screen.getByLabelText(/fecha objetivo de incorporación/i), {
      target: { value: '2024-07-01' },
    })
    fireEvent.change(screen.getByLabelText(/tipo de posición/i), {
      target: { value: 'new' },
    })

    const submitButton = screen.getByRole('button', {
      name: /crear posición y notificar líder/i,
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(positionService.createPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          equity_included: true,
          equity_details: '0.5% - 1.5% with 4-year vesting',
        })
      )
    })
  })

  it('handles submission errors', async () => {
    vi.mocked(positionService.createPosition).mockRejectedValue(
      new Error('Error al crear la posición')
    )

    render(<HRForm />)

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/nombre de la posición/i), {
      target: { value: 'Test Position' },
    })
    fireEvent.change(screen.getByLabelText(/^área$/i), {
      target: { value: 'product-management' },
    })
    fireEvent.change(screen.getByLabelText(/^seniority$/i), {
      target: { value: 'senior' },
    })
    fireEvent.change(screen.getByLabelText(/nombre completo del líder/i), {
      target: { value: 'Test Leader' },
    })
    fireEvent.change(screen.getByLabelText(/cargo del líder/i), {
      target: { value: 'VP' },
    })
    fireEvent.change(screen.getByLabelText(/email corporativo del líder/i), {
      target: { value: 'leader@company.com' },
    })
    fireEvent.change(screen.getByLabelText(/rango salarial/i), {
      target: { value: '$100k' },
    })
    fireEvent.change(screen.getByLabelText(/tipo de contrato/i), {
      target: { value: 'full-time' },
    })
    fireEvent.change(screen.getByLabelText(/fecha objetivo de incorporación/i), {
      target: { value: '2024-06-01' },
    })
    fireEvent.change(screen.getByLabelText(/tipo de posición/i), {
      target: { value: 'new' },
    })

    const submitButton = screen.getByRole('button', {
      name: /crear posición y notificar líder/i,
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/error al crear la posición/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // SUCCESS MODAL TESTS
  // ============================================================================

  it('closes success modal when close button is clicked', async () => {
    const mockResponse = {
      id: '123',
      company_id: '456',
      position_code: 'POS-003',
      workflow_stage: 'hr_completed' as const,
      position_name: 'Test Position',
      area: 'product-management' as const,
      seniority: 'senior' as const,
      business_user_name: 'Test Leader',
      business_user_position: 'VP',
      business_user_email: 'leader@company.com',
      salary_range: '$100k',
      equity_included: false,
      contract_type: 'full-time' as const,
      target_fill_date: '2024-06-01',
      position_type: 'new' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    vi.mocked(positionService.createPosition).mockResolvedValue(mockResponse)

    render(<HRForm />)

    // Fill and submit form (minimal data)
    fireEvent.change(screen.getByLabelText(/nombre de la posición/i), {
      target: { value: 'Test Position' },
    })
    fireEvent.change(screen.getByLabelText(/^área$/i), {
      target: { value: 'product-management' },
    })
    fireEvent.change(screen.getByLabelText(/^seniority$/i), {
      target: { value: 'senior' },
    })
    fireEvent.change(screen.getByLabelText(/nombre completo del líder/i), {
      target: { value: 'Test Leader' },
    })
    fireEvent.change(screen.getByLabelText(/cargo del líder/i), { target: { value: 'VP' } })
    fireEvent.change(screen.getByLabelText(/email corporativo del líder/i), {
      target: { value: 'leader@company.com' },
    })
    fireEvent.change(screen.getByLabelText(/rango salarial/i), {
      target: { value: '$100k' },
    })
    fireEvent.change(screen.getByLabelText(/tipo de contrato/i), {
      target: { value: 'full-time' },
    })
    fireEvent.change(screen.getByLabelText(/fecha objetivo de incorporación/i), {
      target: { value: '2024-06-01' },
    })
    fireEvent.change(screen.getByLabelText(/tipo de posición/i), {
      target: { value: 'new' },
    })

    const submitButton = screen.getByRole('button', {
      name: /crear posición y notificar líder/i,
    })
    fireEvent.click(submitButton)

    // Wait for success modal
    await waitFor(() => {
      expect(screen.getByText(/posición creada/i)).toBeInTheDocument()
    })

    // Click close button
    const closeButton = screen.getByRole('button', { name: /cerrar/i })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText(/posición creada/i)).not.toBeInTheDocument()
    })
  })
})
