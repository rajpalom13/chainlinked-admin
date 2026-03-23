# AI Performance Dashboard + PostHog Events + Session Replay Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI Performance page in the admin panel showing prompt stats, model comparison, cost analytics, and quality distribution — plus add server-side PostHog AI tracking events to the main ChainLinked app with session replay enabled.

**Architecture:** Admin panel queries `prompt_usage_logs` joined with `system_prompts` for human-readable prompt names. Main app gets `posthog-node` for server-side event capture in AI API routes. Session replay is already enabled in the PostHog provider code — just needs the API key (already configured).

**Tech Stack:** Next.js 16, Supabase, Recharts 3, posthog-node, posthog-js

**Spec:** `docs/superpowers/specs/2026-03-24-ai-performance-design.md`

**Two projects:**
- Admin: `/Volumes/Crucial X9/AgiNotReady/chainlinked-admin`
- Main app: `/Volumes/Crucial X9/AgiNotReady/ChainLinked`

---

## File Structure

```
ADMIN PANEL:
app/dashboard/analytics/ai-performance/
  └── page.tsx                    — AI Performance page (server component)
components/app-sidebar.tsx         — MODIFY: add AI Performance nav item
app/dashboard/analytics/posthog/
  └── page.tsx                    — MODIFY: enhance with session replay section

MAIN CHAINLINKED APP:
lib/posthog-server.ts             — CREATE: server-side PostHog client
app/api/ai/generate/route.ts      — MODIFY: add PostHog events
app/api/ai/remix/route.ts         — MODIFY: add PostHog events
app/api/ai/carousel/generate/route.ts — MODIFY: add PostHog events
app/api/ai/compose-chat/route.ts  — MODIFY: add PostHog events
```

---

## Chunk 1: AI Performance Page (Admin Panel)

### Task 1: Add AI Performance to sidebar

**Files:**
- Modify: `/Volumes/Crucial X9/AgiNotReady/chainlinked-admin/components/app-sidebar.tsx`

- [ ] **Step 1: Read the sidebar, add nav item**

Add `BrainIcon` to lucide-react imports (or `ZapIcon`). In the Analytics nav group, add BEFORE "Token Usage":

```typescript
{ title: "AI Performance", url: "/dashboard/analytics/ai-performance", icon: ZapIcon },
```

- [ ] **Step 2: Commit**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/chainlinked-admin"
git add components/app-sidebar.tsx
git commit -m "feat: add AI Performance to sidebar"
```

---

### Task 2: Build AI Performance page

**Files:**
- Create: `/Volumes/Crucial X9/AgiNotReady/chainlinked-admin/app/dashboard/analytics/ai-performance/page.tsx`

This is a SERVER component. It queries:
1. `system_prompts` — all 18 prompts with their type and name
2. `prompt_usage_logs` — all usage logs with input_tokens, output_tokens, model, prompt_type, response_time_ms, success, feature, user_id, created_at
3. `generated_posts` — for quality score distribution
4. `profiles` — for user name resolution

Then computes and displays 4 sections:

**Section 1: Prompt Performance Table**

Join system_prompts.type with prompt_usage_logs.prompt_type. For each prompt, compute: calls count, avg input tokens, avg output tokens, avg response time, avg cost per call (using real OpenRouter pricing), success rate.

Use the same pricing function:
```typescript
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "openai/gpt-4.1": { input: 0.000002, output: 0.000008 },
  "openai/gpt-4.1-2025-04-14": { input: 0.000002, output: 0.000008 },
  "openai/gpt-4o": { input: 0.0000025, output: 0.00001 },
}
```

Show ALL 18 prompts even if they have 0 calls (grayed out row with "No usage" text). Group by category: Remix prompts, Post Type prompts, Carousel prompts, Foundation.

**Section 2: Model Comparison Cards**

For each unique model in the logs, show a Card with:
- Model name (short: strip "openai/" prefix)
- Total calls, avg response time, avg tokens, total cost, cost per call
- Which features use this model (badges)

Use a grid layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

**Section 3: Cost Analytics**

- Total spend MetricCard
- Cost by prompt type: horizontal bar list (same pattern as feature usage page)
- Cost by user: list with profile names

**Section 4: Output Quality Distribution**

Query `generated_posts`, compute quality scores using `scoreContent()` from `@/lib/quality-score`, then:
- Count: Low (0-40), Medium (41-70), High (71-100)
- Show as 3 MetricCards with counts and percentages
- Average quality by source (compose, carousel, swipe, etc)

The full page should use the standard layout:
```tsx
<div className="space-y-8 px-4 lg:px-6">
  <div>
    <h1 className="text-2xl font-semibold">AI Performance</h1>
    <p className="text-sm text-muted-foreground">Prompt effectiveness, model comparison, and output quality</p>
  </div>
  {/* sections */}
