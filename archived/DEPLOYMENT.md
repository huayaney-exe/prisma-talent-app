# Production Deployment Guide

Complete guide for deploying the Prisma Talent Platform to production.

## Architecture Overview

- **Frontend**: React + TypeScript + Vite → Vercel
- **Backend**: FastAPI (Python) → Render.com or similar
- **Database**: Supabase PostgreSQL (managed)
- **Email**: Resend API
- **Authentication**: Supabase Auth (magic links)

---

## Environment Variables

### Frontend Environment Variables (Vercel)

Create these in Vercel Project Settings → Environment Variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://vhjjibfblrkyfzcukqwa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoamppYmZibHJreWZ6Y3VrcXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODY2ODEsImV4cCI6MjA3MzQ2MjY4MX0.v8dDoMtfWxqB9_JXJw4laT3bi2ugZkwchGna7lZbaq8

# Application Metadata
VITE_APP_NAME=Prisma Talent
VITE_APP_VERSION=1.0.0

# Backend API URL (update after deploying backend)
VITE_API_URL=https://your-backend-domain.com
```

**Note**: The VITE_API_URL must point to your deployed backend service.

### Backend Environment Variables (Render.com or similar)

Create these in your backend service environment settings:

```bash
# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
SUPABASE_URL=https://vhjjibfblrkyfzcukqwa.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoamppYmZibHJreWZ6Y3VrcXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODY2ODEsImV4cCI6MjA3MzQ2MjY4MX0.v8dDoMtfWxqB9_JXJw4laT3bi2ugZkwchGna7lZbaq8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoamppYmZibHJreWZ6Y3VrcXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg4NjY4MSwiZXhwIjoyMDczNDYyNjgxfQ.m8W9XdHNl2Y-b8tN9HsM9RL5aZrNj6dPu6vEIVBZLUA

# ============================================================================
# RESEND EMAIL CONFIGURATION
# ============================================================================
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Prisma Talent

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
APP_NAME=Prisma Talent Platform
APP_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=False

# Frontend URL (for CORS and redirects)
FRONTEND_URL=https://your-vercel-deployment.vercel.app

# Admin user email (for initial setup)
ADMIN_EMAIL=luis@prisma.com

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
# Comma-separated list of allowed origins
CORS_ORIGINS=https://your-vercel-deployment.vercel.app,https://yourdomain.com

# ============================================================================
# SERVER CONFIGURATION
# ============================================================================
HOST=0.0.0.0
PORT=8000
WORKERS=2
LOG_LEVEL=info

# ============================================================================
# SECURITY (Optional - generate with: openssl rand -hex 32)
# ============================================================================
# SECRET_KEY=your_secret_key_for_session_encryption
```

---

## Pre-Deployment Checklist

### Database Migrations

1. **Apply Migration 013** (required for email worker):
   - Go to Supabase Dashboard → SQL Editor
   - Run the migration in `database/migrations/013_email_worker_columns.sql`
   - See `database/APPLY_MIGRATION_013.md` for detailed instructions

2. **Verify All Migrations Applied**:
   ```sql
   SELECT * FROM schema_migrations ORDER BY version DESC;
   ```

3. **Verify RLS Policies**:
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

### Backend Verification

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run Tests** (if available):
   ```bash
   pytest
   ```

3. **Test Email Worker Locally**:
   - Set all environment variables
   - Run: `python -m uvicorn app.main:app --reload`
   - Check logs for: "✅ Email worker started successfully"

### Frontend Verification

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Build Test**:
   ```bash
   npm run build
   ```

3. **Type Check**:
   ```bash
   npm run type-check  # if available
   ```

---

## Deployment Steps

### 1. Deploy Backend to Render.com

1. **Create New Web Service**:
   - Connect your GitHub repository
   - Select `backend` as root directory
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

2. **Configure Environment Variables**:
   - Add all backend environment variables listed above
   - Update `FRONTEND_URL` with your Vercel URL
   - Update `CORS_ORIGINS` with your Vercel URL

3. **Deploy and Verify**:
   - Wait for deployment to complete
   - Check logs for: "Application startup complete"
   - Test health endpoint: `https://your-backend.onrender.com/health`

### 2. Deploy Frontend to Vercel

1. **Connect Repository**:
   - Import project from GitHub
   - Vercel will auto-detect Vite configuration

