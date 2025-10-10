# Prisma Talent Platform - Frontend

Production-grade React + TypeScript frontend for the Prisma Talent headhunting platform.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling with Prisma brand tokens
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Supabase** - Auth, database, and storage
- **Vitest** - Testing framework

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── forms/           # Form components (Lead, HR, Business Leader)
│   │   └── ui/              # Reusable UI components
│   ├── config/              # Configuration files (area questions)
│   ├── lib/                 # Utilities (API, Supabase, validation)
│   ├── services/            # Business logic layer
│   ├── types/               # TypeScript type definitions
│   └── test/                # Test setup and utilities
├── public/                  # Static assets (favicon, robots.txt)
├── docs/                    # Documentation
└── package.json
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see `/backend` directory)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your values
# VITE_API_URL=http://localhost:8000
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
# Start dev server (http://localhost:3000)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
VITE_APP_NAME=Prisma Talent
VITE_APP_URL=http://localhost:3000
```

## Features

### Forms

1. **Lead Form** (`/lead-form`)
   - First interaction with prospective clients
   - Progressive disclosure based on intent (hiring vs conversation)
   - Validates and submits leads to backend

2. **HR Form** (`/hr-form`)
   - Create new position requisitions
   - Notifies business leaders via email
   - Generates unique position codes

3. **Business Leader Form** (`/business-form?code=POS-XXX`)
   - Area-specific questions (9 per area)
   - Progress tracking
   - Step-by-step navigation
   - Completes business specifications for positions

### Architecture

- **Service Layer Pattern**: Business logic abstracted into services
- **Type-Safe Development**: Strict TypeScript with comprehensive types
- **Component-Driven**: Reusable UI components with variants
- **Form Validation**: Zod schemas with Spanish error messages
- **Error Handling**: User-friendly error messages and loading states
- **Progressive Disclosure**: Conditional fields based on user input

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

**Coverage Targets**:
- Statements: ≥70%
- Branches: ≥70%
- Functions: ≥70%
- Lines: ≥70%

## Deployment

### Build

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "@api-url",
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### Other Platforms

- **Netlify**: Drag and drop `dist/` folder
- **Railway**: Connect GitHub repo
- **AWS S3 + CloudFront**: Upload `dist/` to S3 bucket

## Code Quality

### TypeScript

- Strict mode enabled
- No `any` types allowed
- Comprehensive type definitions in `src/types/`

### Linting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Formatting

```bash
npm run format      # Format with Prettier
```

## Documentation

- **[PHASE3_COMPLETION_SUMMARY.md](docs/PHASE3_COMPLETION_SUMMARY.md)** - Implementation guide
- **[INTEGRATION_TESTING_GUIDE.md](docs/INTEGRATION_TESTING_GUIDE.md)** - Backend integration testing
- **[FRONTEND_ALIGNMENT_ANALYSIS.md](docs/FRONTEND_ALIGNMENT_ANALYSIS.md)** - Architecture decision documentation

## Brand Compliance

All UI follows the Prisma brand guidelines:

- **Colors**: Purple `#8376FF`, Cyan `#47FFBF`, Pink `#FF48C7`, Black `#000000`
- **Typography**: Inter (primary), JetBrains Mono (code)
- **Design**: Minimal, executive, whitespace-rich

## Contributing

1. Follow existing code structure and patterns
2. Write tests for new components
3. Ensure TypeScript types are comprehensive
4. Validate forms with Zod schemas
5. Use Spanish for all user-facing text
6. Follow Prisma brand guidelines

## Troubleshooting

### CORS Errors

Ensure backend has CORS configured:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
)
```

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Type Errors

```bash
# Regenerate TypeScript declarations
npm run type-check
```

## Support

For issues or questions:
- Review documentation in `/docs`
- Check backend integration guide
- Verify environment variables are set correctly

## License

Proprietary - Prisma Talent Platform
