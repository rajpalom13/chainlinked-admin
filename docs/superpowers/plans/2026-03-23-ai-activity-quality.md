# AI Activity Viewer + Content Quality Scoring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI Activity page showing all user AI interactions (generation requests, compose chats, generated output) with content quality scoring.

**Architecture:** Server components query Supabase tables (`prompt_usage_logs`, `compose_conversations`, `generated_posts`) with profile joins. Quality scoring is a pure function computed on the fly — no DB changes. AI analysis uses an admin API route calling OpenRouter.

**Tech Stack:** Next.js 16, Supabase (service role), shadcn/ui Tabs/Table/Badge/Sheet, OpenRouter API

**Spec:** `docs/superpowers/specs/2026-03-23-ai-activity-quality-design.md`

---

## File Structure

```
lib/
└── quality-score.ts                          — Pure heuristic scoring function (0-100)

app/
├── dashboard/content/ai-activity/
│   └── page.tsx                              — AI Activity page with 3 tabs (server component)
└── api/admin/content/analyze/
    └── route.ts                              — POST: AI quality analysis via OpenRouter

components/
└── app-sidebar.tsx                           — MODIFY: add AI Activity nav item
```

---

## Chunk 1: Quality Scoring + AI Activity Page

### Task 1: Create heuristic quality scoring function

**Files:**
- Create: `lib/quality-score.ts`

- [ ] **Step 1: Create the scoring function**

```typescript
// lib/quality-score.ts

interface QualityBreakdown {
  wordCount: number     // 0-25
  hookQuality: number   // 0-20
  hasCta: number        // 0-15
  formatting: number    // 0-15
  hashtags: number      // 0-10
  lengthFit: number     // 0-15
}

export interface QualityScore {
  total: number
  breakdown: QualityBreakdown
  grade: "low" | "medium" | "high"
}

export function scoreContent(content: string): QualityScore {
  if (!content || content.trim().length === 0) {
    return {
      total: 0,
      breakdown: { wordCount: 0, hookQuality: 0, hasCta: 0, formatting: 0, hashtags: 0, lengthFit: 0 },
      grade: "low",
    }
  }

  const words = content.trim().split(/\s+/)
  const wordCount = words.length
  const lines = content.split("\n").filter((l) => l.trim().length > 0)
  const firstLine = lines[0]?.trim() || ""
  const lastParagraph = lines.slice(-2).join(" ").toLowerCase()
  const hashtagCount = (content.match(/#\w+/g) || []).length
  const charCount = content.length

  // Word count score (0-25)
  let wordScore = 0
  if (wordCount < 50) wordScore = 0
  else if (wordCount < 150) wordScore = 10
  else if (wordCount <= 400) wordScore = 25
  else if (wordCount <= 600) wordScore = 15
  else wordScore = 5

  // Hook quality (0-20)
  let hookScore = 0
  if (firstLine.length > 0 && firstLine.length < 80) hookScore += 10
  if (/[?]/.test(firstLine) || /\d/.test(firstLine)) hookScore += 5
  if (/^[A-Z]/.test(firstLine)) hookScore += 5

  // CTA detection (0-15)
  let ctaScore = 0
  if (/[?]/.test(lastParagraph)) ctaScore += 10
  if (/\b(follow|share|comment|check|try|visit|click|subscribe|join|dm|save|repost)\b/i.test(lastParagraph)) ctaScore += 5

  // Formatting (0-15)
  let formatScore = 0
  const lineBreaks = content.split("\n").length - 1
  if (lineBreaks >= 3) formatScore += 10
  const avgSentencesPerPara = lines.length > 0 ? wordCount / lines.length : wordCount
  if (avgSentencesPerPara < 40) formatScore += 5

  // Hashtags (0-10)
  let hashtagScore = 0
  if (hashtagCount === 0) hashtagScore = 0
  else if (hashtagCount <= 2) hashtagScore = 5
  else if (hashtagCount <= 5) hashtagScore = 10
  else hashtagScore = 3

  // Length fit (0-15)
  let lengthScore = 0
  if (charCount < 30) lengthScore = 0
  else if (charCount < 200) lengthScore = 5
  else if (charCount <= 3000) lengthScore = 15
  else lengthScore = 8

  const total = wordScore + hookScore + ctaScore + formatScore + hashtagScore + lengthScore
  const grade = total <= 40 ? "low" : total <= 70 ? "medium" : "high"

  return {
    total,
    breakdown: {
      wordCount: wordScore,
      hookQuality: hookScore,
      hasCta: ctaScore,
      formatting: formatScore,
      hashtags: hashtagScore,
      lengthFit: lengthScore,
    },
    grade,
  }
}

export function gradeColor(grade: "low" | "medium" | "high"): string {
  switch (grade) {
    case "low": return "destructive"
    case "medium": return "secondary"
    case "high": return "default"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/quality-score.ts
git commit -m "feat: add heuristic content quality scoring function"
```

