# Supabase Setup Guide - Prisma Talent ATS

Complete implementation guide for setting up the multi-tenant ATS database in Supabase.

## Project Information
- **Project Name**: prisma-talent
- **Project ID**: `vhjjibfblrkyfzcukqwa`
- **Dashboard URL**: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/vhjjibfblrkyfzcukqwa/sql
2. Create new query in SQL Editor

### Step 2: Run Schema Migration
Copy and execute: `supabase-migrations/001_initial_schema.sql`
- Creates all 7 core tables
- Sets up multi-tenant structure
- Adds audit triggers and helper functions

### Step 3: Apply Security Policies
Copy and execute: `supabase-migrations/002_rls_policies.sql`
- Enables Row Level Security on all tables
- Implements tenant isolation
- Sets up role-based permissions

### Step 4: Create Performance Indexes
Copy and execute: `supabase-migrations/003_indexes.sql`
- Adds essential indexes for multi-tenant queries
- Optimizes workflow and relationship lookups
- Includes partial indexes for specific conditions

### Step 5: Load Test Data
Copy and execute: `supabase-migrations/004_sample_data.sql`
- Creates 2 sample companies
- Adds HR users with different roles
- Includes positions at various workflow stages
- Provides realistic applicant data

---

## 📊 Database Structure Overview

### Core Tables Created
```
companies (tenants)
├── hr_users (with roles: company_admin, hr_manager, hr_user)
├── positions (with workflow: hr_draft → active → filled)
│   ├── job_descriptions (AI-generated with validation)
│   └── applicants (full application pipeline)
│       └── application_activities (audit trail)
└── email_communications (email tracking)
```

### Key Features
- **Multi-tenant isolation**: Every table has `company_id`
- **Workflow tracking**: Positions progress through 11 stages
- **Role-based access**: 3 roles with granular permissions
- **JSONB flexibility**: Area-specific data and metadata
- **Audit trail**: Complete activity logging
- **Email automation**: Tracking and template support

---

## 🔐 Security Implementation

### Row Level Security (RLS)
- **Enabled on all tables** for complete data isolation
- **Tenant isolation**: Users can only see their company's data
- **Role-based permissions**: Different access levels per role
- **Public access**: Job seekers can view active positions and apply

### Sample RLS Policy
```sql
-- All tables use this pattern for tenant isolation
CREATE POLICY "tenant_isolation" ON positions
  FOR ALL USING (
    company_id = (SELECT company_id FROM hr_users WHERE id = auth.uid())
  );
```

---

## 🔄 Workflow Implementation

### Position Creation Flow
1. **HR Form**: HR user creates position with Form 1 data
2. **Leader Email**: System emails leader with form URL like `/formulario-lider?position=POS_A1B2C3D4`
3. **Leader Form**: Leader completes technical specifications
4. **AI Generation**: Job description generated from combined data
5. **Validation**: Both HR and leader approve final description
6. **Activation**: Position becomes active and accepts applications

### Sample Position Codes
- `POS_PM001` - Product Manager position
- `POS_FS002` - Full Stack Engineer position
- `POS_GR003` - Growth Marketing position

---

## 📱 API Integration Points

### Authentication
Uses Supabase Auth with hr_users table:
```javascript
// User login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'maria@techflow.com',
  password: 'password'
});
```

### Creating a Position (HR Form)
```javascript
const { data, error } = await supabase
  .from('positions')
  .insert({
    position_name: 'Senior Product Manager',
    area: 'Product Management',
    seniority: 'Senior 5-8 años',
    leader_email: 'diego@techflow.com',
    // ... other Form 1 fields
  })
  .select('position_code')
  .single();

// Returns: { position_code: 'POS_A1B2C3D4' }
```

### Loading Leader Form
```javascript
// Get position by code for leader form
const { data: position } = await supabase
  .from('positions')
  .select('*')
  .eq('position_code', 'POS_A1B2C3D4')
  .single();

// Update with leader specifications
await supabase
  .from('positions')
  .update({
    work_arrangement: '3 días oficina, 2 remoto',
    core_hours: '9-18 con overlap 10-16',
    area_specific_data: productManagementData,
    workflow_stage: 'leader_completed'
  })
  .eq('position_code', 'POS_A1B2C3D4');
```

### Public Job Application
```javascript
// Job seekers can apply to active positions
const { data, error } = await supabase
  .from('applicants')
  .insert({
    position_id: 'pos11111-1111-1111-1111-111111111111',
    full_name: 'Sandra Gutierrez',
    email: 'sandra@email.com',
    cover_letter: 'Application letter...',
    source_type: 'direct_application'
  });
```

---

## 🧪 Testing & Validation

### Sample Companies Created
1. **TechFlow Innovations** (`company_id: 11111111-1111-1111-1111-111111111111`)
   - 3 HR users with different roles
   - 2 positions at different workflow stages
   - 3 applicants with various statuses

2. **PeruShop Digital** (`company_id: 22222222-2222-2222-2222-222222222222`)
   - 1 company admin
   - 1 position in early workflow stage

