# ChainLinked Admin Panel — Design Spec

## Overview

Admin dashboard for ChainLinked, a LinkedIn content management SaaS. Provides a single-founder view into user activity, content generation, token costs, system health, and product analytics. Built as a monolithic Next.js app leveraging the existing shadcn dashboard scaffold.

## Context

- **Product:** ChainLinked — AI-powered LinkedIn content creation, scheduling, team collaboration, analytics
- **Database:** Supabase PostgreSQL (project: `baurjucvzdboavbcuxjh`, region: ap-south-1)
- **Current scale:** 7 users, 137 generated posts, 54 published posts, 62 templates, 24 prompt usage logs
- **Admin users:** Solo founder only
- **Existing scaffold:** Next.js 16 + React 19 + shadcn/ui (22 components) + Recharts + TanStack Table + dnd-kit

## Authentication

### Design
- **Storage:** `admin_users` table in the existing Supabase project
- **Schema:**
  - `id` (uuid, PK)
  - `username` (text, unique)
  - `password_hash` (text, bcrypt)
  - `created_at` (timestamptz)
  - `last_login` (timestamptz)
- **Hashing:** bcrypt via `bcryptjs`
- **Session:** JWT stored in HTTP-only secure cookie, signed with `ADMIN_JWT_SECRET` env var
- **Expiry:** 24 hours, refreshed on activity
- **Flow:**
  1. `/login` page with username + password form
  2. POST `/api/auth/login` — verify credentials, set cookie, return success
  3. Next.js middleware on `/dashboard/*` routes — verify JWT, redirect to `/login` if invalid
  4. POST `/api/auth/logout` — clear cookie
- **No signup page** — admin accounts created via seed script or direct SQL
- **No Google OAuth** — username/password only

### Security
- HTTP-only, Secure, SameSite=Strict cookies (also serves as CSRF protection for mutation endpoints)
- bcrypt cost factor 12
- Rate limiting on login endpoint: simple in-memory rate limiter (5 attempts per IP per 15 minutes)
- All admin actions logged to application console (structured JSON) as a lightweight audit trail

## Data Access

- **Supabase service role key** for all queries (bypasses RLS)
- **Server components** for all data fetching (no client-side Supabase calls)
- **API routes** only for mutations (login/logout, user actions like suspend/delete)
- **Environment variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_JWT_SECRET`
  - `POSTHOG_API_KEY` (personal API key for server-side queries)
  - `POSTHOG_PROJECT_ID`
  - `OPENROUTER_API_KEY` (for usage API, if available)
  - `POSTHOG_DASHBOARD_URL` (shared dashboard URL for iframe embed)

## Pages & Navigation

### Sidebar Structure
```
Dashboard (overview)
├── Users
│   ├── All Users
│   ├── User Detail (dynamic: /users/[id])
│   └── Onboarding Funnel
├── Content
│   ├── Generated Posts
│   ├── Scheduled Posts
│   ├── Templates
│   └── Moderation Queue
├── Analytics
│   ├── Token Usage
│   ├── Feature Usage
│   └── PostHog
├── System
│   ├── Background Jobs
│   ├── Prompts Management
│   └── Feature Flags
└── Settings
    └── Admin Account
