# Prisma Talent Platform - Product Alignment & Implementation Roadmap

**Status**: CORRECTED PRODUCT VISION (January 2025)
**Purpose**: Align current implementation with actual business model and workflows
**Owner**: Luis Eduardo Huayaney

---

## 🎯 Corrected Business Model

### **Core Value Proposition**
Prisma acts as **curated talent partner** managing the complete hiring process from role definition to candidate shortlist delivery.

### **Key Actors**
1. **Prisma Admin** - Internal team managing client relationships and candidate curation
2. **Business Client (Company)** - Hiring companies (B2B customers)
3. **HR User** - Client's HR team member (position owner)
4. **Business User** - Client's technical/functional leader (role expert)
5. **Candidates** - External applicants from community and job boards

### **Workflow Model**
```
Interest Form → Prisma Enrolls Client → HR Creates Position →
Business User Adds Specs → Prisma Creates Job Description →
Prisma Publishes Role → Candidates Apply →
Prisma Qualifies & Shortlists → Prisma Sends Top 3-5 to HR
```

---

## 📋 Feature Checklist: Current vs Required

### **1. Interest Form (Commercial Lead Capture)**

**Status**: ✅ **EXISTS** (with gaps)

**Current Implementation**:
- **File**: `src/pages/index.html#talent-request`
- **Form Fields**:
  - Contact info (name, position, company, email, phone)
  - Intent selection: "Busco contratar talento" vs "Quiero conversar"
  - Conditional position details (role title, type, seniority, work mode, urgency)
- **Data Flow**: Saves to `companies` table via `main.js`

**Gaps**:
- ❌ No admin notification when form submitted
- ❌ No lead qualification workflow
- ❌ Form doesn't distinguish between "just exploring" vs "ready to hire"
- ❌ Missing fields: industry, company size, budget expectations

**Required Changes**:
- [ ] Add admin email notification on form submission
- [ ] Create Prisma admin dashboard to review leads
- [ ] Add lead status tracking: `new → qualified → enrolled → active`
- [ ] Enhance form with qualification fields

---

### **2. User Creation (Client Enrollment)**

**Status**: ⚠️ **PARTIALLY EXISTS** (missing admin interface)

**Current Implementation**:
- **Database**: `hr_users` table exists with role field
- **Roles Supported**: `company_admin`, `hr_manager`, `hr_user`
- **Authentication**: Supabase Auth configured but not integrated

**Gaps**:
- ❌ **No Prisma Admin role/table** - Critical missing actor
- ❌ No admin interface to enroll new business clients
- ❌ No automated onboarding email with password setup
- ❌ No user invitation workflow

**Required Implementation**:

