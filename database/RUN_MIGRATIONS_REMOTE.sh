#!/bin/bash

# Prisma Talent - Remote Migration Execution Script
# Runs all migrations sequentially on Supabase production database

set -e  # Exit on error

echo "🚀 Prisma Talent - Migration Execution"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get database password
echo "📋 You need the database password from Supabase"
echo "   Go to: https://app.supabase.com/project/vhjjibfblrkyfzcukqwa/settings/database"
echo "   Copy the 'Database Password' (not the connection string)"
echo ""
read -sp "Enter database password: " DB_PASSWORD
echo ""
echo ""

# Database connection details
PROJECT_REF="vhjjibfblrkyfzcukqwa"
DB_HOST="aws-0-us-east-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.${PROJECT_REF}"

# Full connection string
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "🔍 Testing database connection..."
if psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
    echo ""
else
    echo -e "${RED}❌ Database connection failed. Please check your password.${NC}"
    exit 1
fi

# List of migration files in order
MIGRATIONS=(
    "001_initial_schema.sql"
    "002_rls_policies.sql"
    "003_indexes.sql"
    "004_sample_data.sql"
    "005_add_prisma_admins.sql"
    "006_rls_policies_update.sql"
    "007_triggers.sql"
    "010_admin_mvp_schema.sql"
    "011_admin_rls_policies.sql"
    "012_leads_table_expansion.sql"
)

echo "📊 Found ${#MIGRATIONS[@]} migrations to run"
echo ""

# Run each migration
MIGRATION_DIR="migrations"
SUCCESS_COUNT=0
FAILED_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    echo "▶️  Running: $migration"

    if psql "$DB_URL" -f "${MIGRATION_DIR}/${migration}" > /tmp/migration_output.log 2>&1; then
        echo -e "${GREEN}   ✅ Success${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}   ❌ Failed${NC}"
        echo -e "${RED}   Error details:${NC}"
        cat /tmp/migration_output.log | tail -10
        FAILED_COUNT=$((FAILED_COUNT + 1))

        # Ask if we should continue
        echo ""
        read -p "Continue with next migration? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Migration stopped by user"
            exit 1
        fi
    fi
    echo ""
done

# Summary
echo "======================================="
echo "📊 Migration Summary"
echo "======================================="
echo -e "${GREEN}✅ Successful: $SUCCESS_COUNT${NC}"
if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "${RED}❌ Failed: $FAILED_COUNT${NC}"
fi
echo ""

# Verify tables
echo "🔍 Verifying database tables..."
psql "$DB_URL" -c "
SELECT
    schemaname as schema,
    tablename as table_name
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
"

echo ""
echo "✅ Migration execution complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Create storage buckets for resumes/portfolios"
echo "   2. Create admin user in Supabase Auth dashboard"
echo "   3. Deploy to Vercel with environment variables"