### Test Multi-Tenant Isolation
```sql
-- Login as TechFlow user and verify data isolation
SELECT COUNT(*) FROM positions; -- Should see only TechFlow positions
SELECT COUNT(*) FROM applicants; -- Should see only TechFlow applicants

-- Switch to PeruShop user context
-- Should see completely different data set
```

### Test Workflow Progression
```sql
-- Check position workflow stages
SELECT position_name, workflow_stage, area
FROM positions
ORDER BY created_at;

-- Check application pipeline
SELECT p.position_name, a.full_name, a.application_status
FROM applicants a
JOIN positions p ON a.position_id = p.id
ORDER BY a.applied_at DESC;
```

---

## 🔄 Migration from Airtable

### Current Airtable Structure
```javascript
// Existing Airtable fields
const airtableMapping = {
  'Full Name': 'fldLNApnAc4MA5TE6',
  'Company': 'fldVwEpFgcpdYmqRC',
  'Email': 'fldJeiN3O87H5ajkC',
  'Phone': 'fldOXECXyORutCxYV',
  'Intent': 'fldzazkarhRXelYnE'
};
```

### Migration Strategy
1. **Export Airtable data** to CSV/JSON
2. **Transform to Supabase structure**:
   - Create companies from unique company names
   - Create hr_users from contact emails
   - Convert hiring intents to draft positions
3. **Update frontend forms** to use Supabase API
4. **Test complete workflow** with new database
5. **Switch DNS** to production

### Migration Script Example
```javascript
// Transform Airtable leads to Supabase companies
async function migrateAirtableData(airtableRecords) {
  for (const record of airtableRecords) {
    // Create company
    const { data: company } = await supabase
      .from('companies')
      .insert({
        company_name: record.company,
        company_domain: extractDomain(record.email),
        primary_contact_name: record.full_name,
        primary_contact_email: record.email
      })
      .select()
      .single();

    // Create HR user
    await supabase
      .from('hr_users')
      .insert({
        company_id: company.id,
        email: record.email,
        full_name: record.full_name,
        role: 'company_admin'
      });

    // Create draft position if hiring intent
    if (record.intent === 'hiring') {
      await supabase
        .from('positions')
        .insert({
          company_id: company.id,
          position_name: 'Pending Definition',
          workflow_stage: 'hr_draft'
        });
    }
  }
}
```

---

## 📈 Performance Monitoring

### Essential Queries to Monitor
```sql
-- Index usage statistics
SELECT indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'positions'
ORDER BY idx_tup_read DESC;

-- Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables
WHERE tablename IN ('companies', 'positions', 'applicants');

-- Active connections by company
SELECT
  c.company_name,
  COUNT(DISTINCT hu.id) as active_users
FROM companies c
JOIN hr_users hu ON c.id = hu.company_id
WHERE hu.last_login_at > NOW() - INTERVAL '24 hours'
GROUP BY c.company_name;
```

### Performance Targets
- **Query Response Time**: < 100ms for dashboard queries
- **Position Creation**: < 2 seconds end-to-end
- **Application Submission**: < 1 second
- **Email Generation**: < 5 seconds

---

## 🛠️ Next Steps

### Frontend Integration
1. **Update forms** to use Supabase instead of Airtable
2. **Implement authentication** with Supabase Auth
3. **Create dashboard** for HR users
4. **Build leader form** with dynamic fields based on area
5. **Add file upload** for resumes and portfolios

### Email Automation
1. **Set up email service** (SendGrid, Resend, etc.)
2. **Create email templates** for each workflow stage
3. **Implement webhook triggers** for automatic emails
4. **Track email engagement** (opens, clicks, replies)

### Analytics Dashboard
1. **Company metrics**: Positions created, time to fill, applicant conversion
2. **Performance tracking**: Workflow bottlenecks, stage completion times
3. **Quality metrics**: Applicant quality scores, source effectiveness

---

## 🆘 Troubleshooting

### Common Issues

**RLS Policies Not Working**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'positions';

-- Verify user context
SELECT auth.uid(), get_current_user_company_id();
```

**Slow Queries**
```sql
-- Check missing indexes
EXPLAIN ANALYZE SELECT * FROM positions WHERE company_id = 'uuid';

-- Add specific indexes as needed
CREATE INDEX idx_custom ON table_name(column_name);
```

**Foreign Key Violations**
```sql
-- Check orphaned records
SELECT p.* FROM positions p
LEFT JOIN companies c ON p.company_id = c.id
WHERE c.id IS NULL;
```

### Support Resources
- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL RLS**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Performance Tuning**: https://wiki.postgresql.org/wiki/Performance_Optimization

---

## ✅ Success Criteria

Your Supabase setup is complete when:
- [ ] All 4 migration files execute without errors
- [ ] Sample data loads successfully
- [ ] RLS policies enforce tenant isolation
- [ ] Position workflow progresses correctly
- [ ] Applications can be submitted and tracked
- [ ] Email communications are logged
- [ ] Performance meets target response times

**🎉 Congratulations! Your multi-tenant ATS database is ready for production.**