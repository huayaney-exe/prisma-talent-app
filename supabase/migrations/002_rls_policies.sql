-- Prisma Talent ATS - Row Level Security Policies
-- Multi-tenant security implementation
-- Project: prisma-talent (vhjjibfblrkyfzcukqwa)

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all core tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_communications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TENANT ISOLATION POLICIES
-- =============================================================================

-- Companies table - users can only see their own company
CREATE POLICY "company_access" ON companies
  FOR ALL USING (
    id = (SELECT company_id FROM hr_users WHERE id = auth.uid())
  );

-- HR Users table - company-based isolation
CREATE POLICY "tenant_isolation" ON hr_users
  FOR ALL USING (
    company_id = (SELECT company_id FROM hr_users WHERE id = auth.uid())
  );

-- Positions table - company-based isolation
CREATE POLICY "tenant_isolation" ON positions
  FOR ALL USING (
    company_id = (SELECT company_id FROM hr_users WHERE id = auth.uid())
  );

-- Job Descriptions table - company-based isolation
CREATE POLICY "tenant_isolation" ON job_descriptions
  FOR ALL USING (
    company_id = (SELECT company_id FROM hr_users WHERE id = auth.uid())
  );

-- Applicants table - company-based isolation
CREATE POLICY "tenant_isolation" ON applicants
  FOR ALL USING (
    company_id = (SELECT company_id FROM hr_users WHERE id = auth.uid())
  );

-- Application Activities table - company-based isolation
CREATE POLICY "tenant_isolation" ON application_activities
  FOR ALL USING (
    company_id = (SELECT company_id FROM hr_users WHERE id = auth.uid())
  );

-- Email Communications table - company-based isolation
CREATE POLICY "tenant_isolation" ON email_communications
  FOR ALL USING (
    company_id = (SELECT company_id FROM hr_users WHERE id = auth.uid())
  );

-- =============================================================================
-- ROLE-BASED PERMISSIONS
-- =============================================================================

-- Position creation permission
CREATE POLICY "can_create_positions" ON positions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM hr_users
      WHERE id = auth.uid()
      AND is_active = TRUE
      AND can_create_positions = TRUE
    )
  );

-- Team management permission - only company admins and hr managers can invite users
CREATE POLICY "can_manage_team" ON hr_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM hr_users
      WHERE id = auth.uid()
      AND (role = 'company_admin' OR can_manage_team = TRUE)
    )
  );

-- Job description creation - linked to positions user can access
CREATE POLICY "can_create_job_descriptions" ON job_descriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM positions p
      JOIN hr_users hu ON p.company_id = hu.company_id
      WHERE p.id = job_descriptions.position_id
      AND hu.id = auth.uid()
    )
  );

-- Application management - HR users can manage applications for their company's positions
CREATE POLICY "can_manage_applications" ON applicants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM positions p
      JOIN hr_users hu ON p.company_id = hu.company_id
      WHERE p.id = applicants.position_id
      AND hu.id = auth.uid()
    )
  );

-- Activity logging - users can log activities for applications they can access
CREATE POLICY "can_log_activities" ON application_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applicants a
      JOIN positions p ON a.position_id = p.id
      JOIN hr_users hu ON p.company_id = hu.company_id
      WHERE a.id = application_activities.applicant_id
      AND hu.id = auth.uid()
    )
  );

-- Email communication - users can send/view emails for their company
CREATE POLICY "can_manage_emails" ON email_communications
  FOR ALL USING (
    company_id = (SELECT company_id FROM hr_users WHERE id = auth.uid())
  );

-- =============================================================================
-- PUBLIC ACCESS POLICIES (for job applications)
-- =============================================================================

-- Allow public read access to active positions (for job seekers)
CREATE POLICY "public_position_read" ON positions
  FOR SELECT USING (
    workflow_stage = 'active'
  );

-- Allow public read access to published job descriptions
CREATE POLICY "public_job_description_read" ON job_descriptions
  FOR SELECT USING (
    is_current_version = TRUE
    AND published_at IS NOT NULL
  );

-- Allow public insert for job applications
CREATE POLICY "public_application_insert" ON applicants
  FOR INSERT WITH CHECK (
    -- Allow anyone to apply to active positions
    EXISTS (
      SELECT 1 FROM positions
      WHERE id = applicants.position_id
      AND workflow_stage = 'active'
    )
  );

-- =============================================================================
-- SECURITY HELPER FUNCTIONS
-- =============================================================================

-- Function to get current user's company_id
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM hr_users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT CASE permission_name
      WHEN 'create_positions' THEN can_create_positions
      WHEN 'manage_team' THEN can_manage_team
      WHEN 'view_analytics' THEN can_view_analytics
      ELSE FALSE
    END
    FROM hr_users
    WHERE id = auth.uid()
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = role_name
    FROM hr_users
    WHERE id = auth.uid()
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- AUDIT TRIGGER FOR SECURITY EVENTS
-- =============================================================================

-- Create security audit table
CREATE TABLE IF NOT EXISTS security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  company_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit (
    user_id,
    company_id,
    action,
    table_name,
    record_id,
    details
  ) VALUES (
    auth.uid(),
    get_current_user_company_id(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add security audit triggers to sensitive tables
CREATE TRIGGER security_audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION log_security_event();

CREATE TRIGGER security_audit_hr_users
  AFTER INSERT OR UPDATE OR DELETE ON hr_users
  FOR EACH ROW EXECUTE FUNCTION log_security_event();

CREATE TRIGGER security_audit_positions
  AFTER INSERT OR UPDATE OR DELETE ON positions
  FOR EACH ROW EXECUTE FUNCTION log_security_event();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "tenant_isolation" ON hr_users IS 'Ensures users can only access data from their own company';
COMMENT ON POLICY "can_create_positions" ON positions IS 'Only active users with position creation permission can create new positions';
COMMENT ON POLICY "public_position_read" ON positions IS 'Allows job seekers to view active positions';
COMMENT ON POLICY "public_application_insert" ON applicants IS 'Allows anyone to apply to active positions';

COMMENT ON FUNCTION get_current_user_company_id() IS 'Helper function to get current authenticated user company ID';
COMMENT ON FUNCTION user_has_permission(TEXT) IS 'Check if current user has specific permission';
COMMENT ON FUNCTION user_has_role(TEXT) IS 'Check if current user has specific role';

COMMENT ON TABLE security_audit IS 'Audit trail for security-sensitive operations';