import { supabaseAdmin } from "@/lib/supabase/client"
import { scoreContent, gradeColor } from "@/lib/quality-score"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BotIcon } from "lucide-react"

/* ── helpers ── */

function userName(row: { profiles: unknown }): string {
  const p = row.profiles as unknown as { full_name: string; email: string } | null
  return p?.full_name || p?.email || "Unknown"
}

function shortModel(model: string | null): string {
  if (!model) return "—"
  return model.replace(/^openai\//, "")
}

function formatMs(ms: number | null): string {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function metadataSummary(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "—"
  const m = metadata as Record<string, unknown>
  const parts: string[] = []
  if (m.topic) parts.push(String(m.topic))
  if (m.tone) parts.push(String(m.tone))
  if (m.length) parts.push(String(m.length))
  return parts.length > 0 ? parts.join(" / ") : "—"
}

/* ── page ── */

export default async function AIActivityPage() {
  const [logsRes, convsRes, postsRes] = await Promise.all([
    supabaseAdmin
      .from("prompt_usage_logs")
      .select(
        "id, prompt_type, feature, model, input_tokens, output_tokens, total_tokens, response_time_ms, success, error_message, metadata, created_at, profiles(full_name, email)"
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("compose_conversations")
      .select(
        "id, title, mode, tone, messages, is_active, created_at, profiles(full_name, email)"
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("generated_posts")
      .select(
        "id, content, post_type, source, word_count, hook, cta, status, created_at, profiles(full_name, email)"
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  const logs = logsRes.data ?? []
  const conversations = convsRes.data ?? []
  const posts = postsRes.data ?? []

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Activity</h1>
        <p className="text-sm text-muted-foreground">
          Monitor AI generation requests, compose conversations, and output quality.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>
            {logs.length} requests &middot; {conversations.length} conversations &middot; {posts.length} generated posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests">
            <TabsList>
              <TabsTrigger value="requests">Generation Requests</TabsTrigger>
              <TabsTrigger value="conversations">Compose Conversations</TabsTrigger>
              <TabsTrigger value="output">Generated Output</TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Generation Requests ── */}
            <TabsContent value="requests">
              {logs.length === 0 ? (
                <EmptyState
                  title="No generation requests"
                  description="Prompt usage logs will appear here."
                  icon={<BotIcon className="size-12" />}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Feature</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Input Summary</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{userName(log)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.feature ?? log.prompt_type ?? "—"}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {shortModel(log.model)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {metadataSummary(log.metadata)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {log.total_tokens?.toLocaleString() ?? "—"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatMs(log.response_time_ms)}
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge variant="default">OK</Badge>
                          ) : (
                            <Badge variant="destructive" title={log.error_message ?? undefined}>
                              Fail
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* ── Tab 2: Compose Conversations ── */}
            <TabsContent value="conversations">
              {conversations.length === 0 ? (
                <EmptyState
                  title="No conversations"
                  description="Compose conversations will appear here."
                  icon={<BotIcon className="size-12" />}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {conversations.map((conv) => {
                    const messages = (conv.messages ?? []) as Array<{
                      id: string
                      role: string
                      parts: Array<{ text: string; type: string }>
                    }>

                    return (
                      <Card key={conv.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {conv.title || "Untitled conversation"}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {conv.is_active && (
                                <Badge variant="default">Active</Badge>
                              )}
                              <Badge variant="secondary">{conv.mode ?? "—"}</Badge>
                            </div>
                          </div>
                          <CardDescription>
                            {userName(conv)} &middot; {conv.tone ?? "no tone"} &middot;{" "}
                            {messages.length} message{messages.length !== 1 ? "s" : ""} &middot;{" "}
                            {new Date(conv.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                            {messages.map((msg) => {
                              const text = msg.parts
                                ?.map((p) => p.text)
                                .filter(Boolean)
                                .join(" ") ?? ""
                              const isAssistant = msg.role === "assistant"

                              return (
                                <div
                                  key={msg.id}
                                  className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                                    isAssistant
                                      ? "self-start bg-muted"
                                      : "self-end bg-primary/10"
                                  }`}
                                >
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    {msg.role}
                                  </p>
                                  <p className="whitespace-pre-wrap break-words line-clamp-6">
                                    {text}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── Tab 3: Generated Output ── */}
            <TabsContent value="output">
              {posts.length === 0 ? (
                <EmptyState
                  title="No generated output"
                  description="Generated posts will appear here."
                  icon={<BotIcon className="size-12" />}
                />
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
                    {posts.map((post) => {
                      const score = scoreContent(post.content ?? "")

                      return (
                        <TableRow key={post.id}>
                          <TableCell>{userName(post)}</TableCell>
                          <TableCell className="max-w-[300px]">
                            <p className="line-clamp-2 text-sm">
                              {post.content?.slice(0, 120) ?? "—"}
                              {post.content && post.content.length > 120 ? "..." : ""}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{post.post_type ?? "—"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{post.source ?? "—"}</Badge>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {post.word_count ?? 0}
                          </TableCell>
                          <TableCell>
                            <Badge variant={gradeColor(score.grade) as "default" | "secondary" | "destructive"}>
                              {score.total} &middot; {score.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </TableCell>
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
