#!/bin/bash
# ============================================================================
# Phase 1 Database Migration Runner
#
# Purpose: Execute Phase 1 migrations against Supabase database
# Usage: ./database/RUN_MIGRATIONS.sh
# Prerequisite: Set SUPABASE_DB_URL environment variable
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Prisma Talent Platform - Phase 1 Database Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if SUPABASE_DB_URL is set
if [ -z "$SUPABASE_DB_URL" ]; then
  echo -e "${RED}❌ Error: SUPABASE_DB_URL environment variable not set${NC}"
  echo ""
  echo "Set it using:"
  echo "  export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@db.vhjjibfblrkyfzcukqwa.supabase.co:5432/postgres'"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ Database connection configured${NC}"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo -e "${RED}❌ Error: psql not installed${NC}"
  echo "Install PostgreSQL client:"
  echo "  macOS: brew install postgresql"
  echo "  Ubuntu: sudo apt-get install postgresql-client"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ PostgreSQL client detected${NC}"
echo ""

# Confirm before proceeding
echo -e "${YELLOW}⚠️  This will run migrations against your Supabase database${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Migration cancelled"
  exit 0
fi

echo ""
echo -e "${BLUE}Starting Phase 1 migrations...${NC}"
echo ""

# Migration 1: Add prisma_admins table
echo -e "${YELLOW}[1/4] Running 005_add_prisma_admins.sql...${NC}"
psql "$SUPABASE_DB_URL" -f database/migrations/005_add_prisma_admins.sql
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ prisma_admins table created${NC}"
else
  echo -e "${RED}❌ Failed to create prisma_admins table${NC}"
  exit 1
fi
echo ""

# Migration 2: Update RLS policies
echo -e "${YELLOW}[2/4] Running 006_rls_policies_update.sql...${NC}"
psql "$SUPABASE_DB_URL" -f database/migrations/006_rls_policies_update.sql
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ RLS policies configured${NC}"
else
  echo -e "${RED}❌ Failed to configure RLS policies${NC}"
  exit 1
fi
echo ""

# Migration 3: Add triggers
echo -e "${YELLOW}[3/4] Running 007_triggers.sql...${NC}"
psql "$SUPABASE_DB_URL" -f database/migrations/007_triggers.sql
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database triggers created${NC}"
else
  echo -e "${RED}❌ Failed to create triggers${NC}"
  exit 1
fi
echo ""

# Test Phase 1
echo -e "${YELLOW}[4/4] Running test_phase1.sql...${NC}"
psql "$SUPABASE_DB_URL" -f database/test_phase1.sql
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Phase 1 tests passed${NC}"
else
  echo -e "${RED}❌ Phase 1 tests failed${NC}"
  echo "Check output above for details"
  exit 1
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Phase 1 Database Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "✅ Database tables created"
echo "✅ RLS policies configured"
echo "✅ Workflow triggers activated"
echo "✅ Tests passed"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Review database in Supabase Dashboard"
echo "2. Update default admin email (see MIGRATION_GUIDE.md)"
echo "3. Proceed to Phase 2: Backend API implementation"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
