#!/usr/bin/env python3
"""
Migration runner using Supabase client
Runs SQL migration 013 to add email worker columns
"""
import os
import sys
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
env_path = backend_path / ".env"
load_dotenv(env_path)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# Read migration SQL
migration_file = Path(__file__).parent / "migrations" / "013_email_worker_columns.sql"
with open(migration_file, "r") as f:
    migration_sql = f.read()

print(f"📋 Running migration: {migration_file.name}")
print(f"🔗 Database: {supabase_url}")

# Execute migration using Supabase RPC
try:
    # Use Supabase's SQL editor functionality via RPC
    result = supabase.rpc("exec_sql", {"query": migration_sql}).execute()
    print("✅ Migration completed successfully!")
    print(f"Result: {result}")
except Exception as e:
    # If RPC doesn't exist, we need to use direct database connection
    print(f"⚠️ RPC method failed: {e}")
    print("Trying alternative method using direct SQL execution...")

    # Alternative: Use postgres library
    try:
        import psycopg2

        # Construct connection string using Supabase pooler
        conn_str = f"postgresql://postgres.vhjjibfblrkyfzcukqwa:Vigorelli23$@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()

        # Execute migration
        cursor.execute(migration_sql)
        conn.commit()

        cursor.close()
        conn.close()

        print("✅ Migration completed successfully using psycopg2!")

    except ImportError:
        print("❌ psycopg2 not installed. Install with: pip install psycopg2-binary")
        sys.exit(1)
    except Exception as e2:
        print(f"❌ Migration failed: {e2}")
        sys.exit(1)