#### **A. Prisma Admin Table** (Database)
```sql
CREATE TABLE IF NOT EXISTS prisma_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **B. Prisma Admin Dashboard** (New Page)
- **File**: `src/pages/admin/dashboard.html` *[TO CREATE]*
- **Features**:
  - Lead management (view interest forms)
  - Client enrollment form
  - Active clients list
  - Position pipeline overview
  - Candidate management

#### **C. Client Enrollment Flow** (Prisma Admin Action)
1. Prisma admin reviews interest form
2. Decides to enroll → Creates company + initial HR user
3. System sends **Notification #1**: Welcome email to HR user
   - Subject: "Bienvenido a Prisma Talent - Completa tu onboarding"
   - Content:
     - Welcome message
     - Password setup link (Supabase magic link)
     - Instructions to create first position
     - Timeline expectations
   - CTA: "Configurar contraseña y acceder a plataforma"

---

### **3. Position Creation with HR Form, Business Form, AI Job Description**

**Status**: ✅ **MOSTLY EXISTS** (missing AI integration)

#### **A. HR Form (Position Basics)**

**Current Implementation**: ✅ **COMPLETE**
- **File**: `src/pages/formulario-hr.html`
- **Form Fields**: Position name, area, seniority, leader info, salary, equity, contract type, timeline
- **Data Flow**:
  - HR user (authenticated) fills form
  - Creates record in `positions` table
  - Workflow stage: `hr_completed`
  - Position code generated: `POS_XXXXXXXX`

**Gaps**:
- ❌ Missing **Notification #2**: Email to business user when HR form completed
- ❌ No Prisma admin visibility of new positions

**Required Changes**:
- [ ] Backend endpoint: `/api/notify-business-user`
- [ ] Email template: `business-user-specification-request.html`
- [ ] Prisma admin dashboard: Show new positions requiring specs

#### **B. Business Form (Technical Specifications)**

**Current Implementation**: ✅ **COMPLETE**
- **File**: `src/pages/formulario-lider.html` (rename to `formulario-business.html`)
- **Dynamic Questions**: 9 area-specific questions per domain (Product, Engineering, Growth, Design)
- **Universal Questions**: Work modality, team size, autonomy, KPIs
- **Data Flow**:
  - Business user loads form via position code: `?position=POS_XXXXXXXX`
  - Position data pre-populated
  - Submits specifications → updates `positions.area_specific_data` (JSONB)
  - Workflow stage: `leader_completed`

**Gaps**:
- ❌ Missing **Notification #3**: Email to HR user when business form completed
- ❌ Missing **Notification #4**: Email to Prisma admin to create job description
- ❌ No AI job description generation

**Required Changes**:
- [ ] Backend endpoint: `/api/generate-job-description`
- [ ] OpenAI integration for AI-powered JD
- [ ] Email notifications to HR + Prisma admin
- [ ] Prisma admin interface to review/edit AI-generated JD

#### **C. AI Job Description Generation**

**Current Implementation**: ❌ **MISSING**

**Required Implementation**:
1. **Trigger**: Business user submits specifications
2. **Backend Process** (Render API):
   ```javascript
   POST /api/generate-job-description
   {
     positionId: "uuid",
     hrData: { position_name, area, seniority, salary_range },
     businessData: { area_specific_data: {...} }
   }
   ```
3. **AI Prompt** (OpenAI GPT-4):
   ```
   System: Eres experto en job descriptions para roles de producto digital.

   Input:
   - Posición: {position_name}
   - Área: {area}
   - Seniority: {seniority}
   - Especificaciones técnicas: {businessData}

   Output (Español):
   1. Resumen ejecutivo (2-3 líneas)
   2. Responsabilidades (5-7 bullets)
   3. Requisitos técnicos (must-have)
   4. Requisitos deseables (nice-to-have)
   5. Compensación: {salary_range}
   6. Sobre la empresa: {company_description}
   ```
4. **Save to Database**:
   - Table: `job_descriptions`
   - Fields: `position_id`, `generated_content`, `edited_content`, `status`, `created_by_ai`
5. **Workflow Update**: `workflow_stage: 'job_desc_generated'`
6. **Notification**: Prisma admin receives email to review/publish

---

### **4. Individual Position Pages for Candidate Applications**

**Status**: ❌ **MISSING** (Critical for MVP)

**Required Implementation**:

#### **A. Public Job Posting Page**
- **File**: `src/pages/job/{position_code}.html` *[TO CREATE]*
- **URL Pattern**: `https://talent.getprisma.io/job/POS_XXXXXXXX`
- **Content**:
  - Company overview (from `companies` table)
  - Position title and area badge
  - AI-generated job description
  - Salary transparency
  - Work modality, location
  - "Aplicar a esta posición" CTA
- **Access Control**:
  - Only visible if `workflow_stage = 'active'`
  - Prisma admin publishes after creating JD

#### **B. Candidate Application Form**
- **File**: `src/pages/apply/{position_code}.html` *[TO CREATE]*
- **Form Fields**:
  - Full name, email, phone, LinkedIn URL
  - Current role & company
  - Years of experience
  - Why interested (text area, 500 chars)
  - Resume upload (PDF, max 5MB)
  - Portfolio links (optional, GitHub/Behance/etc.)
- **Data Flow**:
  ```javascript
  1. Candidate fills form
  2. Frontend validates
  3. Upload resume to Supabase Storage: /resumes/{position_id}/{applicant_id}/
  4. Create record in `applicants` table:
     - position_id, full_name, email, phone, linkedin_url
     - current_role, years_experience, motivation
     - resume_url, portfolio_links
     - application_source: 'direct_application'
     - application_status: 'new'
  5. Send Notification #6: Confirmation email to candidate
  6. Notify Prisma admin of new application
  ```

