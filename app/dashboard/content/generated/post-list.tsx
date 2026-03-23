"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { EyeIcon, SparklesIcon, CalendarIcon, UserIcon, TypeIcon, HashIcon } from "lucide-react"

interface Post {
  id: string
  user_id: string
  content: string | null
  post_type: string | null
  source: string | null
  status: string | null
  word_count: number | null
  hook: string | null
  cta: string | null
  created_at: string
  userName: string
  qualityScore: number
  qualityGrade: "low" | "medium" | "high"
}

function gradeVariant(grade: string): "default" | "secondary" | "destructive" {
  if (grade === "high") return "default"
  if (grade === "medium") return "secondary"
  return "destructive"
}

function gradeLabel(grade: string): string {
  if (grade === "high") return "High Quality"
  if (grade === "medium") return "Medium"
  return "Needs Improvement"
}

export function PostList({ posts }: { posts: Post[] }) {
  const [selected, setSelected] = useState<Post | null>(null)

  return (
    <>
      <div className="grid gap-3">
        {posts.map((post) => (
          <Card
            key={post.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setSelected(post)}
          >
            <CardContent className="flex items-start gap-4 pt-4 pb-4">
              {/* Quality indicator */}
              <div className="flex flex-col items-center gap-1 pt-0.5">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg text-sm font-bold ${
                    post.qualityGrade === "high"
                      ? "bg-primary/10 text-primary"
                      : post.qualityGrade === "medium"
                      ? "bg-secondary/20 text-secondary-foreground"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {post.qualityScore}
                </div>
              </div>

              {/* Content preview */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed line-clamp-3">
                  {post.content?.slice(0, 200) || "No content"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {post.post_type || "general"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {post.source || "direct"}
                  </Badge>
                  <Badge variant={post.status === "posted" ? "default" : "outline"} className="text-xs">
                    {post.status || "draft"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {post.word_count || 0} words
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                <span className="text-xs font-medium">{post.userName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs">
                  <EyeIcon className="mr-1 size-3" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full post viewer sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <SparklesIcon className="size-4" />
                  Generated Post
                </SheetTitle>
                <SheetDescription>
                  Full content and metadata
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Quality score */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl text-lg font-bold ${
                      selected.qualityGrade === "high"
                        ? "bg-primary/10 text-primary"
                        : selected.qualityGrade === "medium"
                        ? "bg-secondary/20 text-secondary-foreground"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {selected.qualityScore}
                  </div>
                  <div>
                    <p className="font-medium">Quality Score: {selected.qualityScore}/100</p>
                    <p className="text-sm text-muted-foreground">{gradeLabel(selected.qualityGrade)}</p>
                  </div>
                </div>

                <Separator />

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Author:</span>
                    <span className="font-medium">{selected.userName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TypeIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline" className="text-xs">{selected.post_type || "general"}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <SparklesIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Source:</span>
                    <Badge variant="secondary" className="text-xs">{selected.source || "direct"}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{new Date(selected.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HashIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Words:</span>
                    <span className="font-medium">{selected.word_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={selected.status === "posted" ? "default" : "outline"} className="text-xs">
                      {selected.status || "draft"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Full post content */}
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Full Post Content</h3>
                  <div className="rounded-lg border bg-card p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selected.content || "No content available"}
                    </p>
                  </div>
                </div>

                {/* Hook & CTA if present */}
                {(selected.hook || selected.cta) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      {selected.hook && (
                        <div>
                          <h3 className="mb-1 text-sm font-medium text-muted-foreground">Hook</h3>
                          <p className="text-sm rounded-lg bg-primary/5 p-3 border border-primary/10">
                            {selected.hook}
                          </p>
                        </div>
                      )}
                      {selected.cta && (
                        <div>
                          <h3 className="mb-1 text-sm font-medium text-muted-foreground">Call to Action</h3>
                          <p className="text-sm rounded-lg bg-secondary/10 p-3 border border-secondary/10">
                            {selected.cta}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