</div>
```

Use Card, CardHeader, CardTitle, CardContent for each section.
Use Table components for the prompt performance table.
Use Badge for prompt types and model names.
Use MetricCard for summary numbers.

- [ ] **Step 1: Create the page file with all 4 sections**

- [ ] **Step 2: Verify build**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/chainlinked-admin" && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/analytics/ai-performance/
git commit -m "feat: add AI Performance page with prompt stats, model comparison, cost analytics, quality distribution"
```

---

### Task 3: Enhance PostHog page with session replay section

**Files:**
- Modify: `/Volumes/Crucial X9/AgiNotReady/chainlinked-admin/app/dashboard/analytics/posthog/page.tsx`

- [ ] **Step 1: Read the file, add session replay section**

Below the existing iframe/empty-state, add a new Card:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Session Replays</CardTitle>
    <CardDescription>Watch user sessions on the ChainLinked platform</CardDescription>
  </CardHeader>
  <CardContent className="space-y-3 text-sm text-muted-foreground">
    <p>Session recording is <Badge variant="default">Enabled</Badge> on the ChainLinked platform.</p>
    <p>View replays in your PostHog project:</p>
    <ol className="list-decimal list-inside space-y-1">
      <li>Go to PostHog → Session Replays</li>
      <li>Filter by user, page, or event</li>
      <li>Watch full user sessions with clicks, scrolls, and console logs</li>
    </ol>
    <p className="text-xs">Recording includes: DOM replay, network requests (headers redacted), console logs, canvas capture (carousel editor).</p>
  </CardContent>
</Card>
```

Also add a "Heatmaps" Card:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Heatmaps & Toolbar</CardTitle>
    <CardDescription>See where users click on any page</CardDescription>
  </CardHeader>
  <CardContent className="space-y-3 text-sm text-muted-foreground">
    <p>PostHog toolbar is available on the ChainLinked platform:</p>
    <ol className="list-decimal list-inside space-y-1">
      <li>Go to PostHog → Toolbar → Launch</li>
      <li>Enter your site URL (chainlinked.ai or localhost:3000)</li>
      <li>The toolbar overlay shows heatmaps, click counts, and rage clicks</li>
    </ol>
  </CardContent>
</Card>
```

- [ ] **Step 2: Commit**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/chainlinked-admin"
git add app/dashboard/analytics/posthog/page.tsx
git commit -m "feat: add session replay and heatmap sections to PostHog page"
```

---

## Chunk 2: PostHog Server-Side Tracking in Main ChainLinked App

### Task 4: Install posthog-node in main app

**Files:**
- Modify: `/Volumes/Crucial X9/AgiNotReady/ChainLinked/package.json`

- [ ] **Step 1: Install**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/ChainLinked"
npm install posthog-node
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add posthog-node for server-side analytics"
```

---

### Task 5: Create server-side PostHog client

**Files:**
- Create: `/Volumes/Crucial X9/AgiNotReady/ChainLinked/lib/posthog-server.ts`

- [ ] **Step 1: Create the client**

```typescript
// lib/posthog-server.ts
import { PostHog } from "posthog-node"

let posthogClient: PostHog | null = null

export function getPostHogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (!key || !host) return null

  if (!posthogClient) {
    posthogClient = new PostHog(key, {
      host,
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return posthogClient
}

export function trackAIEvent(
  userId: string,
  event: "ai_generation_started" | "ai_generation_completed" | "ai_generation_failed",
  properties: Record<string, unknown>
) {
  const client = getPostHogServer()
  if (!client) return

  client.capture({
    distinctId: userId,
    event,
    properties: {
      ...properties,
      app: "chainlinked",
      source: "server",
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/ChainLinked"
git add lib/posthog-server.ts
git commit -m "feat: add server-side PostHog client for AI event tracking"
```

