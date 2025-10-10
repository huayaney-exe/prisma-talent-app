/**
 * Job Description Editor Page - Rich text WYSIWYG editor for creating/editing job descriptions
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'
import { positionService } from '@/services/positionService'

// ============================================================================
// TYPES
// ============================================================================

interface PositionContext {
  position_code: string
  position_name: string
  company_name: string
  business_area: string
  seniority_level: string
  hr_data: {
    responsibilities: string[]
    requirements: string[]
    nice_to_have: string[]
  }
  business_data: {
    context: string
    success_criteria: string
    team_structure: string
  }
}

// ============================================================================
// EDITOR TOOLBAR COMPONENT
// ============================================================================

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null

  return (
    <div className="border-b border-gray-200 bg-gray-50 p-2 flex items-center space-x-1 flex-wrap gap-1">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('bold')
            ? 'bg-purple text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
        }`}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('italic')
            ? 'bg-purple text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
        }`}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('bulletList')
            ? 'bg-purple text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
        }`}
      >
        Bullet List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('orderedList')
            ? 'bg-purple text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
        }`}
      >
        Numbered List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('heading', { level: 2 })
            ? 'bg-purple text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
        }`}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('heading', { level: 3 })
            ? 'bg-purple text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
        }`}
      >
        H3
      </button>
      <div className="border-l border-gray-300 h-6 mx-2"></div>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="px-3 py-1 rounded text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Undo
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="px-3 py-1 rounded text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Redo
      </button>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function JobDescriptionEditorPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [positionContext, setPositionContext] = useState<PositionContext | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Escribe la descripción del trabajo aquí...',
      }),
    ],
    content: '<p>Cargando...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
  })

  // Load position data from Supabase
  useEffect(() => {
    if (code) {
      loadPosition(code)
    }
  }, [code, editor])

  const loadPosition = async (positionCode: string) => {
    setIsLoading(true)
    try {
      const data = await positionService.getPositionByCode(positionCode)
      setPositionContext(data as any)
      if (editor && data.job_description) {
        editor.commands.setContent(data.job_description)
      }
    } catch (error) {
      console.error('Failed to load position:', error)
      alert('Error al cargar la posición')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!editor || !code) return

    const interval = setInterval(() => {
      handleAutoSave()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [editor, code])

  const handleAutoSave = async () => {
    if (!editor || !code) return

    setIsSaving(true)
    const content = editor.getHTML()

    try {
      await positionService.updateJobDescription(code, content)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleManualSave = async () => {
    if (!editor || !code) return

    setIsSaving(true)
    const content = editor.getHTML()

    try {
      await positionService.updateJobDescription(code, content)
      setLastSaved(new Date())
      alert('Descripción guardada exitosamente')
    } catch (error) {
      console.error('Save failed:', error)
      alert('Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-prisma-section">
      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-50 glassmorphism-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin/positions')}
                className="hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-purple)' }}
              >
                ← Posiciones
              </button>
              <span className="text-2xl text-gray-400">|</span>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-purple)' }}>
                JD Editor
              </span>
              {code && (
                <span className="text-sm text-gray-500 font-mono">({code})</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {lastSaved && (
                <span className="text-xs text-gray-500">
                  Guardado: {lastSaved.toLocaleTimeString('es-ES')}
                </span>
              )}
              {isSaving && (
                <span className="text-xs text-cyan">Guardando...</span>
              )}
              <Button onClick={handleSignOut} variant="secondary" size="sm">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor Section */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {/* Editor Controls */}
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPreview(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !isPreview
                        ? 'bg-purple text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    onClick={() => setIsPreview(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isPreview
                        ? 'bg-purple text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Preview
                  </button>
                </div>

                <Button onClick={handleManualSave} variant="primary" size="sm" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>

              {/* Toolbar */}
              {!isPreview && <EditorToolbar editor={editor} />}

              {/* Editor Content */}
              <div className="bg-white">
                {isPreview ? (
                  <div
                    className="prose prose-sm max-w-none p-4 min-h-[500px]"
                    dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }}
                  />
                ) : (
                  <EditorContent editor={editor} />
                )}
              </div>
            </Card>
          </div>

          {/* Position Context Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-black mb-4">Position Context</h3>

              {!positionContext ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm text-gray-600">
                    Cargando información de la posición...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Position Details */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalles</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Código:</span>{' '}
                        <span className="font-mono text-purple">
                          {positionContext.position_code}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Posición:</span>{' '}
                        {positionContext.position_name}
                      </div>
                      <div>
                        <span className="font-medium">Empresa:</span>{' '}
                        {positionContext.company_name}
                      </div>
                      <div>
                        <span className="font-medium">Área:</span>{' '}
                        {positionContext.business_area}
                      </div>
                      <div>
                        <span className="font-medium">Seniority:</span>{' '}
                        {positionContext.seniority_level}
                      </div>
                    </div>
                  </div>

                  {/* HR Data */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">HR Form Data</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-xs uppercase text-gray-500">
                          Responsabilidades
                        </span>
                        <ul className="list-disc list-inside text-gray-700 mt-1">
                          {positionContext.hr_data.responsibilities.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-xs uppercase text-gray-500">
                          Requisitos
                        </span>
                        <ul className="list-disc list-inside text-gray-700 mt-1">
                          {positionContext.hr_data.requirements.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Business Data */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Business Leader Data
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div>
                        <span className="font-medium text-xs uppercase text-gray-500">
                          Contexto
                        </span>
                        <p className="mt-1">{positionContext.business_data.context}</p>
                      </div>
                      <div>
                        <span className="font-medium text-xs uppercase text-gray-500">
                          Criterios de Éxito
                        </span>
                        <p className="mt-1">
                          {positionContext.business_data.success_criteria}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
