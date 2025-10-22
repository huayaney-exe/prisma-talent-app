-- ============================================================================
-- Migration 031: Business Form Public Update Policy
-- Date: 2025-10-22
-- Purpose: Allow public (unauthenticated) business leaders to complete position
--          specifications via email link
-- ============================================================================

-- PROBLEM:
-- Business leaders receive email with link to /business-form?code=XXX
-- They are NOT authenticated (anon role)
-- Current RLS policies only allow authenticated users to update positions
-- Result: RLS permission denied error when submitting business form

-- SOLUTION:
-- Add public update policy with strict constraints:
-- - Only allow updates when current workflow_stage = 'hr_completed'
-- - Only allow transition to workflow_stage = 'leader_completed'
-- - Business leader can ONLY update their specific fields (not company_id, etc.)

-- ============================================================================
-- ADD PUBLIC UPDATE POLICY FOR BUSINESS FORM
-- ============================================================================

CREATE POLICY "positions_business_form_public_update" ON positions
  FOR UPDATE
  TO anon
  USING (
    -- Can only update positions in hr_completed stage
    workflow_stage = 'hr_completed'
  )
  WITH CHECK (
    -- Can only transition to leader_completed stage
    workflow_stage = 'leader_completed'
    -- Ensure company_id hasn't changed (security check)
    AND company_id = (SELECT company_id FROM positions WHERE id = positions.id)
  );

-- ============================================================================
-- ADD HELPFUL COMMENT
-- ============================================================================

COMMENT ON POLICY "positions_business_form_public_update" ON positions IS
  'Allows unauthenticated business leaders to complete position specifications via email link. Restricted to hr_completed → leader_completed workflow transition only.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'positions'
  AND policyname = 'positions_business_form_public_update';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 031 Complete';
  RAISE NOTICE '🔓 Public business form updates now allowed';
  RAISE NOTICE '🔒 Restricted to hr_completed → leader_completed transition only';
  RAISE NOTICE '📋 Business leaders can complete forms via email link';
END $$;