---

### Task 6: Add PostHog tracking to AI generate route

**Files:**
- Modify: `/Volumes/Crucial X9/AgiNotReady/ChainLinked/app/api/ai/generate/route.ts`

- [ ] **Step 1: Read the file, find where the AI call is made and returns**

Add import at top:
```typescript
import { trackAIEvent } from "@/lib/posthog-server"
```

Find the section where the OpenRouter/OpenAI call is made. Add tracking:

Before the AI call:
```typescript
trackAIEvent(userId, "ai_generation_started", {
  feature: "generate",
  prompt_type: promptType,
  tone,
  length: lengthParam,
  model: modelName,
})
```

After successful AI call (where the response is returned):
```typescript
trackAIEvent(userId, "ai_generation_completed", {
  feature: "generate",
  prompt_type: promptType,
  model: modelName,
  input_tokens: response.promptTokens,
  output_tokens: response.completionTokens,
  total_tokens: response.totalTokens,
  response_time_ms: Date.now() - startTime,
})
```

In the catch/error block:
```typescript
trackAIEvent(userId, "ai_generation_failed", {
  feature: "generate",
  error: error instanceof Error ? error.message : "Unknown error",
  model: modelName,
})
```

Note: Be careful to read the actual variable names in the file — they may differ from the plan. The key is to find where userId, the model call, and the response/error handling happen.

If `userId` is not directly available, check how other parts of the route get the user — likely from `supabase.auth.getUser()` or similar.

- [ ] **Step 2: Commit**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/ChainLinked"
git add app/api/ai/generate/route.ts
git commit -m "feat: add PostHog tracking to AI generate route"
```

---

### Task 7: Add PostHog tracking to AI remix route

**Files:**
- Modify: `/Volumes/Crucial X9/AgiNotReady/ChainLinked/app/api/ai/remix/route.ts`

Same pattern as Task 6 but with `feature: "remix"`. Read the file first to understand the variable names and flow.

- [ ] **Step 1: Add tracking events (started, completed, failed)**
- [ ] **Step 2: Commit**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/ChainLinked"
git add app/api/ai/remix/route.ts
git commit -m "feat: add PostHog tracking to AI remix route"
```

---

### Task 8: Add PostHog tracking to carousel generate route

**Files:**
- Modify: `/Volumes/Crucial X9/AgiNotReady/ChainLinked/app/api/ai/carousel/generate/route.ts`

Same pattern with `feature: "carousel"`.

- [ ] **Step 1: Add tracking events**
- [ ] **Step 2: Commit**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/ChainLinked"
git add app/api/ai/carousel/generate/route.ts
git commit -m "feat: add PostHog tracking to carousel generate route"
```

---

### Task 9: Add PostHog tracking to compose-chat route

**Files:**
- Modify: `/Volumes/Crucial X9/AgiNotReady/ChainLinked/app/api/ai/compose-chat/route.ts`

This route uses Vercel AI SDK streaming — tracking is different. Add `ai_generation_started` at the beginning and `ai_generation_completed` after the stream is created (not after it ends, since it's streaming).

- [ ] **Step 1: Add tracking events**
- [ ] **Step 2: Commit**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/ChainLinked"
git add app/api/ai/compose-chat/route.ts
git commit -m "feat: add PostHog tracking to compose-chat route"
```

---

## Chunk 3: Verification

### Task 10: Build verification for both projects

- [ ] **Step 1: Build admin panel**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/chainlinked-admin" && npm run build
```

- [ ] **Step 2: Build main app**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/ChainLinked" && npm run build
```

Fix any TypeScript errors.

- [ ] **Step 3: Visual check**

Start admin on port 3001, check:
1. `/dashboard/analytics/ai-performance` — shows prompt table, model cards, cost, quality
2. `/dashboard/analytics/posthog` — shows session replay and heatmap sections

- [ ] **Step 4: Commit any fixes**

```bash
git add -A && git commit -m "fix: resolve build issues"
```