---

### Task 2: Add AI Activity nav item to sidebar

**Files:**
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 1: Read the sidebar file, add BrainCircuitIcon import and nav item**

Add `BrainCircuitIcon` to the lucide-react import.

In the `navGroups` array, find the "Content" group and add after the Moderation item:

```typescript
{ title: "AI Activity", url: "/dashboard/content/ai-activity", icon: BrainCircuitIcon },
```

- [ ] **Step 2: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat: add AI Activity to sidebar navigation"
```

---

### Task 3: Create the AI Activity page

**Files:**
- Create: `app/dashboard/content/ai-activity/page.tsx`

This is the main page with 3 tabs. It's a SERVER component.

- [ ] **Step 1: Create the page**

```tsx
// app/dashboard/content/ai-activity/page.tsx
import { supabaseAdmin } from "@/lib/supabase/client"
import { scoreContent, gradeColor } from "@/lib/quality-score"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/empty-state"

// ---- Data fetchers ----

async function getGenerationRequests() {
  const { data } = await supabaseAdmin
    .from("prompt_usage_logs")
    .select("id, user_id, prompt_type, feature, model, input_tokens, output_tokens, total_tokens, response_time_ms, success, error_message, metadata, created_at, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100)
  return data || []
}

async function getComposeConversations() {
  const { data } = await supabaseAdmin
    .from("compose_conversations")
    .select("id, user_id, mode, title, messages, tone, is_active, created_at, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(50)
  return data || []
}

async function getGeneratedOutput() {
  const { data } = await supabaseAdmin
    .from("generated_posts")
    .select("id, user_id, content, post_type, source, word_count, hook, cta, status, created_at, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100)
  return data || []
}

// ---- Helper ----

function userName(row: { profiles: unknown }): string {
  const p = row.profiles as { full_name: string; email: string } | null
  return p?.full_name || p?.email || "—"
}

function shortModel(model: string): string {
  return model?.replace("openai/", "").replace("-2025-04-14", "") || "—"
}

function formatMs(ms: number | null): string {
  if (!ms) return "—"
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

function metadataSummary(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "—"
  const parts: string[] = []
  if (metadata.topic) parts.push(String(metadata.topic).slice(0, 60))
  else if (metadata.postType) parts.push(String(metadata.postType))
  if (metadata.tone) parts.push(String(metadata.tone))
  if (metadata.length) parts.push(String(metadata.length))
  return parts.join(" · ") || "—"
}

// ---- Page ----

export default async function AIActivityPage() {
  const [requests, conversations, output] = await Promise.all([
    getGenerationRequests(),
    getComposeConversations(),
    getGeneratedOutput(),
  ])

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold">AI Activity</h1>
        <p className="text-sm text-muted-foreground">All AI generation requests, conversations, and output across users</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="requests">
            <TabsList>
              <TabsTrigger value="requests">Generation Requests ({requests.length})</TabsTrigger>
              <TabsTrigger value="conversations">Compose Chats ({conversations.length})</TabsTrigger>
              <TabsTrigger value="output">Generated Output ({output.length})</TabsTrigger>
            </TabsList>

            {/* Tab 1: Generation Requests */}
            <TabsContent value="requests">
              {requests.length === 0 ? (
                <EmptyState title="No AI requests" description="No AI generation requests have been made yet." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Feature</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Input</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{userName(r)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.feature}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{shortModel(r.model)}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {metadataSummary(r.metadata as Record<string, unknown>)}
                        </TableCell>
                        <TableCell>{r.total_tokens?.toLocaleString()}</TableCell>
                        <TableCell>{formatMs(r.response_time_ms)}</TableCell>
                        <TableCell>
                          <Badge variant={r.success ? "default" : "destructive"}>
                            {r.success ? "OK" : "Fail"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Tab 2: Compose Conversations */}
            <TabsContent value="conversations">
              {conversations.length === 0 ? (
                <EmptyState title="No conversations" description="No compose conversations yet." />
              ) : (
                <div className="space-y-4">
                  {conversations.map((c) => {
                    const messages = (c.messages as Array<{ id: string; role: string; parts: Array<{ text: string; type: string }> }>) || []
                    return (
                      <Card key={c.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{c.title || "Untitled"}</CardTitle>
                              <CardDescription>
                                {userName(c)} · {c.mode} · {c.tone} · {messages.length} messages
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={c.is_active ? "default" : "secondary"}>
                                {c.is_active ? "Active" : "Ended"}
                              </Badge>
                              <Badge variant="outline">{c.mode}</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 rounded-lg border p-3">
                            {messages.map((msg, i) => (
                              <div
                                key={msg.id || i}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                  msg.role === "assistant"
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-primary/10 text-foreground ml-8"
                                }`}
                              >
                                <span className="text-xs font-medium uppercase text-muted-foreground">
                                  {msg.role}
                                </span>
                                <p className="mt-1 whitespace-pre-wrap">
                                  {msg.parts?.[0]?.text || JSON.stringify(msg.parts)}
                                </p>
                              </div>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab 3: Generated Output */}
            <TabsContent value="output">
              {output.length === 0 ? (
                <EmptyState title="No generated posts" description="No posts have been generated yet." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Words</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {output.map((post) => {
                      const score = scoreContent(post.content || "")
                      return (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">{userName(post)}</TableCell>
                          <TableCell className="max-w-sm">
                            <p className="line-clamp-2 text-sm">{post.content?.slice(0, 120)}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{post.post_type || "—"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{post.source || "—"}</Badge>
                          </TableCell>
                          <TableCell>{post.word_count || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={gradeColor(score.grade) as "default" | "secondary" | "destructive"}>
                              {score.total}/100
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{new Date(post.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/content/ai-activity/page.tsx
git commit -m "feat: add AI Activity page with generation requests, conversations, and output tabs"
```

---

### Task 4: Create AI quality analysis API route

**Files:**
- Create: `app/api/admin/content/analyze/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// app/api/admin/content/analyze/route.ts
import { NextResponse, type NextRequest } from "next/server"
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const admin = await verifySessionToken(token)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })
  }

  const { content, postType } = await request.json()
  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chainlinked.ai",
        "X-Title": "ChainLinked Admin",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1",
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You are a LinkedIn content quality analyst. Analyze the given LinkedIn post and return a JSON object with:
- engagementScore (1-10): predicted engagement potential
- readabilityScore (1-10): how easy it is to read
- strengths (array of 2-3 short bullet points)
- suggestions (array of 2-3 improvement suggestions)
- summary (one sentence overall assessment)

Return ONLY valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: `Analyze this LinkedIn post${postType ? ` (type: ${postType})` : ""}:\n\n${content}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: "AI analysis failed" }, { status: 502 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ""

    try {
      const analysis = JSON.parse(text)
      return NextResponse.json(analysis)
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 502 })
    }
  } catch {
    return NextResponse.json({ error: "Failed to reach OpenRouter" }, { status: 502 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/content/analyze/route.ts
git commit -m "feat: add AI content quality analysis endpoint"
```

---

### Task 5: Add quality score column to existing Generated Posts page

**Files:**
- Modify: `app/dashboard/content/generated/page.tsx`

- [ ] **Step 1: Read the existing file, then add quality scoring**

Add imports at top:
```typescript
import { scoreContent, gradeColor } from "@/lib/quality-score"
```

Add a "Quality" column to the table header (after the "Words" column):
```tsx
<TableHead>Quality</TableHead>
```

In each table row, after the word_count cell, add:
```tsx
<TableCell>
  {(() => {
    const score = scoreContent(post.content || "")
    return (
      <Badge variant={gradeColor(score.grade) as "default" | "secondary" | "destructive"}>
        {score.total}/100
      </Badge>
    )
  })()}
</TableCell>
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/content/generated/page.tsx
git commit -m "feat: add quality score column to generated posts table"
```

---

## Chunk 2: Build Verification

### Task 6: Verify build and test

- [ ] **Step 1: Run build**

```bash
cd "/Volumes/Crucial X9/AgiNotReady/chainlinked-admin" && npm run build
```

Fix any TypeScript or import errors.

- [ ] **Step 2: Visual check**

Start dev server (`PORT=3001 npm run dev`) and verify:
1. Sidebar shows "AI Activity" under Content
2. `/dashboard/content/ai-activity` loads with 3 tabs
3. Generation Requests tab shows 24 rows with metadata
4. Compose Chats tab shows 10 conversation cards with message threads
5. Generated Output tab shows 137 posts with quality scores
6. `/dashboard/content/generated` shows quality score column
7. Quality scores display as colored badges (Red/Yellow/Green)

- [ ] **Step 3: Final commit if fixes needed**

```bash
git add -A && git commit -m "fix: resolve build issues for AI activity page"
```
