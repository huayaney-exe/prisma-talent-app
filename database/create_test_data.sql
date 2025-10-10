-- ============================================================================
-- Create Test Data for Prisma Talent Platform
-- Run this in Supabase SQL Editor to create a complete test scenario
-- ============================================================================

-- Clean up any existing test data (optional)
-- DELETE FROM applicants WHERE company_id IN (SELECT id FROM companies WHERE company_name LIKE '%Test%');
-- DELETE FROM job_descriptions WHERE company_id IN (SELECT id FROM companies WHERE company_name LIKE '%Test%');
-- DELETE FROM positions WHERE company_id IN (SELECT id FROM companies WHERE company_name LIKE '%Test%');
-- DELETE FROM hr_users WHERE company_id IN (SELECT id FROM companies WHERE company_name LIKE '%Test%');
-- DELETE FROM companies WHERE company_name LIKE '%Test%';
-- DELETE FROM leads WHERE contact_email LIKE '%test%';

-- ============================================================================
-- 1. CREATE TEST LEAD
-- ============================================================================

INSERT INTO leads (
  contact_name,
  contact_email,
  company_name,
  intent,
  role_title,
  status
) VALUES (
  'María Test Lead',
  'maria.lead@testcompany.com',
  'Test Company Tech',
  'hiring',
  'Senior Full-Stack Developer',
  'pending'
);

-- ============================================================================
-- 2. CREATE TEST COMPANY (Approved Client)
-- ============================================================================

INSERT INTO companies (
  id,
  company_name,
  industry,
  company_size,
  website,
  country,
  city,
  subscription_status,
  onboarding_status,
  billing_email
) VALUES (
  gen_random_uuid(),
  'Acme Technology Inc',
  'Software Development',
  '50-100',
  'https://acmetech.example.com',
  'United States',
  'San Francisco',
  'active',
  'completed',
  'billing@acmetech.example.com'
) RETURNING id;

-- ⚠️ IMPORTANT: Copy the UUID returned above and use it in the queries below
-- Replace 'COMPANY_UUID_HERE' with the actual company ID

-- ============================================================================
-- 3. CREATE TEST HR USER
-- ============================================================================

INSERT INTO hr_users (
  company_id,
  email,
  full_name,
  role,
  phone,
  can_create_positions,
  can_manage_team,
  can_view_analytics,
  is_active
) VALUES (
  'COMPANY_UUID_HERE',  -- ⬅️ Replace this
  'hr@acmetech.example.com',
  'Sarah HR Manager',
  'HR Manager',
  '+1-415-555-0100',
  true,
  true,
  true,
  true
);

-- ============================================================================
-- 4. CREATE TEST POSITIONS
-- ============================================================================

-- Position 1: Senior Full-Stack Developer (Open)
INSERT INTO positions (
  id,
  company_id,
  position_code,
  role_title,
  seniority_level,
  work_mode,
  location,
  salary_min,
  salary_max,
  salary_currency,
  status,
  priority,
  created_by_email,
  required_skills,
  nice_to_have_skills,
  responsibilities,
  requirements
) VALUES (
  gen_random_uuid(),
  'COMPANY_UUID_HERE',  -- ⬅️ Replace this
  'POS-ACME-2024-001',
  'Senior Full-Stack Developer',
  'senior',
  'remote',
  'United States (Remote)',
  100000,
  140000,
  'USD',
  'open',
  'high',
  'hr@acmetech.example.com',
  ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
  ARRAY['GraphQL', 'Docker', 'Kubernetes', 'CI/CD'],
  ARRAY[
    'Design and implement scalable web applications',
    'Lead technical decisions and architecture',
    'Mentor junior developers',
    'Collaborate with product and design teams'
  ],
  ARRAY[
    '5+ years full-stack development experience',
    'Strong proficiency in React and Node.js',
    'Experience with cloud platforms (AWS/GCP/Azure)',
    'Bachelor degree in Computer Science or equivalent'
  ]
) RETURNING id;

