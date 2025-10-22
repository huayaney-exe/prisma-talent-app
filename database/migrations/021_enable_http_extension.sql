-- Migration 021: Enable HTTP Extension for Email Sending
-- Date: 2025-10-22
-- Purpose: Enable pg_net extension to send HTTP requests from database functions

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions to roles
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ HTTP extension (pg_net) enabled successfully';
  RAISE NOTICE '📧 Database can now send HTTP requests to external APIs (Resend, Supabase Auth)';
END $$;