#### **C. Automatic Link Generation**
- **Trigger**: Prisma admin publishes position
- **Implementation**:
  ```javascript
  // When admin sets workflow_stage = 'active'
  const publicUrl = `https://talent.getprisma.io/job/${position.position_code}`;

  // Save to position record
  UPDATE positions
  SET public_url = publicUrl,
      published_at = NOW(),
      workflow_stage = 'active'
  WHERE id = position.id;
  ```

---

### **5. Prisma Dashboard - Position & Candidate Management**

**Status**: ❌ **MISSING** (Core product feature)

**Required Implementation**:

#### **A. Prisma Admin Dashboard**
- **File**: `src/pages/admin/dashboard.html` *[TO CREATE]*
- **Authentication**: Supabase Auth with `prisma_admins` table
- **Sections**:

**1. Overview Metrics**
- Active clients count
- Open positions (by workflow stage)
- Total applications this month
- Positions filled this quarter

**2. Position Pipeline**
| Position Code | Company | Role | Stage | Applications | Created | Actions |
|---------------|---------|------|-------|--------------|---------|---------|
| POS_ABC123 | TechCo | Senior PM | Job Desc Generated | 0 | 2 days ago | [Review JD] [Publish] |
| POS_DEF456 | StartupX | Growth Lead | Active | 12 | 5 days ago | [View Apps] [Shortlist] |

**Workflow Stages**:
- `hr_completed` → **Waiting for business specs**
- `leader_completed` → **Generate JD** (Prisma action)
- `job_desc_generated` → **Review & Publish** (Prisma action)
- `active` → **Receiving applications**
- `shortlisting` → **Prisma qualifying candidates**
- `shortlist_sent` → **Top 3-5 sent to client**
- `filled` → **Position closed - hire made**

**3. Position Detail View**
- Position info (all HR + business form data)
- AI-generated job description (editable)
- Public URL (if published)
- Application list with filtering:
  - New (unreviewed)
  - Under Review
  - Shortlisted (top candidates)
  - Rejected

**4. Candidate Qualification Interface**
For each application:
- Candidate profile (resume viewer, LinkedIn)
- Scoring system (1-5 stars for: skills match, experience, cultural fit)
- Notes section (Prisma team internal)
- Status actions:
  - Move to "Under Review"
  - Add to "Shortlist"
  - Reject with reason
- Email templates (screening questions, interview requests)

**5. Shortlist Creation & Delivery**
- Prisma admin selects top 3-5 candidates
- Creates shortlist summary:
  - Candidate profiles
  - Why each candidate fits
  - Compensation expectations
  - Availability
- Sends email to HR user with shortlist
- Workflow stage: `shortlist_sent`

---

### **6. Prisma Dashboard - Client Enrollment & Management**

**Status**: ❌ **MISSING** (Business operations feature)

**Required Implementation**:

#### **A. Client Management Section**
- **File**: `src/pages/admin/clients.html` *[TO CREATE]*

**Features**:

**1. Leads Pipeline**
| Company | Contact | Intent | Source | Submitted | Status | Actions |
|---------|---------|--------|--------|-----------|--------|---------|
| TechCorp | Ana Silva | Hiring Now | Landing Page | 1 day ago | New | [Qualify] [Enroll] |
| StartupX | Carlos M | Exploring | Referral | 3 days ago | Qualified | [Enroll] [Schedule Call] |

**Lead Statuses**:
- `new` → Just submitted interest form
- `qualified` → Prisma reviewed, good fit
- `contacted` → Outreach sent
- `enrolled` → Converted to active client
- `rejected` → Not a fit

**2. Client Enrollment Form**
Triggered when Prisma admin clicks "Enroll" on a lead:

```
Company Information:
- Company name (pre-filled from lead form)
- Industry (dropdown)
- Company size (dropdown)
- Website URL
- LinkedIn URL

Primary HR Contact:
- Full name (pre-filled)
- Position title (pre-filled)
- Email (pre-filled)
- Phone (pre-filled)

Subscription Details:
- Plan: Trial (30 days) / Basic / Premium
- Trial end date: [auto-calculated]