2. **Configure Root Directory**:
   - Vercel should use the root `vercel.json`
   - This automatically builds from `frontend/` subdirectory

3. **Add Environment Variables**:
   - Add all frontend environment variables
   - **Critical**: Update `VITE_API_URL` with your backend URL

4. **Deploy**:
   - Vercel will automatically deploy
   - Every push to `main` branch will trigger deployment

### 3. Post-Deployment Verification

1. **Test Public Pages**:
   - Visit landing page: `https://your-vercel-app.vercel.app/`
   - Test lead form: `/lead`
   - Verify no console errors

2. **Test Admin Flow**:
   - Login: `/admin/login`
   - Create client: `/admin/clients/new`
   - Verify magic link invitation sent

3. **Test Client Flow**:
   - Check client email for magic link
   - Login via magic link
   - Submit HR form
   - Verify email to business leader

4. **Test Complete Workflow**:
   - HR form → Leader notification
   - Leader form → JD creation
   - JD validation → Publication
   - Job listing → Application

5. **Monitor Email Worker**:
   - Check backend logs for email processing
   - Verify emails are being sent via Resend
   - Check Resend dashboard for delivery status

---

## Production Monitoring

### Backend Health Checks

- **Endpoint**: `GET /health`
- **Expected Response**: `{"status": "healthy"}`
- **Monitor**: Every 5 minutes

### Email Worker Monitoring

Check backend logs for:
- ✅ "Email worker started successfully"
- ❌ Any email processing errors
- Retry attempts and failures

### Database Monitoring

Monitor Supabase dashboard for:
- Connection pool usage
- Query performance
- RLS policy violations
- Storage usage

### Frontend Monitoring

- Vercel Analytics (automatic)
- Error tracking via browser console
- Performance metrics
- Core Web Vitals

---

## Rollback Procedures

### Frontend Rollback (Vercel)

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "Promote to Production"

### Backend Rollback (Render.com)

1. Go to Render Dashboard → Service → Deploys
2. Find last working deploy
3. Click "Rollback to this deploy"

### Database Rollback

**WARNING**: Database rollbacks are risky. Only if absolutely necessary:

1. Restore from Supabase backup
2. Re-apply migrations up to last known good state
3. Verify data integrity

---

## Troubleshooting

### Email Worker Not Sending Emails

1. Check `RESEND_API_KEY` is set correctly
2. Verify migration 013 was applied
3. Check backend logs for errors
4. Verify `email_communications` table has pending emails

### Magic Links Not Working

1. Verify `FRONTEND_URL` matches actual Vercel URL
2. Check Supabase Auth settings
3. Verify email templates in Supabase dashboard
4. Check spam folder

### CORS Errors

1. Update `CORS_ORIGINS` in backend env vars
2. Include your Vercel domain
3. Redeploy backend after updating

### Database Connection Issues

1. Verify `SUPABASE_URL` is correct
2. Check Supabase project is not paused
3. Verify RLS policies allow operations
4. Check service role key is valid

---

## Security Checklist

- ✅ All secrets in environment variables (never in code)
- ✅ CORS origins properly configured
- ✅ RLS policies enabled on all tables
- ✅ Service role key only in backend
- ✅ Anon key only exposes safe operations
- ✅ HTTPS enforced (Vercel automatic, Render configurable)
- ✅ Security headers configured (see `vercel.json`)
- ✅ Rate limiting enabled on API endpoints
- ✅ Email validation on all user inputs

---

## Performance Optimization

### Frontend

- Static assets cached (31536000s = 1 year)
- Vite code splitting automatic
- Lazy load routes if needed

### Backend

- Supabase connection pooling
- Email worker runs in background
- Rate limiting prevents abuse

### Database

- Indexes on frequently queried columns
- RLS policies optimized
- Connection pooling enabled

---

## Maintenance

### Regular Tasks

**Weekly**:
- Review error logs
- Check email delivery rates
- Monitor storage usage

**Monthly**:
- Update dependencies (security patches)
- Review performance metrics
- Database vacuum (automatic in Supabase)

**Quarterly**:
- Dependency major version updates
- Security audit
- Performance optimization review

---

## Support and Contact

**Deployment Issues**: luis@prisma.com
**Supabase Support**: https://supabase.com/dashboard/support
**Vercel Support**: https://vercel.com/support
**Render Support**: https://render.com/docs
