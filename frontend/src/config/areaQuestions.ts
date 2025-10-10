/**
 * Area-specific questions for Business Leader Form
 * Extracted from vanilla JS leader-form.js
 * Source: .archive/vanilla-js/leader-form.js (lines 109-571)
 */

export interface QuestionOption {
  value: string;
  text: string;
}

export interface Question {
  id: string;
  label: string;
  type: 'select' | 'text' | 'textarea';
  required: boolean;
  options?: QuestionOption[];
  placeholder?: string;
}

export interface QuestionSet {
  icon: string;
  title: string;
  description: string;
  questions: Question[];
}

export const areaQuestions: Record<string, QuestionSet> = {
  'product-management': {
    icon: '🎯',
    title: 'Especificaciones de Product Management',
    description: 'Tu expertise en producto es clave para definir el perfil ideal',
    questions: [
      {
        id: 'customer_contact',
        label: '¿Hablará directamente con usuarios/clientes?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar frecuencia' },
          { value: 'weekly', text: 'Semanalmente' },
          { value: 'monthly', text: 'Mensualmente' },
          { value: 'occasionally', text: 'Ocasionalmente' },
          { value: 'no', text: 'No' },
        ],
      },
      {
        id: 'technical_level',
        label: '¿Qué tan técnico debe ser?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel técnico' },
          { value: 'high-technical', text: 'Entiende código y arquitectura' },
          { value: 'medium-technical', text: 'Habla fluido con developers' },
          { value: 'business-focused', text: 'Solo business y UX' },
        ],
      },
      {
        id: 'roadmap_scope',
        label: '¿Maneja roadmap completo o features específicas?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar scope' },
          { value: 'full-roadmap', text: 'Roadmap completo del producto' },
          { value: 'feature-specific', text: 'Features específicas' },
          { value: 'area-roadmap', text: 'Roadmap de área específica' },
        ],
      },
      {
        id: 'squad_size',
        label: '¿Cuántos developers y designers en el squad directo?',
        type: 'text',
        required: true,
        placeholder: 'ej: 4 developers, 2 designers',
      },
      {
        id: 'reports_to',
        label: '¿A quién reporta?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar superior' },
          { value: 'ceo', text: 'CEO' },
          { value: 'cpo', text: 'CPO' },
          { value: 'cto', text: 'CTO' },
          { value: 'head-product', text: 'Head of Product' },
        ],
      },
      {
        id: 'product_stage',
        label: '¿Stage del producto?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar stage' },
          { value: 'pre-pmf', text: 'Pre-PMF (buscando product-market fit)' },
          { value: 'pmf-confirmed', text: 'PMF confirmado' },
          { value: 'growth-accelerated', text: 'Growth acelerado' },
          { value: 'mature-product', text: 'Producto maduro' },
        ],
      },
      {
        id: 'business_model',
        label: '¿Modelo de negocio?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar modelo' },
          { value: 'b2b', text: 'B2B' },
          { value: 'b2c', text: 'B2C' },
          { value: 'b2b2c', text: 'B2B2C' },
          { value: 'marketplace', text: 'Marketplace' },
          { value: 'freemium', text: 'Freemium' },
          { value: 'subscription', text: 'Suscripción' },
        ],
      },
      {
        id: 'pricing_involvement',
        label: '¿Debe definir pricing o business model?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel' },
          { value: 'yes', text: 'Sí, definición directa' },
          { value: 'collaborate', text: 'Colabora en definición' },
          { value: 'no', text: 'No involucrado' },
        ],
      },
      {
        id: 'research_involvement',
        label: '¿Involved en customer development/research?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel' },
          { value: 'executes', text: 'Ejecuta directamente' },
          { value: 'collaborates', text: 'Colabora con research' },
          { value: 'receives', text: 'Recibe insights' },
        ],
      },
    ],
  },
  'engineering-tech': {
    icon: '⚙️',
    title: 'Especificaciones de Engineering/Tech',
    description: 'Tu conocimiento técnico es clave para encontrar el candidato ideal',
    questions: [
      {
        id: 'tech_stack',
        label: '¿Stack principal que debe dominar?',
        type: 'text',
        required: true,
        placeholder: 'ej: React + Node.js, Python + Django, Java + Spring',
      },
      {
        id: 'direct_reports',
        label: '¿Cuántos developers le reportarán directamente?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar cantidad' },
          { value: '0', text: '0 (Individual Contributor)' },
          { value: '1-3', text: '1-3 developers' },
          { value: '4-6', text: '4-6 developers' },
          { value: '7-10', text: '7-10 developers' },
          { value: '10+', text: '10+ developers' },
        ],
      },
      {
        id: 'role_type',
        label: '¿Individual contributor o management?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar tipo' },
          { value: 'ic-heavy', text: 'Código 80%+ (IC puro)' },
          { value: 'hybrid', text: 'Híbrido (código + management)' },
          { value: 'management', text: 'Management puro' },
        ],
      },
      {
        id: 'architecture',
        label: '¿Arquitectura actual?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar arquitectura' },
          { value: 'monolithic', text: 'Monolítica' },
          { value: 'microservices', text: 'Microservicios' },
          { value: 'hybrid', text: 'Híbrida' },
        ],
      },
      {
        id: 'cloud_provider',
        label: '¿Cloud provider principal?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar provider' },
          { value: 'aws', text: 'AWS' },
          { value: 'gcp', text: 'Google Cloud Platform' },
          { value: 'azure', text: 'Microsoft Azure' },
          { value: 'on-premise', text: 'On-premise' },
        ],
      },
      {
        id: 'code_reviews',
        label: '¿Debe hacer code reviews activamente?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar frecuencia' },
          { value: 'regular', text: 'Sí, regularmente' },
          { value: 'occasional', text: 'Ocasionalmente' },
          { value: 'no', text: 'No' },
        ],
      },
      {
        id: 'on_call',
        label: '¿Guardias on-call 24/7?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar modalidad' },
          { value: 'yes', text: 'Sí, guardias individuales' },
          { value: 'rotation', text: 'Rotación en equipo' },
          { value: 'no', text: 'No' },
        ],
      },
      {
        id: 'devops_responsibilities',
        label: '¿Responsabilidades DevOps?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel' },
          { value: 'full-devops', text: 'Deployment y infra completa' },
          { value: 'collaborate', text: 'Colabora con DevOps' },
          { value: 'no', text: 'No involucrado' },
        ],
      },
      {
        id: 'migration_projects',
        label: '¿Proyectos de migración/refactoring planeados?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar scope' },
          { value: 'major', text: 'Major (arquitectura, stack principal)' },
          { value: 'minor', text: 'Minor (librerías, optimizaciones)' },
          { value: 'no', text: 'No planeados' },
        ],
      },
    ],
  },
  growth: {
    icon: '📈',
    title: 'Especificaciones de Growth',
    description: 'Tu expertise en growth es esencial para definir el perfil',
    questions: [
      {
        id: 'growth_focus',
        label: '¿Enfoque principal?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar enfoque' },
          { value: 'acquisition', text: 'Acquisition (nuevos usuarios)' },
          { value: 'retention', text: 'Retention (usuarios existentes)' },
          { value: 'revenue', text: 'Revenue expansion' },
          { value: 'hybrid', text: 'Híbrido (múltiples áreas)' },
        ],
      },
      {
        id: 'execution_level',
        label: '¿Debe ejecutar campañas directamente?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel' },
          { value: 'hands-on', text: 'Sí, hands-on completo' },
          { value: 'supervise', text: 'Supervisa ejecución' },
          { value: 'strategy', text: 'Solo estrategia' },
        ],
      },
      {
        id: 'budget_management',
        label: '¿Maneja budget de marketing directamente?',
        type: 'text',
        required: true,
        placeholder: 'ej: $10K/mes, No maneja budget, Aprueba gastos hasta $5K',
      },
      {
        id: 'current_channels',
        label: '¿Canales principales actuales?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar canal principal' },
          { value: 'paid-ads', text: 'Paid ads (Google, Facebook, etc.)' },
          { value: 'content', text: 'Content marketing' },
          { value: 'email', text: 'Email marketing' },
          { value: 'organic', text: 'Organic/SEO' },
          { value: 'partnerships', text: 'Partnerships' },
        ],
      },
      {
        id: 'technical_analysis',
        label: '¿Debe hacer análisis técnico?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel técnico' },
          { value: 'sql-tools', text: 'SQL y data tools directo' },
          { value: 'collaborate', text: 'Colabora con data team' },
          { value: 'receives', text: 'Recibe reportes preparados' },
        ],
      },
      {
        id: 'ab_testing',
        label: '¿A/B testing hands-on?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel' },
          { value: 'configures', text: 'Configura y analiza experimentos' },
          { value: 'supervises', text: 'Supervisa experimentos' },
          { value: 'collaborates', text: 'Colabora en diseño' },
        ],
      },
      {
        id: 'product_integration',
        label: '¿Trabaja con producto en growth features?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel integración' },
          { value: 'integrated', text: 'Muy integrado (define features)' },
          { value: 'collaborates', text: 'Colabora regularmente' },
          { value: 'independent', text: 'Trabaja independiente' },
        ],
      },
      {
        id: 'international',
        label: '¿International expansion en scope?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar scope' },
          { value: 'active', text: 'Sí, activamente trabajando' },
          { value: 'future', text: 'Futuro (6-12 meses)' },
          { value: 'no', text: 'No en scope' },
        ],
      },
      {
        id: 'reports_to_growth',
        label: '¿Reporta a?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar superior' },
          { value: 'ceo', text: 'CEO' },
          { value: 'cmo', text: 'CMO' },
          { value: 'head-growth', text: 'Head of Growth' },
          { value: 'cpo', text: 'CPO' },
        ],
      },
    ],
  },
  design: {
    icon: '🎨',
    title: 'Especificaciones de Design',
    description: 'Tu expertise en diseño es fundamental para el perfil',
    questions: [
      {
        id: 'design_type',
        label: '¿Tipo principal de diseño?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar tipo principal' },
          { value: 'ux-research', text: 'UX Research' },
          { value: 'ui-design', text: 'UI Design' },
          { value: 'visual-design', text: 'Visual Design' },
          { value: 'ux-ui-hybrid', text: 'Híbrido UX+UI' },
        ],
      },
      {
        id: 'user_research',
        label: '¿Debe hacer user research directamente?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel' },
          { value: 'executes', text: 'Sí, ejecuta research' },
          { value: 'collaborates', text: 'Colabora con research team' },
          { value: 'receives', text: 'Recibe insights preparados' },
        ],
      },
      {
        id: 'design_system',
        label: '¿Maneja design system?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar rol' },
          { value: 'creates-maintains', text: 'Crea y mantiene' },
          { value: 'contributes', text: 'Contribuye a existente' },
          { value: 'uses-existing', text: 'Utiliza existente' },
        ],
      },
      {
        id: 'platform',
        label: '¿Plataforma principal?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar plataforma' },
          { value: 'web', text: 'Web' },
          { value: 'mobile', text: 'Mobile' },
          { value: 'both', text: 'Ambas (web + mobile)' },
          { value: 'desktop', text: 'Desktop' },
        ],
      },
      {
        id: 'team_structure',
        label: '¿Trabaja solo o con otros designers?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar estructura' },
          { value: 'solo', text: 'Único designer' },
          { value: 'small-team', text: 'Equipo pequeño (2-3)' },
          { value: 'large-team', text: 'Equipo grande (4+)' },
        ],
      },
      {
        id: 'brand_involvement',
        label: '¿Brand design involved?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar scope' },
          { value: 'product-only', text: 'Solo producto' },
          { value: 'also-marketing', text: 'También marketing' },
          { value: 'also-brand', text: 'También brand' },
        ],
      },
      {
        id: 'prototyping',
        label: '¿Prototyping hands-on?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel' },
          { value: 'figma-advanced', text: 'Figma avanzado' },
          { value: 'code-tools', text: 'Herramientas de código' },
          { value: 'basic', text: 'Prototyping básico' },
        ],
      },
      {
        id: 'usability_testing',
        label: '¿Usability testing execution?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar nivel' },
          { value: 'plans-executes', text: 'Planifica y ejecuta' },
          { value: 'collaborates', text: 'Colabora en testing' },
          { value: 'receives', text: 'Recibe resultados' },
        ],
      },
      {
        id: 'reports_to_design',
        label: '¿Reporta a?',
        type: 'select',
        required: true,
        options: [
          { value: '', text: 'Seleccionar superior' },
          { value: 'cpo', text: 'CPO' },
          { value: 'head-design', text: 'Head of Design' },
          { value: 'cto', text: 'CTO' },
          { value: 'ceo', text: 'CEO' },
        ],
      },
    ],
  },
};
