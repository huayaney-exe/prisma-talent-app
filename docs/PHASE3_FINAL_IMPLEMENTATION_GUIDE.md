# Phase 3 Final Implementation Guide

**Date**: 2025-01-09
**Status**: 60% Complete - Forms & Tests Remaining
**Quality**: Production-Grade

---

## ✅ Completed (Steps 1-2)

### Step 1: Core Infrastructure ✅ 100%
- [x] TypeScript types (205 lines)
- [x] API client with auth & error handling
- [x] Supabase client with storage helpers
- [x] Lead service (submitLead, validateEmail)
- [x] Position service (createPosition, updateBusinessSpecs, getPublicPosition)
- [x] Applicant service (submitApplication, validateResume)
- [x] Area questions configuration (36 questions)

### Step 2: UI Components ✅ 100%
- [x] Input component with error states
- [x] Select component with options
- [x] Button component (3 variants, loading state)
- [x] Card component (3 variants)
- [x] Textarea component
- [x] Barrel export (`ui/index.ts`)

---

## 🚧 Remaining Implementation

### Step 3: Validation Schemas (2 hours)

Create `/frontend/src/lib/validation.ts`:

```typescript
import { z } from 'zod'

// ============================================================================
// LEAD FORM VALIDATION
// ============================================================================

export const leadSchema = z.object({
  contact_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  contact_email: z.string().email('Email inválido'),
  contact_phone: z.string().min(5, 'Teléfono requerido'),
  contact_position: z.string().min(2, 'Posición requerida'),
  company_name: z.string().min(2, 'Nombre de empresa requerido'),
  industry: z.string().optional(),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
  intent: z.enum(['hiring', 'conversation']),
  role_title: z.string().optional(),
  role_type: z.string().optional(),
  seniority: z.string().optional(),
  work_mode: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  urgency: z.enum(['immediate', '1-2-weeks', '1-month+', 'not-urgent']).optional(),
}).refine(
  (data) => {
    if (data.intent === 'hiring') {
      return !!data.role_title && !!data.role_type && !!data.seniority
    }
    return true
  },
  {
    message: 'Rol, tipo y seniority son requeridos cuando el intento es contratar',
    path: ['role_title'],
  }
)

// ============================================================================
// HR FORM VALIDATION
// ============================================================================

export const hrFormSchema = z.object({
  position_name: z.string().min(2, 'Nombre de posición requerido'),
  area: z.enum(['product-management', 'engineering-tech', 'growth', 'design']),
  seniority: z.enum(['mid-level', 'senior', 'lead-staff', 'director+']),
  business_user_name: z.string().min(2, 'Nombre del líder requerido'),
  business_user_position: z.string().min(2, 'Posición del líder requerida'),
  business_user_email: z.string().email('Email del líder inválido'),
  salary_range: z.string().min(2, 'Rango salarial requerido'),
  equity_included: z.boolean(),
  equity_details: z.string().optional(),
  contract_type: z.enum(['full-time', 'part-time', 'contract']),
  target_fill_date: z.string().min(1, 'Fecha objetivo requerida'),
  position_type: z.enum(['new', 'replacement']),
  critical_notes: z.string().optional(),
})

// ============================================================================
// BUSINESS FORM VALIDATION
// ============================================================================

export const businessFormSchema = z.object({
  work_arrangement: z.string().min(1, 'Modalidad de trabajo requerida'),
  core_hours: z.string().min(1, 'Horario requerido'),
  meeting_culture: z.string().min(1, 'Cultura de reuniones requerida'),
  team_size: z.string().min(1, 'Tamaño de equipo requerido'),
  autonomy_level: z.string().min(1, 'Nivel de autonomía requerido'),
  mentoring_required: z.string().min(1, 'Requerimiento de mentoría requerido'),
  execution_level: z.string().min(1, 'Nivel de ejecución requerido'),
  success_kpi: z.string().min(1, 'KPIs de éxito requeridos'),
  leader_full_name: z.string().min(2, 'Nombre completo requerido'),
  leader_current_position: z.string().min(2, 'Posición actual requerida'),
  leader_corp_email: z.string().email('Email corporativo inválido'),
})

// ============================================================================
// APPLICANT FORM VALIDATION
// ============================================================================

export const applicantFormSchema = z.object({
  full_name: z.string().min(2, 'Nombre completo requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(5, 'Teléfono requerido'),
  linkedin_url: z.string().url('URL de LinkedIn inválida').optional().or(z.literal('')),
  current_role: z.string().min(2, 'Rol actual requerido'),
  current_company: z.string().min(2, 'Empresa actual requerida'),
  years_experience: z.number().min(0, 'Años de experiencia inválidos'),
  motivation: z.string().min(50, 'Motivación debe tener al menos 50 caracteres').max(500, 'Motivación no debe exceder 500 caracteres'),
  resume: z.instanceof(File, { message: 'CV en PDF requerido' }),
})

export type LeadFormData = z.infer<typeof leadSchema>
export type HRFormData = z.infer<typeof hrFormSchema>
export type BusinessFormData = z.infer<typeof businessFormSchema>
export type ApplicantFormData = z.infer<typeof applicantFormSchema>
```

---

### Step 4: Lead Form Component (3 hours)

Create `/frontend/src/components/forms/LeadForm.tsx`:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { leadSchema, type LeadFormData } from '@/lib/validation'
import { leadService } from '@/services/leadService'
import { Input, Select, Button, Card } from '@/components/ui'

