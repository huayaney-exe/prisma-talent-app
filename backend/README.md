# Prisma Talent Platform - Backend API

FastAPI-based backend for the Prisma Talent Platform MVP.

## Tech Stack

- **Framework**: FastAPI 0.109+
- **Python**: 3.11+
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (JWT)
- **Email**: Resend
- **Testing**: Pytest + httpx
- **Code Quality**: Black, Ruff, Mypy

## Project Structure

```
backend/
├── app/
│   ├── api/v1/              # API endpoints
│   │   ├── leads.py         # Lead management
│   │   └── enrollment.py    # Client enrollment
│   ├── core/                # Core configuration
│   │   ├── config.py        # Settings
│   │   ├── database.py      # Supabase client
│   │   └── security.py      # Authentication
│   ├── models/              # Pydantic models
│   │   ├── lead.py
│   │   └── enrollment.py
│   ├── services/            # Business logic
│   │   ├── email_service.py
│   │   ├── lead_service.py
│   │   └── enrollment_service.py
│   └── main.py              # FastAPI app
├── tests/
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
├── pyproject.toml           # Poetry dependencies
└── .env.example             # Environment template
```

## Setup

### Prerequisites

- Python 3.11+
- Poetry (package manager)
- Supabase project
- Resend account

### Installation

```bash
# Install Poetry (if not installed)
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
cd backend
poetry install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Environment Variables

Required variables (see `.env.example`):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (admin operations)
- `RESEND_API_KEY`: Resend API key
- `JWT_SECRET`: Secret for JWT signing
- `ALLOWED_ORIGINS`: CORS origins (comma-separated)

## Development

### Run Development Server

```bash
# Activate virtual environment
poetry shell

# Run with auto-reload
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the main.py script
poetry run python -m app.main
```

API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Run Tests

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=app --cov-report=html

# Run specific test file
poetry run pytest tests/integration/test_leads_api.py

# Run with verbose output
poetry run pytest -v
```

### Code Quality

```bash
# Format code
poetry run black app/ tests/

# Lint code
poetry run ruff check app/ tests/

# Type check
poetry run mypy app/
```

## API Endpoints

### Public Endpoints

#### `POST /api/v1/leads`
Submit lead form from landing page.

**Request**:
```json
{
  "contact_name": "Juan Pérez",
  "position": "VP Product",
  "company_name": "Tech Startup",
  "contact_email": "juan@techstartup.com",
  "contact_phone": "+51999999999",
  "intent": "hiring",
  "role_title": "Senior Product Manager",
  "role_type": "Product Manager",
  "level": "Senior (5-8 años)",
  "work_mode": "Híbrido",
  "urgency": "Standard",
  "terms_acceptance": true
}
```

**Response**:
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "message": "Lead submitted successfully",
  "next_steps": "We'll contact you within 24 hours..."
}
```

### Admin Endpoints (Authentication Required)

#### `GET /api/v1/leads`
Get all leads (Prisma admin only).

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
[
  {
    "id": "uuid",
    "company_name": "Tech Startup",
    "contact_name": "Juan Pérez",
    "contact_email": "juan@techstartup.com",
    "intent": "hiring",
    "lead_submitted_at": "2025-01-09T...",
    "subscription_status": "lead"
  }
]
```

#### `POST /api/v1/enrollment`
Enroll new client (Prisma admin only).

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Request**:
```json
{
  "company_name": "Tech Startup SAC",
  "company_domain": "techstartup.com",
  "industry": "Technology",
  "company_size": "11-50",
  "website_url": "https://techstartup.com",
  "hr_email": "hr@techstartup.com",
  "hr_full_name": "María García",
  "hr_position": "HR Manager",
  "hr_phone": "+51999888777",
  "subscription_plan": "basic"
}
```

**Response**:
```json
{
  "company_id": "uuid",
  "hr_user_id": "uuid",
  "invitation_token": "token_abc123",
  "message": "Client enrolled successfully",
  "next_steps": "HR user will receive onboarding email..."
}
```

## Authentication

The API uses Supabase Auth with JWT tokens.

### Getting a Token

1. **Sign up/Login via Supabase** (frontend implements this)
2. **Get JWT token** from Supabase Auth
3. **Use token in requests**:
   ```bash
   curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/v1/leads
   ```

### User Roles

- **Prisma Admin**: Full access to all endpoints
- **HR User**: Access to company-specific data
- **Public**: Lead submission only

## Deployment

### Render (Recommended)

1. **Create new Web Service** on Render
2. **Connect GitHub repository**
3. **Configuration**:
   - **Build Command**: `poetry install`
   - **Start Command**: `poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3.11

4. **Environment Variables**: Add all from `.env.example`

5. **Deploy**: Render auto-deploys on git push

### Manual Deployment

```bash
# Build
poetry install --no-dev

# Run production
poetry run uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info
```

## Troubleshooting

### Supabase Connection Issues

```bash
# Test Supabase connection
poetry run python -c "
from supabase import create_client
from app.core.config import settings
client = create_client(settings.supabase_url, settings.supabase_key)
print('✅ Connected to Supabase')
"
```

### Import Errors

```bash
# Reinstall dependencies
poetry install --no-cache
```

### Test Failures

```bash
# Run tests with full output
poetry run pytest -vv -s
```

## Next Steps (Phase 3)

- [ ] Position Workflow API
- [ ] Job Description Management API
- [ ] Candidate/Applicant API
- [ ] Admin Dashboard endpoints
- [ ] WebSocket support for real-time updates
- [ ] File upload endpoints (resumes)

## Support

For issues or questions:
- **Email**: hello@getprisma.io
- **Documentation**: See `docs/` directory in project root
