# Apply Migration 019: Fix Hardcoded URLs in Triggers

## Purpose
Remove hardcoded production URLs from database triggers and replace with environment-based configuration.

## Critical Issue Being Fixed
Database triggers in migration 014 have hardcoded URLs:
- Line 22: `form_url := 'https://talent.getprisma.io/business-form?code=' || NEW.position_code;`
- Line 97: `admin_url := 'https://talent.getprisma.io/admin/positions/' || NEW.id;`

This blocks development/staging environments from working correctly.

## Solution
Creates an `app_config` table to store environment-specific URLs that triggers can query.

## How to Apply (Supabase Dashboard)

### Step 1: Access Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `vhjjibfblrkyfzcukqwa`
3. Click "SQL Editor" in left sidebar
4. Click "New query"

### Step 2: Run Migration
1. Open the file: `database/migrations/019_fix_hardcoded_urls_in_triggers.sql`
2. Copy the ENTIRE contents
3. Paste into Supabase SQL Editor
4. Click "Run" button

### Step 3: Verify Success
You should see output similar to:
```
NOTICE: ✅ Migration 019 complete: Hardcoded URLs removed from triggers
NOTICE: 📋 Created app_config table for environment configuration
NOTICE: 🔧 Updated notify_business_user_on_hr_completion() function
NOTICE: 🔧 Updated notify_hr_on_business_completion() function
NOTICE:
NOTICE: ⚠️  IMPORTANT: Update app_config values for production:
NOTICE:    UPDATE app_config SET value = 'https://talent.prisma.pe' WHERE key = 'frontend_url';
NOTICE:    UPDATE app_config SET value = 'https://talent.prisma.pe/admin' WHERE key = 'admin_dashboard_url';
```

### Step 4: Update Config for Your Environment

**For Development (default - already set):**
```sql
-- Default values are already configured for localhost:3000
SELECT * FROM app_config;
```

**For Production (when deploying):**
```sql
-- Run this AFTER deploying to production
UPDATE app_config SET value = 'https://talent.prisma.pe' WHERE key = 'frontend_url';
UPDATE app_config SET value = 'https://talent.prisma.pe/admin' WHERE key = 'admin_dashboard_url';
```

## What This Migration Does

1. **Creates `app_config` table**: Stores environment-specific configuration
2. **Adds helper function**: `get_config(key)` to retrieve config values
3. **Updates trigger 1**: `notify_business_user_on_hr_completion()` - Uses `get_config('frontend_url')`
4. **Updates trigger 2**: `notify_hr_on_business_completion()` - Uses `get_config('admin_dashboard_url')`

## Testing After Migration

### Test in Development
1. Create a position and complete HR form
2. Check `email_communications` table:
```sql
SELECT template_data->>'form_url' as form_url
FROM email_communications
WHERE email_type = 'leader_form_request'
ORDER BY created_at DESC
LIMIT 1;
```

Expected result: `http://localhost:3000/business-form?code=...`

### Test in Production (after deployment)
1. Update app_config with production URLs (see Step 4 above)
2. Create a position and complete HR form
3. Verify email contains production URL: `https://talent.prisma.pe/business-form?code=...`

## Rollback (if needed)
```sql
-- Revert to migration 014 trigger functions
-- Copy functions from database/migrations/014_update_email_triggers.sql
-- (Not recommended - this migration is critical for multi-environment support)
```

## Next Steps
1. ✅ Apply this migration
2. ✅ Verify default config is set to localhost
3. ⏳ When deploying to production, update app_config with production URLs
4. ⏳ Test email workflows in each environment
