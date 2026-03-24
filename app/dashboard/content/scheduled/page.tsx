import { supabaseAdmin } from "@/lib/supabase/client"
import { EmptyState } from "@/components/empty-state"
import { ClockIcon } from "lucide-react"
import { ScheduledPostList } from "./scheduled-post-list"

export default async function ScheduledPostsPage() {
  const [postsRes, profilesRes] = await Promise.all([
    supabaseAdmin
      .from("scheduled_posts")
      .select(
        "id, user_id, content, scheduled_for, timezone, status, error_message, posted_at, created_at, generated_post_id",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin.from("profiles").select("id, full_name, email"),
  ])

  const posts = postsRes.data ?? []
  const count = postsRes.count

  const names = new Map<string, string>()
  profilesRes.data?.forEach((p) => {
    names.set(p.id, p.full_name || p.email || p.id.slice(0, 8))
  })

  if (!posts.length) {
    return (
      <div className="px-4 lg:px-6">
        <EmptyState
          title="No scheduled posts"
          description="Scheduled posts will appear here."
          icon={<ClockIcon className="size-12" />}
        />
      </div>
    )
  }

  const enrichedPosts = posts.map((post) => ({
    ...post,
    userName: names.get(post.user_id) ?? "Unknown",
  }))

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Scheduled Posts</h1>
        <p className="text-sm text-muted-foreground">
          {count ?? posts.length} total scheduled posts
        </p>
      </div>

      <ScheduledPostList posts={enrichedPosts} />
    </div>
  )
}
