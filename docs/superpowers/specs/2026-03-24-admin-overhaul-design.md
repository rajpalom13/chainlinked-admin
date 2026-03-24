# ChainLinked Admin Panel Overhaul + Sentry Integration

**Date:** 2026-03-24
**Status:** Approved

## 1. Sentry Integration

### ChainLinked Platform (`/ChainLinked`)
- Install `@sentry/nextjs` via wizard command
- Auth Token: `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`
- Org: `chainlinked`
- Project: `javascript-nextjs`
- Configure: client, server, edge configs + instrumentation.ts
- Capture: unhandled exceptions, API errors, AI failures, Inngest job failures
- Tag with user_id, feature, model

### Admin Panel (`/chainlinked-admin`)
- New Sentry Errors page under System section
- Uses Sentry API to show recent issues, error counts, affected users
- Settings page shows Sentry config status

## 2. Database Migration

### Add columns to `generated_posts`:
- `conversation_id` UUID FK → compose_conversations.id (nullable)
- `prompt_snapshot` JSONB (system_prompt, user_messages, assistant_response)
- `prompt_tokens` integer
- `completion_tokens` integer
- `total_tokens` integer
- `model` text
- `estimated_cost` numeric

### New table `sidebar_sections`:
- `id` UUID PK
- `key` TEXT UNIQUE NOT NULL
- `label` TEXT NOT NULL
- `enabled` BOOLEAN DEFAULT true
- `sort_order` INTEGER DEFAULT 0
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

Seed: dashboard, analytics, team_activity, saved_drafts, inspiration, create_carousel, template_library

### Update ChainLinked generation routes to populate new fields

## 3. Admin Panel Page Changes

### Generated Posts
- Fix sidebar padding/spacing
- Show conversation thread (prompt → response)
- Show token usage, cost, model, quality breakdown

### Scheduled Posts
- Redesign to card-based layout
- Show content preview, status, scheduled time, linked conversation

### Templates
- Show AI generation prompt if ai_generated
- Clean up table UI

### AI Activity
- Display estimated_cost from prompt_usage_logs
- Link conversations to generated posts via conversation_id
- Click conversation → see linked post

### AI Performance
- Use actual estimated_cost from logs
- Add Recharts: cost over time, tokens over time, model comparison
- Heatmap-style per-user feature matrix
- New Cost Dashboard page with daily/weekly/monthly breakdowns

### Feature Visibility → Sidebar Control
- Replace feature flags page with sidebar_sections CRUD
- Drag-and-drop toggle interface for enabling/disabling/reordering
- ChainLinked sidebar reads from this table

## 4. Removals
- Moderation page
- Prompts page
- Feature flags page (replaced by Sidebar Control)
