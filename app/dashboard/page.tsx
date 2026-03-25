import { supabaseAdmin } from "@/lib/supabase/client"
import { MetricCard } from "@/components/metric-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

async function getOverviewMetrics() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const weekAgoISO = weekAgo.toISOString()
  const twoWeeksAgoISO = twoWeeksAgo.toISOString()

  const [
    { count: totalUsers },
    { count: usersLastWeek },
    { count: usersPrevWeek },
    { count: postsGenerated },
    { count: postsGeneratedThisWeek },
    { count: postsPublished },
    { count: myPostsCount },
    { count: teams },
    { count: companies },
    tokenData,
    activeUsersData,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgoISO),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", twoWeeksAgoISO).lt("created_at", weekAgoISO),
    supabaseAdmin.from("generated_posts").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("generated_posts").select("*", { count: "exact", head: true }).gte("created_at", weekAgoISO),
    supabaseAdmin.from("scheduled_posts").select("*", { count: "exact", head: true }).eq("status", "posted"),
    supabaseAdmin.from("my_posts").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("teams").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("companies").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("prompt_usage_logs").select("input_tokens, output_tokens, total_tokens, model"),
    supabaseAdmin.from("generated_posts").select("user_id").gte("created_at", weekAgoISO),
  ])

  // Real OpenRouter per-token pricing
  const PRICING: Record<string, { input: number; output: number }> = {
    "openai/gpt-4.1": { input: 0.000002, output: 0.000008 },
    "openai/gpt-4.1-2025-04-14": { input: 0.000002, output: 0.000008 },
    "openai/gpt-4o": { input: 0.0000025, output: 0.00001 },
  }
  const DEF = { input: 0.000002, output: 0.000008 }

  const totalTokens = tokenData.data?.reduce((sum, r) => sum + (r.total_tokens || 0), 0) ?? 0
  const totalCost = tokenData.data?.reduce((sum, r) => {
    const p = PRICING[r.model] || DEF
    return sum + ((r.input_tokens || 0) * p.input) + ((r.output_tokens || 0) * p.output)
  }, 0) ?? 0
  const activeUsers = new Set(activeUsersData.data?.map((r) => r.user_id)).size

  const userGrowth = usersPrevWeek
    ? (((usersLastWeek ?? 0) - (usersPrevWeek ?? 0)) / (usersPrevWeek ?? 1)) * 100
    : 0

  return {
    totalUsers: totalUsers ?? 0,
    userGrowth,
    activeUsers,
    postsGenerated: postsGenerated ?? 0,
    postsGeneratedThisWeek: postsGeneratedThisWeek ?? 0,
    postsPublished: (postsPublished ?? 0) + (myPostsCount ?? 0),
    totalTokens,
    totalCost,
    teams: (teams ?? 0) + (companies ?? 0),
  }
}

async function getRecentActivity() {
  const [signups, generated, scheduled] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("generated_posts")
      .select("id, user_id, post_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("scheduled_posts")
      .select("id, user_id, status, scheduled_for, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  type ActivityItem = {
    type: "signup" | "generated" | "scheduled"
    id: string
    description: string
    timestamp: string
  }

  const items: ActivityItem[] = []

  signups.data?.forEach((u) =>
    items.push({
      type: "signup",
      id: u.id,
      description: `${u.full_name || u.email} signed up`,
      timestamp: u.created_at,
    })
  )
  generated.data?.forEach((p) =>
    items.push({
      type: "generated",
      id: p.id,
      description: `Post generated (${p.post_type || "unknown"})`,
      timestamp: p.created_at,
    })
  )
  scheduled.data?.forEach((s) =>
    items.push({
      type: "scheduled",
      id: s.id,
      description: `Post ${s.status} for ${new Date(s.scheduled_for).toLocaleDateString("en-US")}`,
      timestamp: s.created_at,
    })
  )

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)
}

async function getSystemHealth() {
  const [companyJobs, researchJobs, suggestionJobs] = await Promise.all([
    supabaseAdmin.from("company_context").select("status"),
    supabaseAdmin.from("research_sessions").select("status"),
    supabaseAdmin.from("suggestion_generation_runs").select("status"),
  ])

  const allJobs = [
    ...(companyJobs.data || []),
    ...(researchJobs.data || []),
    ...(suggestionJobs.data || []),
  ]

  return {
    running: allJobs.filter((j) => ["pending", "scraping", "researching", "analyzing"].includes(j.status)).length,
    completed: allJobs.filter((j) => j.status === "completed").length,
    failed: allJobs.filter((j) => j.status === "failed").length,
    total: allJobs.length,
  }
}

export default async function DashboardPage() {
  const [metrics, activity, health] = await Promise.all([
    getOverviewMetrics(),
    getRecentActivity(),
    getSystemHealth(),
  ])

  return (
    <>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers}
          change={metrics.userGrowth}
          subtitle="All registered users"
        />
        <MetricCard
          title="Active Users (7d)"
          value={metrics.activeUsers}
          subtitle="Users who generated content this week"
        />
        <MetricCard
          title="Posts Generated"
          value={metrics.postsGenerated}
          subtitle={`${metrics.postsGeneratedThisWeek} this week`}
        />
        <MetricCard
          title="Posts Published"
          value={metrics.postsPublished}
          subtitle="Successfully posted to LinkedIn"
        />
        <MetricCard
          title="Token Usage"
          value={metrics.totalTokens.toLocaleString("en-US")}
          subtitle={`Est. cost: $${metrics.totalCost.toFixed(2)}`}
        />
        <MetricCard
          title="Teams & Companies"
          value={metrics.teams}
          subtitle="Total organizations"
        />
      </div>

      {/* Recent Activity + System Health */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.description}</span>
                  <span className="text-muted-foreground">
                    {new Date(item.timestamp).toLocaleDateString("en-US")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Background job status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-yellow-600">{health.running}</div>
                <div className="text-sm text-muted-foreground">Running</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">{health.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-destructive">{health.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{health.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
