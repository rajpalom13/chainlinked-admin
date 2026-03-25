import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/client"
import { MetricCard } from "@/components/metric-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserActions } from "./user-actions"

async function getUserDetail(id: string) {
  const [
    { data: profile },
    { data: generatedPosts },
    { data: scheduledPosts },
    { count: myPostsCount },
    { count: templatesCount },
    { data: usageLogs },
  ] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, created_at, onboarding_completed, linkedin_user_id, extension_last_active_at")
      .eq("id", id)
      .single(),
    supabaseAdmin
      .from("generated_posts")
      .select("id, content, post_type, status, word_count, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("scheduled_posts")
      .select("id, content, status, scheduled_for, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("my_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id),
    supabaseAdmin
      .from("templates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id),
    supabaseAdmin
      .from("prompt_usage_logs")
      .select("total_tokens, estimated_cost, feature, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ])

  if (!profile) return null

  const totalTokens = usageLogs?.reduce((sum, r) => sum + (r.total_tokens || 0), 0) ?? 0
  const totalCost = usageLogs?.reduce((sum, r) => sum + Number(r.estimated_cost || 0), 0) ?? 0

  return {
    profile,
    generatedPosts: generatedPosts ?? [],
    scheduledPosts: scheduledPosts ?? [],
    myPostsCount: myPostsCount ?? 0,
    templatesCount: templatesCount ?? 0,
    totalTokens,
    totalCost,
  }
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getUserDetail(id)

  if (!data) {
    notFound()
  }

  const { profile, generatedPosts, scheduledPosts, myPostsCount, templatesCount, totalTokens, totalCost } = data

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Avatar size="lg">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">
              {profile.full_name || "No name"}
            </h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-2 flex gap-2">
              <Badge variant={profile.onboarding_completed ? "default" : "secondary"}>
                {profile.onboarding_completed ? "Onboarding complete" : "Onboarding incomplete"}
              </Badge>
              <Badge variant={profile.linkedin_user_id ? "default" : "outline"}>
                {profile.linkedin_user_id ? "LinkedIn connected" : "LinkedIn not connected"}
              </Badge>
              {profile.extension_last_active_at && (
                <Badge variant="outline">
                  Extension active: {new Date(profile.extension_last_active_at).toLocaleDateString("en-US")}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Signed up {new Date(profile.created_at).toLocaleDateString("en-US")}
            </p>
          </div>
          <UserActions userId={profile.id} userName={profile.full_name || profile.email} />
        </CardContent>
      </Card>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <MetricCard title="Posts Generated" value={generatedPosts.length >= 20 ? "20+" : generatedPosts.length} />
        <MetricCard title="Posts Published" value={myPostsCount} />
        <MetricCard title="Templates" value={templatesCount} />
        <MetricCard
          title="Token Usage"
          value={totalTokens.toLocaleString("en-US")}
          subtitle={`Est. cost: $${totalCost.toFixed(2)}`}
        />
      </div>

      {/* Recent Generated Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Generated Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {generatedPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No generated posts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Words</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-[300px] truncate">
                      {post.content?.slice(0, 80) ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.post_type ?? "-"}</Badge>
                    </TableCell>
                    <TableCell>{post.status ?? "-"}</TableCell>
                    <TableCell>{post.word_count ?? "-"}</TableCell>
                    <TableCell>
                      {new Date(post.created_at).toLocaleDateString("en-US")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Scheduled Posts */}
      {scheduledPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Scheduled Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-[300px] truncate">
                      {post.content?.slice(0, 80) ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(post.scheduled_for).toLocaleDateString("en-US")}
                    </TableCell>
                    <TableCell>
                      {new Date(post.created_at).toLocaleDateString("en-US")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
