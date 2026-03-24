import { supabaseAdmin } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FeatureAdoptionChart, FeatureHeatmapGrid } from "@/components/charts/feature-charts"

const FEATURES = [
  { key: "generated_posts", label: "Generated Posts" },
  { key: "scheduled_posts", label: "Scheduled Posts" },
  { key: "templates", label: "Templates" },
  { key: "carousel_templates", label: "Carousel Templates" },
  { key: "swipe_preferences", label: "Swipe Preferences" },
  { key: "research_sessions", label: "Research Sessions" },
  { key: "compose_conversations", label: "Compose Conversations" },
  { key: "writing_style_profiles", label: "Writing Style Profiles" },
] as const

async function getFeatureCount(table: string): Promise<number> {
  try {
    const { count } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true })
    return count ?? 0
  } catch {
    return 0
  }
}

async function getFeatureUsers(
  table: string
): Promise<Set<string>> {
  try {
    const { data } = await supabaseAdmin
      .from(table)
      .select("user_id")
    return new Set((data ?? []).map((r) => r.user_id))
  } catch {
    return new Set()
  }
}

export default async function FeaturesAnalyticsPage() {
  const [counts, userSets] = await Promise.all([
    Promise.all(FEATURES.map((f) => getFeatureCount(f.key))),
    Promise.all(FEATURES.map((f) => getFeatureUsers(f.key))),
  ])

  const featureData = FEATURES.map((f, i) => ({
    ...f,
    count: counts[i],
    users: userSets[i],
  }))

  const maxCount = Math.max(...featureData.map((f) => f.count), 1)

  // Collect all unique user IDs
  const allUserIds = new Set<string>()
  for (const f of featureData) {
    for (const uid of f.users) {
      allUserIds.add(uid)
    }
  }

  const userIds = Array.from(allUserIds)
  const { data: profiles } = userIds.length > 0
    ? await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)
    : { data: [] }

  const profileMap: Record<string, string> = {}
  for (const p of profiles ?? []) {
    profileMap[p.id] = p.full_name || p.email || p.id.slice(0, 8)
  }

  const sortedUserIds = userIds.sort((a, b) =>
    (profileMap[a] ?? a).localeCompare(profileMap[b] ?? b)
  )

  // Chart data for bar chart
  const adoptionChartData = featureData.map((f) => ({
    label: f.label,
    count: f.count,
    users: f.users.size,
  }))

  // Build matrix for heatmap (feature key -> array of user IDs, serializable)
  const matrixMap: Record<string, string[]> = {}
  for (const f of featureData) {
    matrixMap[f.key] = Array.from(f.users)
  }

  // Max features a single user uses (for color intensity)
  const maxUserFeatures = sortedUserIds.reduce((max, uid) => {
    let count = 0
    for (const f of featureData) {
      if (f.users.has(uid)) count++
    }
    return Math.max(max, count)
  }, 1)

  const heatmapUsers = sortedUserIds.map((uid) => ({
    id: uid,
    name: profileMap[uid] ?? uid.slice(0, 8),
  }))

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <h1 className="text-2xl font-bold">Feature Usage Analytics</h1>

      <FeatureAdoptionChart data={adoptionChartData} />

      <Card>
        <CardHeader>
          <CardTitle>Feature Adoption</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {featureData.map((f) => (
              <div key={f.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{f.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {f.count.toLocaleString()} records &middot; {f.users.size} user{f.users.size !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.max((f.count / maxCount) * 100, 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {heatmapUsers.length > 0 && (
        <FeatureHeatmapGrid
          users={heatmapUsers}
          features={FEATURES.map((f) => ({ key: f.key, label: f.label }))}
          matrix={matrixMap}
          maxFeatures={maxUserFeatures}
        />
      )}
    </div>
  )
}