-- ⚠️ Copy the position ID returned above for use below
-- Replace 'POSITION_1_UUID_HERE' with the actual position ID

-- Position 2: Product Designer (JD Pending)
INSERT INTO positions (
  id,
  company_id,
  position_code,
  role_title,
  seniority_level,
  work_mode,
  location,
  salary_min,
  salary_max,
  salary_currency,
  status,
  priority,
  created_by_email,
  required_skills
) VALUES (
  gen_random_uuid(),
  'COMPANY_UUID_HERE',  -- ⬅️ Replace this
  'POS-ACME-2024-002',
  'Senior Product Designer',
  'senior',
  'hybrid',
  'San Francisco, CA',
  90000,
  130000,
  'USD',
  'jd_pending',
  'medium',
  'hr@acmetech.example.com',
  ARRAY['Figma', 'User Research', 'Design Systems', 'Prototyping']
) RETURNING id;

-- ============================================================================
-- 5. CREATE JOB DESCRIPTION (For Position 1)
-- ============================================================================

INSERT INTO job_descriptions (
  position_id,
  company_id,
  position_code,
  title,
  content,
  status,
  published_at,
  published_by
) VALUES (
  'POSITION_1_UUID_HERE',  -- ⬅️ Replace this
  'COMPANY_UUID_HERE',     -- ⬅️ Replace this
  'POS-ACME-2024-001',
  'Senior Full-Stack Developer - Remote',
  '<h2>About Acme Technology</h2><p>We''re building the future of enterprise software. Join our team of talented engineers and help us scale our platform to millions of users.</p><h2>The Role</h2><p>We''re seeking a Senior Full-Stack Developer to lead technical initiatives and build scalable features for our core product. You''ll work closely with product, design, and engineering teams to deliver high-quality solutions.</p><h2>Responsibilities</h2><ul><li>Design and implement scalable web applications using React and Node.js</li><li>Lead technical architecture decisions for new features</li><li>Mentor junior developers and conduct code reviews</li><li>Collaborate with cross-functional teams</li><li>Optimize application performance and reliability</li></ul><h2>Requirements</h2><ul><li>5+ years of full-stack development experience</li><li>Strong proficiency in React, Node.js, and TypeScript</li><li>Experience with PostgreSQL and cloud platforms (AWS preferred)</li><li>Excellent problem-solving and communication skills</li><li>Bachelor''s degree in Computer Science or equivalent experience</li></ul><h2>Benefits</h2><ul><li>Competitive salary ($100k-$140k)</li><li>100% remote work</li><li>Health, dental, and vision insurance</li><li>401(k) with company match</li><li>Unlimited PTO</li><li>Professional development budget</li></ul><h2>How to Apply</h2><p>Click the "Apply" button below to submit your application. We review all applications within 5 business days.</p>',
  'published',
  NOW(),
  'hr@acmetech.example.com'
);

-- ============================================================================
-- 6. CREATE TEST APPLICANTS (For Position 1)
-- ============================================================================

-- Applicant 1: Strong candidate
INSERT INTO applicants (
  position_id,
  position_code,
  company_id,
  full_name,
  email,
  phone,
  linkedin_url,
  cv_url,
  cover_letter,
  years_of_experience,
  availability,
  status,
  qualification_score
) VALUES (
  'POSITION_1_UUID_HERE',  -- ⬅️ Replace this
  'POS-ACME-2024-001',
  'COMPANY_UUID_HERE',     -- ⬅️ Replace this
  'Alex Rodriguez',
  'alex.rodriguez@example.com',
  '+1-555-0123',
  'https://linkedin.com/in/alexrodriguez',
  'https://example.com/cvs/alex-rodriguez-cv.pdf',
  'I am excited about the opportunity to join Acme Technology. With 7 years of full-stack experience and expertise in React and Node.js, I believe I would be a great fit for this role. I have led multiple projects at scale and am passionate about mentoring junior developers.',
  7,
  'Two weeks notice',
  'new',
  NULL
);

