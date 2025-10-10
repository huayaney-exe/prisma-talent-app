-- Prisma Talent ATS - Sample Data for Testing
-- Test data to validate multi-tenant functionality
-- Project: prisma-talent (vhjjibfblrkyfzcukqwa)

-- =============================================================================
-- SAMPLE COMPANIES
-- =============================================================================

-- Company 1: Tech Startup
INSERT INTO companies (
  id,
  company_name,
  company_domain,
  industry,
  company_size,
  website_url,
  linkedin_url,
  subscription_status,
  subscription_plan,
  primary_contact_name,
  primary_contact_email,
  primary_contact_phone,
  onboarding_completed
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'TechFlow Innovations',
  'techflow.com',
  'Technology',
  '11-50',
  'https://techflow.com',
  'https://linkedin.com/company/techflow',
  'active',
  'pro',
  'Maria Rodriguez',
  'maria@techflow.com',
  '+51 999 888 777',
  true
);

-- Company 2: E-commerce Scale-up
INSERT INTO companies (
  id,
  company_name,
  company_domain,
  industry,
  company_size,
  website_url,
  subscription_status,
  primary_contact_name,
  primary_contact_email,
  primary_contact_phone,
  onboarding_completed
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'PeruShop Digital',
  'perushop.pe',
  'E-commerce',
  '51-200',
  'https://perushop.pe',
  'trial',
  'Carlos Mendoza',
  'carlos@perushop.pe',
  '+51 987 654 321',
  false
);

-- =============================================================================
-- SAMPLE HR USERS
-- =============================================================================

-- TechFlow HR Team
INSERT INTO hr_users (
  id,
  company_id,
  email,
  full_name,
  position_title,
  role,
  is_active,
  can_create_positions,
  can_manage_team,
  can_view_analytics
) VALUES
-- Company Admin
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'maria@techflow.com',
  'Maria Rodriguez',
  'Head of People',
  'company_admin',
  true,
  true,
  true,
  true
),
-- HR Manager
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'ana@techflow.com',
  'Ana Silva',
  'HR Manager',
  'hr_manager',
  true,
  true,
  true,
  false
),
-- HR User
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'luis@techflow.com',
  'Luis Fernandez',
  'HR Specialist',
  'hr_user',
  true,
  true,
  false,
  false
);

-- PeruShop HR Team
INSERT INTO hr_users (
  id,
  company_id,
  email,
  full_name,
  position_title,
  role,
  is_active,
  can_create_positions,
  can_manage_team
) VALUES
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '22222222-2222-2222-2222-222222222222',
  'carlos@perushop.pe',
  'Carlos Mendoza',
  'CEO & HR Lead',
  'company_admin',
  true,
  true,
  true
);

-- =============================================================================
-- SAMPLE POSITIONS
-- =============================================================================

-- TechFlow Positions
INSERT INTO positions (
  id,
  company_id,
  position_code,
  workflow_stage,
  position_name,
  area,
  seniority,
  leader_name,
  leader_position,
  leader_email,
  salary_range,
  equity_included,
  contract_type,
  timeline,
  position_type,
  critical_notes,
  work_arrangement,
  core_hours,
  meeting_culture,
  team_size,
  autonomy_level,
  mentoring_required,
  hands_on_vs_strategic,
  success_kpi,
  area_specific_data,
  hr_completed_at,
  leader_notified_at,
  leader_completed_at,
  created_by
) VALUES
-- Senior Product Manager (completed workflow)
(
  'pos11111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'POS_PM001',
  'active',
  'Senior Product Manager',
  'Product Management',
  'Senior 5-8 años',
  'Diego Vargas',
  'VP of Product',
  'diego@techflow.com',
  '$4,500-6,000 USD',
  true,
  'Tiempo completo',
  '2024-03-15',
  'Nueva posición',
  'Necesitamos alguien con experiencia en B2B SaaS',
  '3 días oficina, 2 remoto',
  '9-18 con overlap 10-16',
  'Balance estructurado',
  5,
  'Alta autonomía y ownership',
  true,
  'Híbrido estratégico y ejecución',
  'Incrementar product-market fit en 90 días',
  '{
    "customer_interaction": "semanalmente",
    "technical_depth": "habla fluido con developers",
    "roadmap_scope": "maneja roadmap completo",
    "team_composition": "3 developers, 2 designers",
    "reporting_structure": "VP of Product",
    "product_stage": "PMF confirmado",
    "business_model": "B2B SaaS",
    "pricing_responsibility": "colabora",
    "research_involvement": "colabora con research"
  }'::jsonb,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '4 days'
),
-- Full Stack Engineer (in progress)
(
  'pos22222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'POS_FS002',
  'leader_in_progress',
  'Full Stack Engineer',
  'Engineering-Tech',
  'Senior 5-8 años',
  'Roberto Chen',
  'CTO',
  'roberto@techflow.com',
  '$3,800-5,200 USD',
  true,
  'Tiempo completo',
  '2024-04-01',
  'Nueva posición',
  'Proyecto crítico de migración a microservicios',
  '2 días oficina, 3 remoto',
  '10-18 flexible',
  'Pocas reuniones, trabajo autónomo',
  8,
  'Alta autonomía y ownership',
  false,
  'Código 80%+',
  'Completar migración backend en 90 días',
  NULL,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '2 days',
  NULL
);