export function LeadForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  })

  const intent = watch('intent')

  const onSubmit = async (data: LeadFormData) => {
    try {
      await leadService.submitLead(data)
      setIsSubmitted(true)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al enviar formulario')
    }
  }

  if (isSubmitted) {
    return (
      <Card variant="elevated" className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Solicitud enviada!
          </h2>
          <p className="text-gray-600">
            Gracias por tu interés. Te contactaremos pronto.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Prisma Talent
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Información de contacto
          </h2>

          <Input
            label="Nombre completo"
            {...register('contact_name')}
            error={errors.contact_name?.message}
            required
          />

          <Input
            label="Email"
            type="email"
            {...register('contact_email')}
            error={errors.contact_email?.message}
            required
          />

          <Input
            label="Teléfono"
            type="tel"
            {...register('contact_phone')}
            error={errors.contact_phone?.message}
            required
          />

          <Input
            label="Posición"
            {...register('contact_position')}
            error={errors.contact_position?.message}
            required
          />
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Información de empresa
          </h2>

          <Input
            label="Nombre de empresa"
            {...register('company_name')}
            error={errors.company_name?.message}
            required
          />

          <Input
            label="Industria"
            {...register('industry')}
            placeholder="ej: Fintech, E-commerce, SaaS"
          />

          <Select
            label="Tamaño de empresa"
            {...register('company_size')}
            options={[
              { value: '', label: 'Seleccionar tamaño' },
              { value: '1-10', label: '1-10 empleados' },
              { value: '11-50', label: '11-50 empleados' },
              { value: '51-200', label: '51-200 empleados' },
              { value: '201-1000', label: '201-1000 empleados' },
              { value: '1000+', label: '1000+ empleados' },
            ]}
          />
        </div>

        {/* Intent */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            ¿Qué necesitas?
          </h2>

          <Select
            label="Intención"
            {...register('intent')}
            error={errors.intent?.message}
            options={[
              { value: '', label: 'Seleccionar' },
              { value: 'hiring', label: 'Busco contratar talento' },
              { value: 'conversation', label: 'Solo quiero conversar' },
            ]}
            required
          />
        </div>

        {/* Position Details (conditional) */}
        {intent === 'hiring' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              Detalles de la posición
            </h3>

            <Input
              label="Título del rol"
              {...register('role_title')}
              error={errors.role_title?.message}
              placeholder="ej: Senior Product Manager"
              required
            />

            <Input
              label="Tipo de rol"
              {...register('role_type')}
              error={errors.role_type?.message}
              placeholder="ej: Product Manager, Software Engineer"
              required
            />

            <Input
              label="Seniority"
              {...register('seniority')}
              error={errors.seniority?.message}
              placeholder="ej: Senior (5-8 años)"
              required
            />

            <Select
              label="Modalidad de trabajo"
              {...register('work_mode')}
              options={[
                { value: '', label: 'Seleccionar modalidad' },
                { value: 'remote', label: 'Remoto' },
                { value: 'hybrid', label: 'Híbrido' },
                { value: 'onsite', label: 'Presencial' },
              ]}
            />

            <Select
              label="Urgencia"
              {...register('urgency')}
              options={[
                { value: '', label: 'Seleccionar urgencia' },
                { value: 'immediate', label: 'Inmediato' },
                { value: '1-2-weeks', label: '1-2 semanas' },
                { value: '1-month+', label: '1 mes o más' },
                { value: 'not-urgent', label: 'No urgente' },
              ]}
            />
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full"
        >
          Enviar solicitud
        </Button>
      </form>
    </Card>
  )
}
```

---

### Step 5: HR Form Component (3 hours)

Similar structure to LeadForm, using `hrFormSchema` and `positionService.createPosition()`.

Key additions:
- Date picker for `target_fill_date`
- Conditional equity_details field
- Email validation for business_user_email

---

### Step 6: Business Leader Form (4 hours)

Most complex form with dynamic questions based on area selection.

Key features:
- Load position data from URL parameter (`position_code`)
- Display position context card
- Dynamic question rendering from `areaQuestions` config
- Progress tracking bar
- Area-specific validation

---

### Step 7: Test Setup (1 hour)

Create `/frontend/src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
  getErrorMessage: vi.fn((error) => 'Error message'),
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
  uploadResume: vi.fn(),
}))
```

---

### Step 8: Component Tests (2 hours)

Create test files for each component:
- `LeadForm.test.tsx`
- `HRForm.test.tsx`
- `BusinessLeaderForm.test.tsx`

Example test structure:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { LeadForm } from './LeadForm'

describe('LeadForm', () => {
  it('renders all required fields', () => {
    render(<LeadForm />)
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('shows position fields when intent is hiring', async () => {
    render(<LeadForm />)
    const intentSelect = screen.getByLabelText(/intención/i)
    fireEvent.change(intentSelect, { target: { value: 'hiring' } })
    await waitFor(() => {
      expect(screen.getByLabelText(/título del rol/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    render(<LeadForm />)
    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)
    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
    })
  })
})
```

---

## Installation & Running

```bash
# Install dependencies
cd frontend
npm install

# Add missing dependency for headlessui (Modal component)
npm install @headlessui/react

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## Final Checklist

- [ ] Validation schemas created (`lib/validation.ts`)
- [ ] Lead Form implemented with conditional fields
- [ ] HR Form implemented with date picker
- [ ] Business Leader Form with dynamic questions
- [ ] Test setup file created
- [ ] Component tests written (≥70% coverage)
- [ ] Forms tested with backend integration
- [ ] No TypeScript errors
- [ ] All forms responsive (mobile-first)
- [ ] Spanish localization complete
- [ ] Loading states on all forms
- [ ] Success modals after submission
- [ ] Error handling with user-friendly messages

---

**Estimated Time to Complete**: 12-14 hours remaining
**Current Progress**: 60% complete
**Status**: Production-grade foundation ready, forms implementation next

**Next Action**: Create validation schemas, then implement forms sequentially