[Create Client & Send Onboarding Email]
```

**Actions on Submit**:
1. Create company record in `companies` table
2. Create HR user in `hr_users` table with role: `company_admin`
3. Send **Notification #1**: Onboarding email
4. Update lead status: `enrolled`

**3. Active Clients List**
| Company | HR Contact | Plan | Positions | Status | Member Since | Actions |
|---------|------------|------|-----------|--------|--------------|---------|
| TechCorp | Ana Silva | Trial | 2 (1 active) | Active | 5 days ago | [View] [Manage] |
| StartupX | Carlos M | Basic | 1 (filled) | Active | 2 months ago | [View] [Manage] |

**Client Detail View**:
- Company profile (all details)
- HR users list (with roles)
- Position history (all positions ever created)
- Applications received
- Hires made
- Subscription status
- Actions:
  - Add new HR user
  - Edit company details
  - Suspend/activate account

---

## 📧 Notification System - 6 Key Emails

### **Notification #1: Business Client Onboarding**

**Trigger**: Prisma admin enrolls new business client
**To**: HR User (company contact)
**Template**: `templates/emails/client-onboarding.html` *[TO CREATE]*

**Subject**: "Bienvenido a Prisma Talent - Configura tu acceso"

**Content**:
```
Hola {hr_name},

¡Bienvenido a Prisma Talent! Somos la comunidad de producto digital más curada de Latinoamérica y ahora somos tu socio estratégico en contratación de talento senior.

🔑 Configura tu acceso:
[Botón: Crear Contraseña y Acceder]

📋 Próximos pasos:
1. Ingresa a la plataforma
2. Completa el formulario de posición (5-7 minutos)
3. Tu líder técnico/funcional recibirá un email para aportar especificaciones
4. Prisma creará la descripción del rol y lo publicará
5. Recibirás los 3-5 mejores candidatos prioritizados en ≤10 días

⏱️ Timeline esperado:
- Tú completas formulario: 5-7 minutos
- Líder aporta especificaciones: 10-15 minutos
- Prisma genera job description: 24 horas
- Candidatos prioritizados: 7-10 días laborales

¿Preguntas? Responde este email o escríbenos a hello@getprisma.io

¡Empecemos!

El equipo de Prisma Talent
```

---

### **Notification #2: Business User - New Opening Notification**

**Trigger**: HR user submits position form (HR form completed)
**To**: Business User (technical/functional leader)
**Template**: `templates/emails/business-user-specification-request.html` *[TO CREATE]*

**Subject**: "Nueva apertura: Necesitamos tu input técnico - {position_name}"

**Content**:
```
Hola {business_user_name},

Somos **Prisma Talent**, la comunidad de producto digital más curada de Latinoamérica y socio estratégico de contratación de {company_name}.

🎯 Nueva posición abierta:
- Rol: {position_name}
- Área: {area}
- Seniority: {seniority}
- Iniciado por: {hr_user_name} ({hr_user_position})

💡 Por qué necesitamos tu expertise:
Tu conocimiento técnico/funcional es clave para definir el perfil ideal y encontrar al candidato perfecto. Solo tú sabes qué habilidades, experiencia y contexto específico necesita este rol para tener éxito.

📝 ¿Qué necesitamos?
Completa un formulario de 10-15 minutos con preguntas específicas para {area}:
- Alcance técnico y responsabilidades
- Stack/herramientas requeridas
- Estructura del equipo
- KPIs de éxito
- Dinámicas de trabajo

[Botón: Aportar Especificaciones Técnicas]

⏱️ Timeline:
- Tus especificaciones: 10-15 minutos
- Prisma genera job description: 24 horas
- Candidatos prioritizados: 7-10 días laborales

Con tu input, garantizamos candidatos que realmente encajan con las necesidades técnicas y culturales del rol.

Gracias por tu tiempo,
El equipo de Prisma Talent

Código de posición: {position_code}
```

---

### **Notification #3: HR User - Business Specs Completed**

**Trigger**: Business user submits specifications (business form completed)
**To**: HR User (position owner)
**Template**: `templates/emails/hr-specs-completed.html` *[TO CREATE]*

**Subject**: "Especificaciones técnicas completas - {position_name}"

**Content**:
```
Hola {hr_name},

