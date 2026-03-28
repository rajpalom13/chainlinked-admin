import { notFound } from "next/navigation"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase/client"
import { MetricCard } from "@/components/metric-card"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  UsersIcon,
  FileTextIcon,
  SendIcon,
  CoinsIcon,
  ArrowLeftIcon,
  CalendarIcon,
  Building2Icon,
} from "lucide-react"
import { TeamMembersTable } from "./team-members-table"

interface MemberData {
  id: string
  full_name: string | null
  email: string
  created_at: string
  onboarding_completed: boolean
  extension_last_active_at: string | null
  postCount: number
  totalTokens: number
}

async function getTeamDetail(id: string) {
  const [
    { data: team },
    { data: teamMembers },
  ] = await Promise.all([
    supabaseAdmin
      .from("teams")
      .select("id, name, created_at")
      .eq("id", id)
      .single(),
    supabaseAdmin
      .from("team_members")
      .select("user_id")
      .eq("team_id", id),
  ])

  if (!team) return null

  const memberIds = teamMembers?.map((tm) => tm.user_id) ?? []

  if (memberIds.length === 0) {
    return {
      team,
      members: [] as MemberData[],
      totalPosts: 0,
      publishedPosts: 0,
      totalTokens: 0,
      totalCost: 0,
      sourceEntries: [] as [string, number][],
      typeEntries: [] as [string, number][],
    }
  }

  const [
    { data: profiles },
    { data: generatedPosts },
    { count: publishedCount },
    { data: usageLogs },
  ] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, created_at, onboarding_completed, extension_last_active_at")
      .in("id", memberIds),
    supabaseAdmin
      .from("generated_posts")
      .select("user_id, source, post_type")
      .in("user_id", memberIds),
    supabaseAdmin
      .from("scheduled_posts")
      .select("*", { count: "exact", head: true })
      .in("user_id", memberIds)
      .eq("status", "posted"),
    supabaseAdmin
      .from("prompt_usage_logs")
      .select("user_id, total_tokens, estimated_cost")
      .in("user_id", memberIds),
  ])

  // Post count per user
  const postCountMap = new Map<string, number>()
  generatedPosts?.forEach((p) => {
    postCountMap.set(p.user_id, (postCountMap.get(p.user_id) ?? 0) + 1)
  })

  // Usage per user
  const usageMap = new Map<string, { tokens: number; cost: number }>()
  usageLogs?.forEach((log) => {
    const existing = usageMap.get(log.user_id) ?? { tokens: 0, cost: 0 }
    existing.tokens += log.total_tokens || 0
    existing.cost += Number(log.estimated_cost || 0)
    usageMap.set(log.user_id, existing)
  })

  const totalTokens = Array.from(usageMap.values()).reduce((sum, u) => sum + u.tokens, 0)
  const totalCost = Array.from(usageMap.values()).reduce((sum, u) => sum + u.cost, 0)
  const totalPosts = generatedPosts?.length ?? 0

  // Source & type breakdown
  const sourceBreakdown: Record<string, number> = {}
  const typeBreakdown: Record<string, number> = {}
  for (const post of generatedPosts ?? []) {
    const src = post.source || "direct"
    const type = post.post_type || "general"
    sourceBreakdown[src] = (sourceBreakdown[src] ?? 0) + 1
    typeBreakdown[type] = (typeBreakdown[type] ?? 0) + 1
  }
  const sourceEntries = Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])
  const typeEntries = Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1])

  const members: MemberData[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    created_at: profile.created_at,
    onboarding_completed: profile.onboarding_completed,
    extension_last_active_at: profile.extension_last_active_at,
    postCount: postCountMap.get(profile.id) ?? 0,
    totalTokens: usageMap.get(profile.id)?.tokens ?? 0,
  }))

  return {
    team,
    members,
    totalPosts,
    publishedPosts: publishedCount ?? 0,
    totalTokens,
    totalCost,
    sourceEntries,
    typeEntries,
  }
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getTeamDetail(id)

  if (!data) {
    notFound()
  }

  const { team, members, totalPosts, publishedPosts, totalTokens, totalCost, sourceEntries, typeEntries } = data

  return (
    <div className="flex flex-col gap-5 px-4 lg:px-6">
      {/* Back link */}
      <Link
        href="/dashboard/teams"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to Teams
      </Link>

      {/* Team Header */}
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/3 pointer-events-none" />
        <CardContent className="relative flex flex-col gap-4 pt-6 sm:flex-row sm:items-start">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/15 text-xl font-bold text-primary sm:size-18">
            <Building2Icon className="size-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold">{team.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 shrink-0" />
                <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
              </div>
              <Badge variant="secondary" className="gap-1">
                <UsersIcon className="size-3" />
                {members.length} member{members.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 @xl/main:grid-cols-4">
        <MetricCard
          title="Members"
          value={members.length}
          icon={UsersIcon}
          accent="blue"
        />
        <MetricCard
          title="Posts Generated"
          value={totalPosts}
          icon={FileTextIcon}
          accent="emerald"
        />
        <MetricCard
          title="Posts Published"
          value={publishedPosts}
          icon={SendIcon}
          accent="amber"
        />
        <MetricCard
          title="Token Usage"
          value={totalTokens.toLocaleString("en-US")}
          subtitle={`Est. cost: $${totalCost.toFixed(2)}`}
          icon={CoinsIcon}
          accent="primary"
        />
      </div>

      {/* Activity Breakdown */}
      {totalPosts > 0 && (
        <Card className="border-border/50 bg-gradient-to-br from-card via-card to-blue-500/3 overflow-hidden">
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
            <CardDescription>{totalPosts} posts across {members.length} members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* By Source */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">By Source</p>
                <div className="space-y-2.5">
                  {sourceEntries.map(([source, count]) => {
                    const pct = totalPosts > 0 ? (count / totalPosts) * 100 : 0
                    return (
                      <div key={source}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="capitalize font-medium">{source}</span>
                          <span className="text-muted-foreground tabular-nums text-xs">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              {/* By Type */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">By Post Type</p>
                <div className="space-y-2.5">
                  {typeEntries.map(([type, count]) => {
                    const pct = totalPosts > 0 ? (count / totalPosts) * 100 : 0
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="capitalize font-medium">{type}</span>
                          <span className="text-muted-foreground tabular-nums text-xs">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Table */}
      <Card className="border-border/50 bg-gradient-to-br from-card via-card to-primary/3 overflow-hidden">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>{members.length} member{members.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No members in this team.</p>
          ) : (
            <TeamMembersTable members={members} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
