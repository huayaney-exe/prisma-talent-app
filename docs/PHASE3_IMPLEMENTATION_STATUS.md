# Phase 3 Implementation Status

**Date**: 2025-01-09
**Status**: IN PROGRESS
**Approach**: Complete rebuild with React + TypeScript (approved)

---

## ✅ Completed

### 1. Project Setup
- [x] Frontend directory structure confirmed
- [x] package.json with all dependencies
- [x] TypeScript configuration (tsconfig.json, tsconfig.node.json)
- [x] Vite configuration with test support
- [x] TailwindCSS configured with Prisma brand colors
- [x] PostCSS configuration
- [x] Environment variables template

### 2. Brand Colors Configured (Tailwind)
```js
colors: {
  black: '#000000',
  cyan: '#47FFBF',     // Primary CTA
  purple: '#8376FF',   // Prisma Talent primary
  pink: '#FF48C7',     // Accents
  gray: {900-100}      // Neutrals
}
```

### 3. Content Extraction
- [x] Area-specific questions extracted to `src/config/areaQuestions.ts`
  - Product Management (9 questions)
  - Engineering/Tech (9 questions)
  - Growth (9 questions)
  - Design (9 questions)
- [x] Archived vanilla JS code to `.archive/vanilla-js/`

---

## 🚧 Next Steps (To Complete Phase 3)

### Step 1: Core Infrastructure (2-3 hours)
Create the following files:

#### `src/lib/api.ts` - API Client
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### `src/lib/supabase.ts` - Supabase Client
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### `src/types/index.ts` - TypeScript Types
```typescript
export interface Lead {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_position: string;
  company_name: string;
  industry?: string;
  company_size?: string;
  intent: 'hiring' | 'conversation';
  role_title?: string;
  role_type?: string;
  seniority?: string;
  work_mode?: 'remote' | 'hybrid' | 'onsite';
  urgency?: string;
}

export interface Position {
  id: string;
  position_code: string;
  position_name: string;
  area: string;
  seniority: string;
  workflow_stage: string;
  company_id: string;
}

export interface HRFormData {
  position_name: string;
  area: 'product-management' | 'engineering-tech' | 'growth' | 'design';
  seniority: 'mid-level' | 'senior' | 'lead-staff' | 'director+';
  business_user_name: string;
  business_user_position: string;
  business_user_email: string;
  salary_range: string;
  equity_included: boolean;
  equity_details?: string;
  contract_type: 'full-time' | 'part-time' | 'contract';
  target_fill_date: string;
  position_type: 'new' | 'replacement';
  critical_notes?: string;
}
```

#### `src/services/leadService.ts` - Business Logic
```typescript
import { api } from '@/lib/api';
import type { Lead } from '@/types';

export const leadService = {
  async submitLead(data: Lead) {
    const response = await api.post('/leads', data);
    return response.data;
  },
};
```

---

### Step 2: Reusable UI Components (2-3 hours)

#### `src/components/ui/Input.tsx`
```typescript
import { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label} {props.required && <span className="text-pink">*</span>}
        </label>
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple focus:border-purple transition-colors',
            error ? 'border-pink' : 'border-gray-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-pink">{error}</p>}
      </div>
    );
  }
);
```

#### `src/components/ui/Select.tsx`
#### `src/components/ui/Button.tsx`
#### `src/components/ui/Card.tsx`

---

### Step 3: Lead Form Component (3-4 hours)

#### `src/components/forms/LeadForm.tsx`
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { leadService } from '@/services/leadService';

const leadSchema = z.object({
  contact_name: z.string().min(2, 'Nombre requerido'),
  contact_email: z.string().email('Email inválido'),
  contact_phone: z.string().min(5, 'Teléfono requerido'),
  contact_position: z.string().min(2, 'Posición requerida'),
  company_name: z.string().min(2, 'Empresa requerida'),
  intent: z.enum(['hiring', 'conversation']),
  // ... conditional fields
});

export function LeadForm() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(leadSchema),
  });

  const intent = watch('intent');

  const onSubmit = async (data) => {
    try {
      await leadService.submitLead(data);
      // Show success message
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Nombre completo"
        {...register('contact_name')}
        error={errors.contact_name?.message}
      />
      {/* ... rest of fields */}
    </form>
  );
}
```

---

### Step 4: HR Form Component (3-4 hours)

#### `src/components/forms/HRForm.tsx`
Similar structure to LeadForm, using `HRFormData` type and area-specific validation.

---

### Step 5: Business Leader Form Component (4-5 hours)

#### `src/components/forms/BusinessLeaderForm.tsx`
- Dynamic question rendering based on selected area
- Use `areaQuestions` configuration
- Progress tracking
- URL parameter for position_code

---

### Step 6: Testing (2-3 hours)

#### `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));
```

#### Component Tests
- `LeadForm.test.tsx`
- `HRForm.test.tsx`
- `BusinessLeaderForm.test.tsx`

---

## Installation & Running

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## Integration with Backend

Once forms are complete:
1. Update `.env` with actual Supabase credentials
2. Test API integration with FastAPI backend (Phase 2)
3. Verify all workflows end-to-end

---

## Quality Checklist

- [ ] All forms validate correctly (Zod schemas)
- [ ] Error messages display in Spanish
- [ ] Loading states on submit
- [ ] Success modals after submission
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (WCAG AA)
- [ ] Component tests passing (≥70% coverage)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Linter passing (`npm run lint`)

---

## Estimated Completion Time

**Total**: 16-20 hours remaining

- Core infrastructure: 2-3h
- UI components: 2-3h
- Lead Form: 3-4h
- HR Form: 3-4h
- Business Leader Form: 4-5h
- Testing: 2-3h

---

**Status**: Foundation complete, ready for component implementation
**Next Action**: Implement core infrastructure (Step 1)