¡Buenas noticias! {business_user_name} completó las especificaciones técnicas para la posición de **{position_name}**.

✅ Estado actual:
- Información HR: Completa
- Especificaciones técnicas: Completas
- Próximo paso: Prisma generará la descripción del rol (24 horas)

📋 ¿Qué sigue?
Nuestro equipo utilizará la información de ambos formularios para crear una descripción de puesto optimizada que atraiga a los mejores candidatos.

Te notificaremos cuando:
- La descripción esté lista para tu revisión
- Publiquemos la posición
- Empiecen a llegar aplicaciones
- Tengamos los 3-5 candidatos prioritizados listos

⏱️ Timeline estimado:
- Job description generada: 24 horas
- Candidatos prioritizados: 7-10 días laborales

¡Todo va según lo planeado!

El equipo de Prisma Talent

Ver posición: [Link al dashboard]
Código: {position_code}
```

---

### **Notification #4: Prisma Admin - Ready for Job Description**

**Trigger**: Business user submits specifications (business form completed)
**To**: Prisma Admin Team
**Template**: `templates/emails/admin-jd-required.html` *[TO CREATE]*

**Subject**: "[Acción Requerida] Generar JD - {company_name} - {position_name}"

**Content**:
```
🚨 Acción Requerida - Generar Job Description

Nueva posición lista para generación de JD:

📊 Información de la posición:
- Empresa: {company_name}
- Posición: {position_name}
- Área: {area}
- Seniority: {seniority}
- Código: {position_code}

✅ Completado:
- HR Form: {hr_completed_at}
- Business Specs: {business_completed_at}

⚡ Próximos pasos:
1. Revisar especificaciones en dashboard
2. Generar job description con AI
3. Editar/ajustar contenido
4. Publicar posición
5. Notificar a HR user

[Botón: Ver en Dashboard Admin]
[Botón: Generar JD con AI]

Timeline cliente: Job description en 24 horas
```

---

### **Notification #5: Position Published - Public Link Active**

**Trigger**: Prisma admin publishes position (workflow_stage = 'active')
**To**: HR User (position owner)
**Template**: `templates/emails/position-published.html` *[TO CREATE]*

**Subject**: "🚀 Posición publicada: {position_name} - Link activo"

**Content**:
```
Hola {hr_name},

¡Tu posición está en vivo! **{position_name}** ahora está recibiendo aplicaciones de nuestra comunidad curada de +2,500 profesionales verificados.

🔗 Link público:
{public_url}

📤 Comparte este link con:
- Tu red en LinkedIn
- Equipos internos que puedan referir candidatos
- Comunidades profesionales relevantes

📊 Descripción del rol generada:
[Preview de la job description]

🎯 Qué esperar:
- Aplicaciones empezarán a llegar en las próximas 24-48 horas
- Prisma revisará y calificará cada candidato
- Te enviaremos actualizaciones semanales
- Recibirás los 3-5 mejores candidatos prioritizados en 7-10 días

📈 Puedes seguir el progreso en tiempo real:
[Botón: Ver Dashboard de Posición]

Te mantendremos informado de cada aplicación relevante.

¡Éxito con la búsqueda!
El equipo de Prisma Talent

Código: {position_code}
```

---

### **Notification #6: Candidate Application Confirmation**

**Trigger**: Candidate submits application
**To**: Candidate (applicant)
**Template**: `templates/emails/application-received.html` *[TO CREATE]*

**Subject**: "Aplicación recibida - {position_name} en {company_name}"

**Content**:
```
Hola {candidate_name},

¡Gracias por aplicar a **{position_name}** en {company_name} a través de Prisma Talent!

✅ Tu aplicación fue recibida:
- Posición: {position_name}
- Empresa: {company_name}
- Fecha: {application_date}

🔍 ¿Qué sigue?

1. **Revisión inicial** (48-72 horas)
   Nuestro equipo de Prisma revisará tu perfil para asegurar match con los requisitos técnicos y culturales.

2. **Evaluación detallada** (5-7 días)
   Los candidatos que pasen revisión inicial serán evaluados a profundidad.

3. **Shortlist final** (7-10 días)
   Los 3-5 mejores candidatos serán presentados al equipo de {company_name}.

