import { supabaseAdmin } from "@/lib/supabase/client"
import { EmptyState } from "@/components/empty-state"
import { MetricCard } from "@/components/metric-card"
import {
  Building2Icon,
  UsersIcon,
  HashIcon,
  TrophyIcon,
} from "lucide-react"
import { TeamsTable } from "./teams-table"

interface TeamData {
  id: string
  name: string
  created_at: string
  memberCount: number
  totalPosts: number
  totalTokens: number
  totalCost: number
  lastActive: string | null
}

async function getTeams(): Promise<TeamData[]> {
  const [
    { data: teams },
    { data: teamMembers },
    { data: postCounts },
    { data: usageLogs },
    { data: profiles },
  ] = await Promise.all([
    supabaseAdmin
      .from("teams")
      .select("id, name, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("team_members")
      .select("user_id, team_id"),
    supabaseAdmin
      .from("generated_posts")
      .select("user_id"),
    supabaseAdmin
      .from("prompt_usage_logs")
      .select("user_id, total_tokens, estimated_cost"),
    supabaseAdmin
      .from("profiles")
      .select("id, extension_last_active_at"),
  ])

  if (!teams || teams.length === 0) return []

  // Build member map: team_id -> user_ids
  const memberMap = new Map<string, string[]>()
  teamMembers?.forEach((tm) => {
    const members = memberMap.get(tm.team_id) ?? []
    members.push(tm.user_id)
    memberMap.set(tm.team_id, members)
  })

  // Build post count map: user_id -> count
  const postCountMap = new Map<string, number>()
  postCounts?.forEach((p) => {
    postCountMap.set(p.user_id, (postCountMap.get(p.user_id) ?? 0) + 1)
  })

  // Build usage map: user_id -> { tokens, cost }
  const usageMap = new Map<string, { tokens: number; cost: number }>()
  usageLogs?.forEach((log) => {
    const existing = usageMap.get(log.user_id) ?? { tokens: 0, cost: 0 }
    existing.tokens += log.total_tokens || 0
    existing.cost += Number(log.estimated_cost || 0)
    usageMap.set(log.user_id, existing)
  })

  // Build last active map: user_id -> date string
  const lastActiveMap = new Map<string, string | null>()
  profiles?.forEach((p) => {
    lastActiveMap.set(p.id, p.extension_last_active_at)
  })

  return teams.map((team) => {
    const members = memberMap.get(team.id) ?? []
    let totalPosts = 0
    let totalTokens = 0
    let totalCost = 0
    let lastActive: string | null = null

    for (const userId of members) {
      totalPosts += postCountMap.get(userId) ?? 0
      const usage = usageMap.get(userId)
      if (usage) {
        totalTokens += usage.tokens
        totalCost += usage.cost
      }
      const userLastActive = lastActiveMap.get(userId)
      if (userLastActive && (!lastActive || userLastActive > lastActive)) {
        lastActive = userLastActive
      }
    }

    return {
      id: team.id,
      name: team.name,
      created_at: team.created_at,
      memberCount: members.length,
      totalPosts,
      totalTokens,
      totalCost,
      lastActive,
    }
  })
}

export default async function TeamsPage() {
  const teams = await getTeams()

  if (teams.length === 0) {
    return (
      <div className="px-4 lg:px-6">
        <EmptyState
          title="No teams yet"
          description="Teams will appear here once they are created."
          icon={<Building2Icon className="size-12" />}
        />
      </div>
    )
  }

  const totalMembers = teams.reduce((sum, t) => sum + t.memberCount, 0)
  const avgSize = teams.length > 0 ? (totalMembers / teams.length).toFixed(1) : "0"
  const mostActive = teams.reduce((best, t) => (t.totalPosts > best.totalPosts ? t : best), teams[0])

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Teams</h1>
        <p className="text-sm text-muted-foreground">
          {teams.length} total teams
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 @xl/main:grid-cols-4">
        <MetricCard
          title="Total Teams"
          value={teams.length}
          icon={Building2Icon}
          accent="primary"
        />
        <MetricCard
          title="Total Members"
          value={totalMembers}
          icon={UsersIcon}
          accent="blue"
        />
        <MetricCard
          title="Avg Team Size"
          value={avgSize}
          icon={HashIcon}
          accent="emerald"
        />
        <MetricCard
          title="Most Active Team"
          value={mostActive.name}
          subtitle={`${mostActive.totalPosts} posts`}
          icon={TrophyIcon}
          accent="amber"
        />
      </div>

      {/* Teams Table */}
      <TeamsTable teams={teams} />
    </div>
  )
}
