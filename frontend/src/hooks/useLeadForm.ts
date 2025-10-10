/**
 * Custom hook for lead form management
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { leadService } from '@/services/leadService'
import type { LeadFormData } from '@/types'

const leadSchema = z.object({
  contact_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  position: z.string().min(2, 'Posición requerida'),
  company_name: z.string().min(2, 'Nombre de empresa requerido'),
  contact_email: z.string().email('Email inválido'),
  contact_phone: z.string().min(8, 'Teléfono inválido'),
  intent: z.enum(['hiring', 'conversation']),
  role_title: z.string().optional(),
  role_type: z.string().optional(),
  level: z.string().optional(),
  work_mode: z.string().optional(),
  urgency: z.string().optional(),
  terms_acceptance: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
})

export function useLeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      terms_acceptance: false,
    },
  })

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await leadService.submitLead(data)
      setSubmitSuccess(true)
      form.reset()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al enviar formulario')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting,
    submitSuccess,
    error,
    resetSuccess: () => setSubmitSuccess(false),
  }
}
