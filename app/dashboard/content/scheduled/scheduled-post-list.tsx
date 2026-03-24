"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  GlobeIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  LinkIcon,
} from "lucide-react"

interface ScheduledPost {
  id: string
  user_id: string
  content: string | null
  scheduled_for: string | null
  timezone: string | null
  status: string | null
  error_message: string | null
  posted_at: string | null
  created_at: string
  generated_post_id?: string | null
  userName: string
}

function statusConfig(status: string | null) {
  switch (status) {
    case "posted":
      return {
        variant: "default" as const,
        label: "Posted",
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      }
    case "failed":
      return {
        variant: "destructive" as const,
        label: "Failed",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      }
    default:
      return {
        variant: "secondary" as const,
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      }
  }
}

function formatScheduledTime(dateStr: string | null): string {
  if (!dateStr) return "Not set"
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function ScheduledPostList({ posts }: { posts: ScheduledPost[] }) {
  const [selected, setSelected] = useState<ScheduledPost | null>(null)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const config = statusConfig(post.status)

          return (
            <Card
              key={post.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
              onClick={() => setSelected(post)}
            >
              <CardContent className="flex flex-col gap-3 p-4">
                {/* Status badge and time */}
                <div className="flex items-center justify-between">
                  <Badge className={config.className} variant="outline">
                    {config.label}
                  </Badge>
                  {post.generated_post_id && (
                    <LinkIcon className="size-3.5 text-muted-foreground" />
                  )}
                </div>

                {/* Content preview */}
                <p className="text-sm leading-relaxed line-clamp-3 min-h-[3.75rem]">
                  {post.content?.slice(0, 150) || "No content"}
                </p>

                {/* Footer meta */}
                <div className="flex items-center justify-between pt-1 border-t">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserIcon className="size-3" />
                    <span className="truncate max-w-[100px]">
                      {post.userName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ClockIcon className="size-3" />
                    <span>{formatScheduledTime(post.scheduled_for)}</span>
                  </div>
                </div>

                {post.timezone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <GlobeIcon className="size-3" />
                    <span>{post.timezone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detail sheet */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
          {selected && (
            <>
              <SheetHeader className="px-6 pt-6 pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <CalendarIcon className="size-4" />
                  Scheduled Post
                </SheetTitle>
                <SheetDescription>
                  Full details and scheduling information
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-6 pb-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  {selected.status === "posted" ? (
                    <CheckCircle2Icon className="size-8 text-green-600" />
                  ) : selected.status === "failed" ? (
                    <AlertCircleIcon className="size-8 text-red-600" />
                  ) : (
                    <ClockIcon className="size-8 text-yellow-600" />
                  )}
                  <div>
                    <Badge
                      className={statusConfig(selected.status).className}
                      variant="outline"
                    >
                      {statusConfig(selected.status).label}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created{" "}
                      {new Date(selected.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">User</p>
                    <p className="text-sm font-medium">{selected.userName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Scheduled For
                    </p>
                    <p className="text-sm font-medium">
                      {selected.scheduled_for
                        ? new Date(selected.scheduled_for).toLocaleString()
                        : "Not set"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Timezone</p>
                    <p className="text-sm font-medium">
                      {selected.timezone || "Not specified"}
                    </p>
                  </div>
                  {selected.posted_at && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Posted At</p>
                      <p className="text-sm font-medium">
                        {new Date(selected.posted_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {selected.generated_post_id && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <LinkIcon className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Linked to generated post:
                      </span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {selected.generated_post_id.slice(0, 12)}...
                      </code>
                    </div>
                  </>
                )}

                <Separator />

                {/* Full content */}
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Full Content
                  </h3>
                  <div className="rounded-lg border bg-card p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selected.content || "No content available"}
                    </p>
                  </div>
                </div>

                {/* Error message */}
                {selected.error_message && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                        <AlertCircleIcon className="size-4" />
                        Error Details
                      </h3>
                      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4">
                        <p className="whitespace-pre-wrap text-sm text-red-700 dark:text-red-300">
                          {selected.error_message}
                        </p>
                      </div>
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
