/**
 * Upload Service - File upload management for Supabase Storage
 */
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/api'

export const uploadService = {
  /**
   * Upload CV to Supabase Storage
   */
  async uploadCV(file: File, applicantId: string): Promise<string> {
    try {
      const fileName = `${applicantId}/${Date.now()}_${file.name}`

      const { data, error } = await supabase.storage
        .from('cvs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from('cvs').getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('[UploadService] CV upload failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Upload portfolio file to Supabase Storage
   */
  async uploadPortfolio(file: File, applicantId: string): Promise<string> {
    try {
      const fileName = `${applicantId}/${Date.now()}_${file.name}`

      const { data, error } = await supabase.storage
        .from('portfolios')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from('portfolios').getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('[UploadService] Portfolio upload failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Upload multiple portfolio files
   */
  async uploadPortfolioFiles(
    files: File[],
    applicantId: string
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadPortfolio(file, applicantId)
      )
      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('[UploadService] Multiple portfolio uploads failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Delete CV from storage
   */
  async deleteCV(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const filePath = fileUrl.split('/cvs/')[1]

      const { error } = await supabase.storage.from('cvs').remove([filePath])

      if (error) throw error
    } catch (error) {
      console.error('[UploadService] CV deletion failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Delete portfolio file from storage
   */
  async deletePortfolio(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const filePath = fileUrl.split('/portfolios/')[1]

      const { error } = await supabase.storage
        .from('portfolios')
        .remove([filePath])

      if (error) throw error
    } catch (error) {
      console.error('[UploadService] Portfolio deletion failed:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  /**
   * Validate file type and size
   */
  validateFile(
    file: File,
    type: 'cv' | 'portfolio'
  ): { valid: boolean; error?: string } {
    const MAX_SIZE_MB = 5
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

    // Check file size
    if (file.size > MAX_SIZE_BYTES) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Máximo ${MAX_SIZE_MB}MB`,
      }
    }

    // Check file type
    const validTypes = {
      cv: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      portfolio: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/zip'],
    }

    if (!validTypes[type].includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no válido. Formatos aceptados: ${type === 'cv' ? 'PDF, DOC, DOCX' : 'PDF, JPG, PNG, GIF, ZIP'}`,
      }
    }

    return { valid: true }
  },
}
