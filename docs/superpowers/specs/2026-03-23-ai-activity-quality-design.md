# AI Activity Viewer + Content Quality Scoring — Design Spec

## Overview

Add an AI Activity page to the admin panel that shows all user AI interactions (generation requests, compose conversations, generated output) and a content quality scoring system for generated posts.

## Data Sources

### prompt_usage_logs (24 records)
Tracks every AI API call with: user_id, prompt_type, feature (compose/remix/carousel/playground), model, input_tokens, output_tokens, total_tokens, response_time_ms, success, metadata (JSON with tone, topic, length, etc.), created_at.

### compose_conversations (10 records)
Stores chat-based generation sessions: user_id, mode (series/advanced), title, messages (JSONB array of {id, role, parts[{text, type}]}), tone, is_active, created_at.

### generated_posts (137 records)
All saved post outputs: user_id, content, post_type, hook, cta, word_count, source (compose/carousel/swipe/discover/research), status, created_at.

### profiles
For user name resolution via join.

## Part 1: AI Activity Page

### Route: `/dashboard/content/ai-activity`

### Sidebar
Add to Content nav group in `components/app-sidebar.tsx`:
```
{ title: "AI Activity", url: "/dashboard/content/ai-activity", icon: BrainCircuitIcon }
```

### Tab 1: Generation Requests
Server component querying `prompt_usage_logs` joined with `profiles`.

**Table columns:**
| Column | Source |
|--------|--------|
| User | profiles.full_name or email |
| Feature | prompt_usage_logs.feature |
| Model | prompt_usage_logs.model (show short name) |
| Prompt Type | prompt_usage_logs.prompt_type |
| Topic/Input | metadata.topic or metadata.postType or metadata.tone |
| Tokens | total_tokens |
| Response Time | response_time_ms (formatted as "2.4s") |
| Success | Badge (green/red) |
| Date | created_at |

**Expandable row:** Render the full `metadata` JSON as a styled key-value list.

### Tab 2: Compose Conversations
Server component querying `compose_conversations` joined with `profiles`.

**Table columns:**
| Column | Source |
|--------|--------|
| User | profiles.full_name or email |
| Title | compose_conversations.title (truncated) |
| Mode | Badge: "series" or "advanced" |
| Tone | compose_conversations.tone |
| Messages | jsonb_array_length(messages) |
| Active | Badge (green if active) |
| Date | created_at |

**Expandable row:** Render the `messages` JSONB array as a chat thread:
- Assistant messages: left-aligned, muted background
- User messages: right-aligned, primary background
- Each message shows the `parts[0].text` content

### Tab 3: Generated Output
Server component querying `generated_posts` joined with `profiles`.

**Table columns:**
| Column | Source |
|--------|--------|
| User | profiles.full_name or email |
| Content | Truncated to 100 chars |
| Type | post_type badge |
| Source | source badge (compose/carousel/swipe/etc) |
| Words | word_count |
| Quality | Heuristic score badge (Red/Yellow/Green) |
| Date | created_at |

**Expandable row:** Full post content + quality score breakdown.

## Part 2: Content Quality Scoring

### Heuristic Scoring Function

Create `lib/quality-score.ts` — pure function, no DB calls:

```typescript
interface QualityScore {
  total: number           // 0-100
  breakdown: {
    wordCount: number     // 0-25
    hookQuality: number   // 0-20
    hasCta: number        // 0-15
    formatting: number    // 0-15
    hashtags: number      // 0-10
    lengthFit: number     // 0-15
  }
  grade: "low" | "medium" | "high"  // Red/Yellow/Green
}

function scoreContent(content: string): QualityScore
```

**Scoring rules:**
- **Word count (0-25):** <50 words = 0, 50-149 = 10, 150-400 = 25, 401-600 = 15, >600 = 5
- **Hook quality (0-20):** First line exists and <80 chars = 10, contains ? or number = +5, starts with capital = +5
- **Has CTA (0-15):** Last paragraph contains question mark = 10, contains imperative verb (follow, share, comment, check, try, visit) = +5
- **Formatting (0-15):** Has 3+ line breaks = 10, has short paragraphs (avg <3 sentences) = +5
- **Hashtags (0-10):** 0 = 0, 1-2 = 5, 3-5 = 10, 6+ = 3
- **Length fit (0-15):** <30 chars = 0, 30-200 chars = 5, 200-3000 chars = 15, >3000 = 8

**Grade:** 0-40 = "low" (red), 41-70 = "medium" (yellow), 71-100 = "high" (green)

### AI Scoring (On-Demand)

**API Route:** `POST /api/admin/content/analyze`

Request body: `{ content: string, postType?: string }`

Calls OpenRouter with a quality analysis prompt. Returns:
- Engagement prediction (1-10)
- Readability score (1-10)
- Strengths (bullet points)
- Suggestions for improvement (bullet points)

**UI:** "Analyze with AI" button per post in the Generated Output tab. Results shown in a Sheet/Drawer panel.

### Quality Column on Existing Generated Posts Page

Add the heuristic quality score badge to `app/dashboard/content/generated/page.tsx` as an additional column.

## Files

### Create:
- `app/dashboard/content/ai-activity/page.tsx` — Main page with 3 tabs (server component)
- `lib/quality-score.ts` — Heuristic scoring function
- `app/api/admin/content/analyze/route.ts` — AI quality analysis endpoint

### Modify:
- `components/app-sidebar.tsx` — Add AI Activity nav item
- `app/dashboard/content/generated/page.tsx` — Add Quality column

## Out of Scope
- Saving quality scores to database (computed on the fly)
- Batch AI analysis of all posts
- Quality trend charts over time
- Modifying the main ChainLinked app's AI routes