4. **Proceso de entrevistas**
   Si quedas en la shortlist, serás contactado directamente por {company_name}.

⏱️ Timeline esperado:
- Retroalimentación inicial: 3-5 días laborales
- Decisión final sobre shortlist: 7-10 días laborales

💡 Sobre Prisma Talent:
Somos la comunidad de producto digital más curada de Latinoamérica. Conectamos a los mejores profesionales senior con empresas líderes en tecnología.

Únete a nuestra comunidad:
🔗 LinkedIn: linkedin.com/company/getprisma
📧 Newsletter: getprisma.io

¡Mucha suerte!
El equipo de Prisma Talent

---
¿Preguntas? Responde este email o escríbenos a hello@getprisma.io
```

---

## 🗺️ Revised User Journey Map

### **Journey 1: Business Client Acquisition**
```
1. Company discovers Prisma (marketing, referral, events)
2. Lands on talent.getprisma.io
3. Fills interest form (lead capture)
   └─ Data saved to `companies` (status: lead)
4. Prisma admin reviews lead in admin dashboard
5. Admin enrolls client → Creates company + HR user
   └─ Sends Notification #1 (onboarding email)
6. HR user sets password, logs in
```

### **Journey 2: Position Creation & Publication**
```
7. HR user creates position (HR form)
   └─ Saves to `positions` (workflow_stage: hr_completed)
   └─ Sends Notification #2 to business user
8. Business user receives email, fills specifications (business form)
   └─ Updates `positions.area_specific_data` (workflow_stage: leader_completed)
   └─ Sends Notification #3 to HR user
   └─ Sends Notification #4 to Prisma admin
9. Prisma admin generates AI job description
   └─ Reviews/edits content
   └─ Publishes position (workflow_stage: active)
   └─ Sends Notification #5 to HR user (with public link)
```

### **Journey 3: Candidate Application & Qualification**
```
10. Candidate discovers job posting (public link, LinkedIn, referrals)
11. Clicks "Aplicar" → Application form
12. Submits application + resume
    └─ Saves to `applicants` (status: new)
    └─ Resume uploaded to Supabase Storage
    └─ Sends Notification #6 to candidate
    └─ Notifies Prisma admin
13. Prisma admin reviews applications in dashboard
    └─ Scores candidates (1-5 stars)
    └─ Adds notes
    └─ Moves to "Under Review" or "Rejected"
14. Prisma admin creates shortlist (top 3-5)
    └─ Prepares candidate profiles
    └─ Sends shortlist email to HR user
    └─ Updates workflow_stage: shortlist_sent
