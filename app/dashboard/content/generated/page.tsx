import { supabaseAdmin } from "@/lib/supabase/client"
import { EmptyState } from "@/components/empty-state"
import { scoreContent } from "@/lib/quality-score"
import { FileTextIcon } from "lucide-react"
import { PostList } from "./post-list"

export default async function GeneratedPostsPage() {
  const [postsRes, profilesRes] = await Promise.all([
    supabaseAdmin
      .from("generated_posts")
      .select(
        "id, user_id, content, post_type, source, status, word_count, hook, cta, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .limit(100),
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
          title="No generated posts"
          description="Generated posts will appear here."
          icon={<FileTextIcon className="size-12" />}
        />
      </div>
    )
  }

  const enrichedPosts = posts.map((post) => {
    const score = scoreContent(post.content || "")
    return {
      ...post,
      userName: names.get(post.user_id) ?? "Unknown",
      qualityScore: score.total,
      qualityGrade: score.grade,
    }
  })

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Generated Posts</h1>
        <p className="text-sm text-muted-foreground">
          {count ?? posts.length} total generated posts
        </p>
      </div>

      <PostList posts={enrichedPosts} />
    </div>
  )
}
