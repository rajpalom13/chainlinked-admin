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
import { BotIcon, ExternalLinkIcon } from "lucide-react"

/* ── helpers ── */

type NameMap = Map<string, string>

function getUserName(userId: string | null, names: NameMap): string {
  if (!userId) return "—"
  return names.get(userId) || userId.slice(0, 8)
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

function formatCost(cost: number | null | undefined): string {
  if (cost == null) return "—"
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
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
  const [logsRes, convsRes, postsRes, profilesRes, linkedPostsRes] = await Promise.all([
    supabaseAdmin
      .from("prompt_usage_logs")
      .select("id, user_id, prompt_type, feature, model, input_tokens, output_tokens, total_tokens, estimated_cost, response_time_ms, success, error_message, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("compose_conversations")
      .select("id, user_id, title, mode, tone, messages, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("generated_posts")
      .select("id, user_id, content, post_type, source, word_count, hook, cta, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, email"),
    // Fetch posts that are linked to conversations
    supabaseAdmin
      .from("generated_posts")
      .select("id, conversation_id, content")
      .not("conversation_id", "is", null),
  ])

  const logs = logsRes.data ?? []
  const conversations = convsRes.data ?? []
  const posts = postsRes.data ?? []
  const linkedPosts = linkedPostsRes.data ?? []

  // Build conversation_id -> post map
  const postsByConversation = new Map<string, { id: string; content: string | null }>()
  for (const post of linkedPosts) {
    if (post.conversation_id) {
      postsByConversation.set(post.conversation_id, { id: post.id, content: post.content })
    }
  }

  // Build user name lookup map
  const names: NameMap = new Map()
  profilesRes.data?.forEach((p) => {
    names.set(p.id, p.full_name || p.email || p.id.slice(0, 8))
  })

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
                      <TableHead>Est. Cost</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{getUserName(log.user_id, names)}</TableCell>
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
                        <TableCell className="tabular-nums font-mono text-xs">
                          {formatCost(log.estimated_cost)}
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
                <div className="flex flex-col gap-2">
                  {conversations.map((conv) => {
                    const messages = (conv.messages ?? []) as Array<{
                      id: string
                      role: string
                      parts: Array<{ text: string; type: string }>
                    }>
                    const linkedPost = postsByConversation.get(conv.id)
                    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
                    const lastText = lastMessage?.parts
                      ?.map((p) => p.text)
                      .filter(Boolean)
                      .join(" ")
                      ?.slice(0, 100) ?? ""

                    return (
                      <Card key={conv.id} className="overflow-hidden">
                        <div className="flex items-start justify-between gap-4 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">
                                {conv.title || "Untitled conversation"}
                              </span>
                              {conv.is_active && (
                                <Badge variant="default" className="text-[10px] px-1.5 py-0">Active</Badge>
                              )}
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{conv.mode ?? "—"}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{getUserName(conv.user_id, names)}</span>
                              <span>&middot;</span>
                              <span>{conv.tone ?? "no tone"}</span>
                              <span>&middot;</span>
                              <span>{messages.length} msg{messages.length !== 1 ? "s" : ""}</span>
                              <span>&middot;</span>
                              <span>{new Date(conv.created_at).toLocaleDateString()}</span>
                            </div>
                            {lastText && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                Last: {lastText}{lastText.length >= 100 ? "..." : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {linkedPost && (
                              <a
                                href={`/dashboard/content/generated?post=${linkedPost.id}`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              >
                                <ExternalLinkIcon className="size-3" />
                                View Post
                              </a>
                            )}
                          </div>
                        </div>
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
                          <TableCell>{getUserName(post.user_id, names)}</TableCell>
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
