# Architecture Decision: Client Invitation Flow

## Problem Analysis

### Root Cause
**pg_net is fundamentally async** - it queues HTTP requests for background processing, but PostgreSQL functions are **synchronous**. We cannot wait for async results within a transaction.

### What We Discovered
1. ✅ Config access works (SECURITY DEFINER + explicit schema qualification)
2. ✅ pg_net request queueing works (returns request_id)
3. ❌ Response retrieval doesn't work (transaction isolation + async timing)

### First Principles
- **Transaction Isolation**: Our function runs in transaction T1
- **Background Workers**: pg_net runs OUTSIDE transactions
- **Race Condition**: Response may not be visible to T1 before T1 commits
- **Timeout**: We wait 30 seconds but response never appears in our transaction context

## Solution Options

### Option 1: Supabase Edge Function (RECOMMENDED) ✅
**Architecture**: Frontend → Edge Function → Supabase Auth Admin API

**Advantages**:
- Native async/await in JavaScript/TypeScript
- Direct access to Supabase Admin client
- Proper error handling and retries
- No transaction isolation issues
- **Still pure Supabase** (Edge Functions are Supabase infrastructure)

**Implementation**:
```typescript
// supabase/functions/invite-client/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { email, company_id, company_name, hr_user_id, full_name } = await req.json()

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { company_id, company_name, hr_user_id, full_name, role: 'client' },
    redirectTo: `${Deno.env.get('FRONTEND_URL')}/client/dashboard`
  })

  if (error) return new Response(JSON.stringify({ success: false, error }), { status: 400 })

  // Update company record
  await supabaseAdmin.from('companies')
    .update({ primary_contact_auth_id: data.user.id })
    .eq('id', company_id)

  // Track email
  await supabaseAdmin.from('email_communications').insert({
    company_id, email_type: 'client_invitation',
    recipient_email: email, recipient_name: full_name,
    subject_line: 'Bienvenido a Prisma Talent',
    status: 'sent', sent_at: new Date()
  })

  return new Response(JSON.stringify({ success: true, auth_user_id: data.user.id }))
})
```

**Cost**: $0 (included in Supabase Pro plan, 2M invocations free)

### Option 2: Two-Phase Async Pattern
**Architecture**: Database trigger → pg_net → webhook → update

**Disadvantages**:
- Complex setup (triggers, webhooks, polling)
- Race conditions and timing issues
- Harder to debug and maintain
- Still uses pg_net which is the problem

### Option 3: Keep Render Backend
**Cost**: $7-21/month
**Disadvantage**: Defeats the purpose of pure Supabase architecture

## DECISION: Use Supabase Edge Functions ✅

### Justification
1. **Still Pure Supabase**: Edge Functions are Supabase native infrastructure
2. **Proper Async Handling**: JavaScript async/await works correctly
3. **No Additional Cost**: Included in existing plan
4. **Better than Database Functions**: HTTP calls belong in application layer, not database
5. **Maintains Security**: Service role key stays server-side
6. **Easier to Test**: Can test locally with Supabase CLI

### Implementation Plan
1. Create `supabase/functions/invite-client/` directory
2. Implement Edge Function with proper error handling
3. Deploy via `supabase functions deploy invite-client`
4. Update frontend to call Edge Function instead of RPC
5. Keep database migrations for schema (just remove invite_client function)
6. Delete Render deployment after validation

### Why This Is Better Than Database Functions
- **Separation of Concerns**: HTTP/API calls belong in application layer
- **Async by Default**: No fighting PostgreSQL's synchronous nature
- **Modern Stack**: Deno + TypeScript with full npm ecosystem
- **Debugging**: Better error messages and logging
- **Testing**: Can unit test Edge Functions easily

## Next Steps
1. Create Edge Function
2. Test locally with `supabase functions serve`
3. Deploy to Supabase
4. Update frontend clientService.ts
5. Validate complete workflow
6. Delete Render backend