15. HR user reviews shortlist, schedules interviews
16. Position filled → workflow_stage: filled
```

---

## 📊 Implementation Gaps Summary

### **Critical Missing Features** (Blocks MVP)

| Feature | Current Status | Required Action | Effort |
|---------|---------------|-----------------|--------|
| **Prisma Admin Table** | ❌ Missing | Create `prisma_admins` table | 1 hour |
| **Prisma Admin Dashboard** | ❌ Missing | Build full admin interface | 3-5 days |
| **Client Enrollment Flow** | ❌ Missing | Admin action + Notification #1 | 2 days |
| **AI Job Description** | ❌ Missing | OpenAI integration + backend | 2-3 days |
| **Public Job Pages** | ❌ Missing | `/job/{code}` + `/apply/{code}` | 2-3 days |
| **Candidate Application** | ❌ Missing | Application form + resume upload | 2 days |
| **Email System (6 notifications)** | ❌ Missing | Resend integration + templates | 3-4 days |

### **Existing Features (Working)**

| Feature | File | Status | Notes |
|---------|------|--------|-------|
| Interest Form | `index.html` | ✅ Works | Needs admin notification |
| HR Form | `formulario-hr.html` | ✅ Works | Needs Notification #2 |
| Business Form | `formulario-lider.html` | ✅ Works | Needs Notification #3, #4 |
| Database Schema | `001-004.sql` | ✅ Complete | Missing `prisma_admins` table |
| Supabase Connection | `supabase-config.js` | ✅ Works | Demo mode must be disabled |

---

## ✅ Revised Implementation Roadmap

### **Phase 1: Database & Admin Foundation** (Week 1)

#### **Day 1-2: Database Updates**
- [ ] Execute existing migrations (001-004.sql)
- [ ] Create `prisma_admins` table
- [ ] Add workflow stage: `shortlisting`, `shortlist_sent`
- [ ] Seed first Prisma admin user
- [ ] Test Supabase Auth for admin login

#### **Day 3-5: Prisma Admin Dashboard (Basic)**
- [ ] Create `src/pages/admin/dashboard.html`
- [ ] Implement authentication (Supabase Auth)
- [ ] Build position pipeline view
- [ ] Create client management interface
- [ ] Add lead qualification UI

#### **Day 6-7: Client Enrollment Flow**
- [ ] Build enrollment form
- [ ] Create onboarding email template (Notification #1)
- [ ] Test end-to-end: Lead → Enroll → Email sent

---

### **Phase 2: Backend API & Email System** (Week 2)

#### **Day 1-3: Render Backend Setup**
- [ ] Create Express server
- [ ] Integrate Resend API
- [ ] Create 6 email templates (HTML)
- [ ] Test email delivery
- [ ] Deploy to Render

#### **Day 4-5: Email Integration**
- [ ] Wire Notification #2 (HR form → Business user)
- [ ] Wire Notification #3 (Business form → HR user)
- [ ] Wire Notification #4 (Business form → Prisma admin)
- [ ] Test all notification flows

#### **Day 6-7: AI Job Description**
- [ ] OpenAI API integration
- [ ] Create JD generation prompt
- [ ] Build admin interface to review/edit JD
- [ ] Test AI generation quality
- [ ] Wire Notification #5 (Position published)

---

### **Phase 3: Candidate Application System** (Week 3)

#### **Day 1-3: Public Job Pages**
- [ ] Create `src/pages/job-view.html` (dynamic by position code)
- [ ] Fetch position + JD from database
- [ ] Display company info, role details
- [ ] Add social sharing
- [ ] SEO optimization

#### **Day 4-5: Application Form**
- [ ] Create `src/pages/apply.html` (dynamic by position code)
- [ ] Build form with validation
- [ ] Implement resume upload (Supabase Storage)
- [ ] Save to `applicants` table
- [ ] Wire Notification #6 (Application confirmation)

#### **Day 6-7: Admin Candidate Management**
- [ ] Build applicant list view in admin dashboard
- [ ] Create candidate detail modal
- [ ] Implement scoring system
- [ ] Add notes functionality
- [ ] Test application → admin notification

---

### **Phase 4: Shortlist & Deployment** (Week 4)

#### **Day 1-2: Shortlist Feature**
- [ ] Build shortlist creation interface
- [ ] Multi-select candidates
- [ ] Generate shortlist summary
- [ ] Email delivery to HR user
- [ ] Track workflow: `shortlist_sent`

#### **Day 3-4: Production Deployment**
- [ ] Disable demo mode
- [ ] Configure Vercel deployment
- [ ] Set up custom domain
- [ ] Configure environment variables
- [ ] Deploy backend to Render

#### **Day 5-7: Testing & Launch**
- [ ] End-to-end testing (full workflow)
- [ ] Create test data (companies, positions, applications)
- [ ] User acceptance testing
- [ ] Fix bugs and polish
- [ ] Official launch

---

## 🎯 Success Metrics (Revised)

### **MVP Validation** (First 30 days)
- [ ] **3+ business clients enrolled** via Prisma admin
- [ ] **5+ positions created** (HR + business forms completed)
- [ ] **3+ AI job descriptions generated** and published
- [ ] **20+ candidate applications** received
- [ ] **1+ successful shortlist delivered** to client
- [ ] **6/6 email notifications working** correctly

### **Product-Market Fit** (90 days)
- [ ] **10+ active business clients**
- [ ] **15+ positions published**
- [ ] **100+ candidate applications**
- [ ] **5+ shortlists delivered**
- [ ] **2+ positions filled** (hire made)
- [ ] **Email open rate >40%**
- [ ] **Client satisfaction >4/5 stars**

---

**Document Version**: 2.0 (Corrected Vision)
**Last Updated**: January 2025
**Next Review**: After Phase 1 completion
**Status**: Ready for Implementation