-- PeruShop Position
INSERT INTO positions (
  id,
  company_id,
  position_code,
  workflow_stage,
  position_name,
  area,
  seniority,
  leader_name,
  leader_position,
  leader_email,
  salary_range,
  contract_type,
  timeline,
  position_type,
  hr_completed_at,
  created_by
) VALUES
(
  'pos33333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'POS_GR003',
  'hr_completed',
  'Growth Marketing Manager',
  'Growth',
  'Mid-level 3-5 años',
  'Patricia Wong',
  'Head of Marketing',
  'patricia@perushop.pe',
  '$2,800-3,800 USD',
  'Tiempo completo',
  '2024-04-15',
  'Reemplazo',
  NOW() - INTERVAL '1 day',
  'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

-- =============================================================================
-- SAMPLE JOB DESCRIPTIONS
-- =============================================================================

INSERT INTO job_descriptions (
  id,
  company_id,
  position_id,
  generated_content,
  generation_model,
  hr_approved,
  leader_approved,
  version_number,
  is_current_version,
  final_approved_at,
  published_at,
  created_by
) VALUES
(
  'jd111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'pos11111-1111-1111-1111-111111111111',
  '# Senior Product Manager - TechFlow Innovations

## Acerca de la Posición
Buscamos un Senior Product Manager con 5-8 años de experiencia para liderar nuestra estrategia de producto B2B SaaS. Reportarás directamente al VP of Product y tendrás la responsabilidad de manejar el roadmap completo del producto.

## Responsabilidades Clave
- Liderar el roadmap de producto con autonomía completa
- Interactuar semanalmente con clientes para validar hipótesis
- Colaborar estrechamente con un equipo de 3 developers y 2 designers
- Mentorear al equipo junior de producto
- Incrementar product-market fit en los primeros 90 días

## Requisitos Técnicos
- 5-8 años de experiencia en Product Management
- Experiencia comprobada en productos B2B SaaS
- Capacidad de comunicación fluida con equipos técnicos
- Experiencia en research colaborativo

## Modalidad de Trabajo
- 3 días en oficina, 2 días remoto
- Horario core: 10-16 con flexibilidad 9-18
- Cultura de balance estructurado con pocas reuniones

## Compensación
- Salario: $4,500-6,000 USD mensuales
- Equity package incluido
- Beneficios completos

## Próximos Pasos
Si tienes la experiencia y pasión por producto B2B, queremos conocerte.',
  'gpt-4',
  true,
  true,
  1,
  true,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

-- =============================================================================
-- SAMPLE APPLICANTS
-- =============================================================================

INSERT INTO applicants (
  id,
  company_id,
  position_id,
  full_name,
  email,
  phone,
  linkedin_url,
  location,
  cover_letter,
  source_type,
  referrer_info,
  application_status,
  hr_score,
  hr_notes,
  applied_at,
  created_by
) VALUES
-- Strong candidate
(
  'app11111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'pos11111-1111-1111-1111-111111111111',
  'Sandra Gutierrez',
  'sandra.gutierrez@email.com',
  '+51 987 123 456',
  'https://linkedin.com/in/sandragutierrez',
  'Lima, Perú',
  'Estimado equipo de TechFlow,

He seguido el crecimiento de TechFlow durante el último año y me emociona la oportunidad de contribuir como Senior Product Manager. Mi experiencia de 6 años en productos B2B SaaS, incluyendo 3 años liderando el producto en una startup fintech que creció de 0 a $2M ARR, me ha preparado exactamente para este rol.

En mi posición actual, he liderado la estrategia de producto que resultó en un incremento del 150% en user engagement y 40% en conversión. Mi enfoque se basa en research profundo con usuarios y colaboración estrecha con engineering.

Adjunto mi CV con detalles específicos de mis logros. Espero poder conversar sobre cómo puedo contribuir al growth de TechFlow.

Saludos,
Sandra',
  'direct_application',
  '{}'::jsonb,
  'hr_approved',
  9,
  'Candidata excepcional. Experiencia perfecta para nuestras necesidades. Background en fintech es un plus.',
  NOW() - INTERVAL '2 days',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
),
-- Good candidate
(
  'app22222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'pos11111-1111-1111-1111-111111111111',
  'Miguel Torres',
  'miguel.torres@email.com',
  '+51 998 765 432',
  'https://linkedin.com/in/migueltorres',
  'Arequipa, Perú',
  'Hola equipo,

Soy Miguel Torres, Product Manager con 4 años de experiencia en productos digitales. Aunque mi experiencia es principalmente en B2C, he liderado equipos de hasta 8 personas y tengo sólida experiencia técnica.

Me interesa mucho la transición a B2B SaaS y creo que puedo aportar una perspectiva fresca al equipo.

Saludos,
Miguel',
  'community_referral',
  '{"referrer_name": "Ana Silva", "referrer_email": "ana@techflow.com", "relationship": "ex-colleague"}'::jsonb,
  'hr_reviewing',
  7,
  'Buena experiencia pero falta experiencia B2B. Referido por Ana, lo cual es positivo.',
  NOW() - INTERVAL '1 day',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
),
-- Junior candidate
(
  'app33333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'pos11111-1111-1111-1111-111111111111',
  'Carla Rojas',
  'carla.rojas@email.com',
  '+51 955 444 333',
  'https://linkedin.com/in/carlarojas',
  'Lima, Perú',
  'Estimados,

Soy Carla, recién egresada de Administración con 1 año de experiencia en product management. Estoy muy motivada por aprender y crecer en el área.

Adjunto mi CV.

Gracias,
Carla',
  'direct_application',
  '{}'::jsonb,
  'rejected',
  3,
  'No cumple con el nivel de seniority requerido. Muy junior para esta posición.',
  NOW() - INTERVAL '3 days',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

-- =============================================================================
-- SAMPLE APPLICATION ACTIVITIES
-- =============================================================================

INSERT INTO application_activities (
  company_id,
  applicant_id,
  activity_type,
  activity_description,
  previous_value,
  new_value,
  metadata,
  performed_by_user,
  performed_by_type
) VALUES
-- Sandra's application journey
(
  '11111111-1111-1111-1111-111111111111',
  'app11111-1111-1111-1111-111111111111',
  'status_change',
  'Application status changed from applied to hr_reviewing',
  'applied',
  'hr_reviewing',
  '{"reviewer": "Ana Silva", "review_time_minutes": 15}'::jsonb,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'hr_user'
),
(
  '11111111-1111-1111-1111-111111111111',
  'app11111-1111-1111-1111-111111111111',
  'note_added',
  'HR screening notes added',
  NULL,
  'Candidata excepcional. Experiencia perfecta para nuestras necesidades.',
  '{"review_category": "initial_screening"}'::jsonb,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'hr_user'
),
(
  '11111111-1111-1111-1111-111111111111',
  'app11111-1111-1111-1111-111111111111',
  'status_change',
  'Application approved by HR',
  'hr_reviewing',
  'hr_approved',
  '{"approval_reason": "Strong B2B SaaS experience", "next_step": "technical_review"}'::jsonb,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'hr_user'
),
-- Carla's rejection
(
  '11111111-1111-1111-1111-111111111111',
  'app33333-3333-3333-3333-333333333333',
  'status_change',
  'Application rejected - insufficient experience',
  'applied',
  'rejected',
  '{"rejection_reason": "seniority_mismatch", "feedback_sent": true}'::jsonb,
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'hr_user'
);

-- =============================================================================
-- SAMPLE EMAIL COMMUNICATIONS
-- =============================================================================

INSERT INTO email_communications (
  company_id,
  position_id,
  applicant_id,
  email_type,
  recipient_email,
  recipient_name,
  subject_line,
  email_content,
  template_used,
  sent_at,
  delivered_at,
  opened_at,
  created_by
) VALUES
-- Leader form request
(
  '11111111-1111-1111-1111-111111111111',
  'pos11111-1111-1111-1111-111111111111',
  NULL,
  'leader_form_request',
  'diego@techflow.com',
  'Diego Vargas',
  'Especificaciones técnicas requeridas - Senior Product Manager',
  'Hola Diego,

Necesitamos tu input técnico para completar la descripción del puesto de Senior Product Manager que estarás liderando.

Por favor completa el formulario en el siguiente link:
https://prisma-talent.com/formulario-lider?position=POS_PM001

El formulario toma aproximadamente 10-15 minutos y nos ayudará a crear una descripción precisa para atraer el talento correcto.

Saludos,
Equipo Prisma Talent',
  'leader_form_request_v1',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '6 days' + INTERVAL '2 minutes',
  NOW() - INTERVAL '6 days' + INTERVAL '1 hour',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
),
-- Application confirmation
(
  '11111111-1111-1111-1111-111111111111',
  'pos11111-1111-1111-1111-111111111111',
  'app11111-1111-1111-1111-111111111111',
  'applicant_status_update',
  'sandra.gutierrez@email.com',
  'Sandra Gutierrez',
  'Confirmación de aplicación - Senior Product Manager en TechFlow',
  'Hola Sandra,

Hemos recibido tu aplicación para el puesto de Senior Product Manager en TechFlow Innovations.

Tu aplicación está siendo revisada por nuestro equipo de HR. Te contactaremos en los próximos 3-5 días hábiles con el siguiente paso del proceso.

Gracias por tu interés en TechFlow.

Saludos,
Equipo de Talento TechFlow',
  'application_confirmation_v1',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days' + INTERVAL '1 minute',
  NOW() - INTERVAL '2 days' + INTERVAL '30 minutes',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Use these queries to verify the sample data was inserted correctly:

/*
-- Check companies and their users
SELECT
  c.company_name,
  COUNT(hu.id) as hr_users_count,
  COUNT(p.id) as positions_count
FROM companies c
LEFT JOIN hr_users hu ON c.id = hu.company_id
LEFT JOIN positions p ON c.id = p.company_id
GROUP BY c.id, c.company_name;

-- Check position workflow stages
SELECT
  c.company_name,
  p.position_name,
  p.workflow_stage,
  p.area,
  COUNT(a.id) as applicants_count
FROM positions p
JOIN companies c ON p.company_id = c.id
LEFT JOIN applicants a ON p.id = a.position_id
GROUP BY c.company_name, p.position_name, p.workflow_stage, p.area
ORDER BY c.company_name, p.position_name;

-- Check application pipeline
SELECT
  p.position_name,
  a.full_name,
  a.application_status,
  a.hr_score,
  a.source_type
FROM applicants a
JOIN positions p ON a.position_id = p.id
JOIN companies c ON a.company_id = c.id
WHERE c.company_name = 'TechFlow Innovations'
ORDER BY a.applied_at DESC;

-- Check tenant isolation (should return different data for each company)
-- Run with different auth.uid() values representing different users
*/

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE companies IS 'Sample data includes 2 companies: TechFlow (active) and PeruShop (trial)';
COMMENT ON TABLE hr_users IS 'Sample includes complete HR team hierarchy with different roles and permissions';
COMMENT ON TABLE positions IS 'Sample includes positions at different workflow stages for testing';
COMMENT ON TABLE applicants IS 'Sample includes applicants with different statuses and quality levels';