```

### Dashboard Overview (`/dashboard`)

**Top row — 6 metric cards:**
| Card | Source | Calculation |
|------|--------|-------------|
| Total Users | `profiles` count (proxy for auth.users) | Total + growth % vs previous week |
| Active Users (7d) | `profiles` where `extension_last_active_at` > 7d ago, OR users with recent `generated_posts`/`scheduled_posts` in last 7d | Count |
| Posts Generated | `generated_posts` count | Total + this week count |
| Posts Published | `scheduled_posts` where status=posted + `my_posts` count | Total + this week |
| Token Usage | `prompt_usage_logs` sum of `total_tokens` | Total tokens + estimated cost sum |
| Teams | `teams` count | Total teams + total companies |

**Middle row — 2 charts:**
- **User signups over time** — Area chart, data from `profiles.created_at`, grouped by day. Filters: 7d / 30d / 90d
- **Token cost over time** — Bar chart, data from `prompt_usage_logs.created_at` + `estimated_cost`, grouped by day. Stacked by model

**Bottom row — 2 panels:**
- **Recent Activity** — Last 10 events: new signups, posts generated, posts scheduled. Combined query from `profiles`, `generated_posts`, `scheduled_posts` ordered by created_at
- **System Health** — Inngest job summary from `suggestion_generation_runs`, `company_context`, `research_sessions`: running/completed/failed counts

### Users — All Users (`/dashboard/users`)

**Table columns:** Name, Email, Signup Date, Onboarding Status (complete/in-progress/not-started), Posts Generated (count), Last Active, LinkedIn Connected (badge), Team Name, Actions dropdown

**Filters:** Date range, onboarding status, LinkedIn connected Y/N, has team Y/N
**Search:** By name or email
**Actions:** View detail, suspend user, delete user

**Data sources:** `profiles` joined with counts from `generated_posts`, `team_members` → `teams`

### Users — User Detail (`/dashboard/users/[id]`)

**Sections:**
1. **Profile header** — Avatar, name, email, signup date, onboarding status, LinkedIn connection status
2. **Activity stats** — Cards: posts generated, posts scheduled, posts published, templates created, token usage, estimated cost
3. **Recent posts** — Table of their generated/scheduled posts with content preview, status, date
4. **Token usage breakdown** — Chart of their token usage over time, by feature
5. **Actions** — Suspend/unsuspend, delete account, reset (with confirmation modals)

**Data sources:** `profiles`, `generated_posts`, `scheduled_posts`, `my_posts`, `templates`, `prompt_usage_logs` — all filtered by user_id

### Users — Onboarding Funnel (`/dashboard/users/onboarding`)

**Funnel visualization** (horizontal bar chart or step diagram):
1. Signed Up (total users)
2. Onboarding Completed (`profiles.onboarding_completed = true`)
3. LinkedIn Connected (`linkedin_tokens` table has entry for user, OR `profiles.linkedin_user_id IS NOT NULL`)
4. First Post Generated (users with >= 1 `generated_posts`)
5. First Post Scheduled (users with >= 1 `scheduled_posts`)
6. Active Last 7 Days

**Shows:** Count and conversion % at each step

### Content — Generated Posts (`/dashboard/content/generated`)

**Table:** Content (truncated), User, Post Type, Source (discover/research/direct), Status, Word Count, Created At
**Filters:** Post type, source, date range, user
**Actions:** View full content (expandable row or drawer), delete

### Content — Scheduled Posts (`/dashboard/content/scheduled`)

**Table:** Content (truncated), User, Scheduled For, Timezone, Status (pending/posting/posted/failed), Error Message, Posted At
**Filters:** Status, date range, user
**Highlight:** Failed posts in red with error message visible

### Content — Templates (`/dashboard/content/templates`)

**Table:** Name, Creator, Category, Public/Private, Usage Count, AI Generated (badge), Created At
**Filters:** Category, public/private, AI-generated Y/N
**Actions:** View content, delete

### Content — Moderation Queue (`/dashboard/content/moderation`)

**Table:** All generated posts + scheduled posts, sorted by newest. Content preview, user, type, date
**Search:** Full-text content search
**Actions:** Delete, view full content
**Note:** No existing flagging system — moderation is manual review only. Flagging can be added in a future iteration with a DB migration.

### Analytics — Token Usage (`/dashboard/analytics/tokens`)

**Summary cards:**
- Total Tokens Used (all time)
- Total Estimated Cost
- Avg Cost Per User
- Avg Cost Per Post
- Tokens This Week
- Cost This Week

**Charts:**
- Daily cost trend (area chart, 7d/30d/90d)
- Cost by model (pie chart, from `prompt_usage_logs.model`)
- Cost by feature (bar chart, from `prompt_usage_logs.feature`)
- Avg response time (line chart, from `prompt_usage_logs.response_time_ms`)

**Table:** Per-user breakdown: User, Total Tokens, Total Cost, Posts Generated, Avg Tokens/Post, Last Used

**OpenRouter supplement:** If OpenRouter API provides usage data, add a card showing account balance/remaining credits

### Analytics — Feature Usage (`/dashboard/analytics/features`)

**Heatmap / bar chart showing feature adoption:**
- Post Generation (count of `generated_posts`)
- Scheduling (count of `scheduled_posts`)
- Templates (count of `templates`)
- Carousels (count of `carousel_templates`)
- Swipe/Discovery (count of `swipe_preferences`)
- Research Sessions (count of `research_sessions`)
- Compose Conversations (count of `compose_conversations`)
- Writing Style Analysis (count of `writing_style_profiles`)

**Per-user feature matrix:** Table showing which users use which features (checkmark grid)

### Analytics — PostHog (`/dashboard/analytics/posthog`)

**Top section:** Custom metric cards pulled via PostHog API
- DAU / WAU / MAU
- Top pages by views
- Avg session duration
- Feature adoption rates

**Bottom section:** Embedded PostHog shared dashboard via iframe
- Requires a PostHog shared dashboard URL configured in env vars (`POSTHOG_DASHBOARD_URL`)

### System — Background Jobs (`/dashboard/system/jobs`)

**Summary cards:** Running, Completed (24h), Failed (24h), Total

**Tables (tabbed):**
- **Company Analysis Jobs** — from `company_context`: company_name, status, user, started_at, error_message
- **Research Sessions** — from `research_sessions`: topics, status, posts_discovered, user, error
- **Suggestion Generation** — from `suggestion_generation_runs`: status, requested, generated, user, error

**Filters:** Status (running/completed/failed), date range

### System — Prompts Management (`/dashboard/system/prompts`)

**Table:** Name, Type, Version, Active (badge), Default (badge), Last Updated
**Actions:** View content, edit content, view version history, toggle active/default
**Detail view:** Full prompt content, variable list, usage stats from `prompt_usage_logs`, test results from `prompt_test_results`

### System — Feature Flags (`/dashboard/system/flags`)

**Note:** No existing feature flag system. This page will:
1. Create a `feature_flags` table: `id`, `name`, `description`, `enabled` (boolean), `user_overrides` (jsonb — user_id → boolean), `created_at`, `updated_at`
2. UI: Toggle switches for global flags, per-user override management
3. The main app would need to check these flags — that integration is out of scope for this spec but the admin UI will be ready

### Settings (`/dashboard/settings`)

- Change admin password
- View current admin session info
- Configure PostHog dashboard URL
- Configure OpenRouter API key for usage queries

## Tech Stack

| Package | Purpose |
|---------|---------|
| `bcryptjs` | Password hashing |
| `jose` | JWT creation/verification |
| `@supabase/supabase-js` | Database access (service role) |
| `recharts` | Charts (already installed) |
| `@tanstack/react-table` | Tables (already installed) |
| shadcn/ui | UI components (already installed) |

## File Structure

```
app/
├── login/
│   └── page.tsx
├── dashboard/
│   ├── layout.tsx (sidebar + auth check)
│   ├── page.tsx (overview)
│   ├── users/
│   │   ├── page.tsx (all users table)
│   │   ├── [id]/page.tsx (user detail)
│   │   └── onboarding/page.tsx (funnel)
│   ├── content/
│   │   ├── generated/page.tsx
│   │   ├── scheduled/page.tsx
│   │   ├── templates/page.tsx
│   │   └── moderation/page.tsx
│   ├── analytics/
│   │   ├── tokens/page.tsx
│   │   ├── features/page.tsx
│   │   └── posthog/page.tsx
│   ├── system/
│   │   ├── jobs/page.tsx
│   │   ├── prompts/page.tsx
│   │   └── flags/page.tsx
│   └── settings/
│       └── page.tsx
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   └── logout/route.ts
│   └── admin/
│       ├── users/
│       │   ├── [id]/route.ts (suspend/delete)
│       │   └── route.ts (list with filters)
│       ├── content/
│       │   └── [id]/route.ts (delete)
│       ├── prompts/
│       │   └── [id]/route.ts (update)
│       └── flags/
│           └── route.ts (CRUD)
lib/
├── supabase/
│   ├── client.ts (service role client)
│   └── queries/ (reusable query functions per domain)
├── auth.ts (JWT helpers, middleware utils)
└── posthog.ts (PostHog API client)
```

## New Database Objects

### `admin_users` table
```sql
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);
```

### `feature_flags` table
```sql
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  enabled boolean DEFAULT false,
  user_overrides jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## UI Patterns

- **Pagination:** All tables use offset-based pagination with configurable page size (default 20, options: 10/20/50). Server-side pagination via Supabase `.range()`.
- **Loading states:** Skeleton loaders for metric cards and charts. Table skeleton rows while data loads.
- **Empty states:** Friendly message + icon when no data exists for a table or chart.
- **Error handling:** Toast notification (Sonner) for failed mutations. Inline error message for failed data fetches with retry button.
- **Confirmation:** Destructive actions (delete user, delete content) require a confirmation dialog with the item name typed to confirm.

## Out of Scope

- Revenue/payment tracking (no payment system yet)
- Email notifications from admin panel
- Formal audit log table (console logging covers the basics)
- Multi-admin roles/permissions (solo founder)
- Real-time WebSocket updates (polling/refresh is fine)
- Mobile-responsive admin layout (desktop-only is acceptable)