-- Applicant 2: Good candidate
INSERT INTO applicants (
  position_id,
  position_code,
  company_id,
  full_name,
  email,
  phone,
  linkedin_url,
  cv_url,
  cover_letter,
  years_of_experience,
  availability,
  status
) VALUES (
  'POSITION_1_UUID_HERE',  -- ⬅️ Replace this
  'POS-ACME-2024-001',
  'COMPANY_UUID_HERE',     -- ⬅️ Replace this
  'Jessica Chen',
  'jessica.chen@example.com',
  '+1-555-0456',
  'https://linkedin.com/in/jessicachen',
  'https://example.com/cvs/jessica-chen-cv.pdf',
  'I have been following Acme Technology for years and am impressed by your product roadmap. My 5 years of experience in building scalable React applications aligns well with your requirements.',
  5,
  'Immediately',
  'new'
);

-- Applicant 3: Junior candidate (doesn't meet seniority)
INSERT INTO applicants (
  position_id,
  position_code,
  company_id,
  full_name,
  email,
  phone,
  linkedin_url,
  cv_url,
  cover_letter,
  years_of_experience,
  availability,
  status
) VALUES (
  'POSITION_1_UUID_HERE',  -- ⬅️ Replace this
  'POS-ACME-2024-001',
  'COMPANY_UUID_HERE',     -- ⬅️ Replace this
  'Michael Lee',
  'michael.lee@example.com',
  '+1-555-0789',
  'https://linkedin.com/in/michaellee',
  'https://example.com/cvs/michael-lee-cv.pdf',
  'I recently graduated with a bootcamp certificate and have built several personal projects using React. I am eager to learn and grow with your team.',
  1,
  'Immediately',
  'new'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View created test data
SELECT 'LEADS' as table_name, COUNT(*) as count FROM leads WHERE contact_email LIKE '%test%'
UNION ALL
SELECT 'COMPANIES', COUNT(*) FROM companies WHERE company_name LIKE '%Acme%'
UNION ALL
SELECT 'HR_USERS', COUNT(*) FROM hr_users WHERE email LIKE '%acmetech%'
UNION ALL
SELECT 'POSITIONS', COUNT(*) FROM positions WHERE position_code LIKE 'POS-ACME%'
UNION ALL
SELECT 'JOB_DESCRIPTIONS', COUNT(*) FROM job_descriptions WHERE position_code LIKE 'POS-ACME%'
UNION ALL
SELECT 'APPLICANTS', COUNT(*) FROM applicants WHERE position_code LIKE 'POS-ACME%';

-- View position details
SELECT
  p.position_code,
  p.role_title,
  p.status,
  p.priority,
  COUNT(a.id) as applicant_count
FROM positions p
LEFT JOIN applicants a ON p.id = a.position_id
WHERE p.position_code LIKE 'POS-ACME%'
GROUP BY p.id, p.position_code, p.role_title, p.status, p.priority;

-- ============================================================================
-- CLEANUP SCRIPT (Run this to remove all test data)
-- ============================================================================
/*
-- Uncomment and run if you want to remove test data

DELETE FROM applicants WHERE company_id IN (
  SELECT id FROM companies WHERE company_name = 'Acme Technology Inc'
);

DELETE FROM job_descriptions WHERE company_id IN (
  SELECT id FROM companies WHERE company_name = 'Acme Technology Inc'
);

DELETE FROM positions WHERE company_id IN (
  SELECT id FROM companies WHERE company_name = 'Acme Technology Inc'
);

DELETE FROM hr_users WHERE company_id IN (
  SELECT id FROM companies WHERE company_name = 'Acme Technology Inc'
);

DELETE FROM companies WHERE company_name = 'Acme Technology Inc';

DELETE FROM leads WHERE contact_email = 'maria.lead@testcompany.com';

-- Verify cleanup
SELECT 'Test data removed' as status;
*/
