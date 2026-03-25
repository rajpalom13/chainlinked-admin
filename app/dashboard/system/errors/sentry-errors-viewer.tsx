"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertTriangleIcon,
  BugIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  UsersIcon,
} from "lucide-react"

interface SentryIssue {
  id: string
  title: string
  culprit: string
  count: string
  userCount: number
  firstSeen: string
  lastSeen: string
  level: string
  status: string
  permalink: string
  shortId: string
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return date.toLocaleDateString("en-US")
}

function getLevelBadgeVariant(level: string) {
  switch (level) {
    case "error":
      return "destructive" as const
    case "fatal":
      return "destructive" as const
    case "warning":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function SentryErrorsViewer() {
  const [issues, setIssues] = useState<SentryIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        "/api/admin/sentry/issues?query=is:unresolved&sort=date&limit=50"
      )

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to fetch issues")
        return
      }

      const data = await res.json()
      setIssues(data.issues || [])
    } catch {
      setError("Failed to connect to Sentry API")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const totalUnresolved = issues.length
  const errorsToday = issues.filter((i) => isToday(i.lastSeen)).length
  const affectedUsers = issues.reduce((sum, i) => sum + (i.userCount || 0), 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Unresolved
            </CardTitle>
            <BugIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold">{totalUnresolved}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Errors Today
            </CardTitle>
            <AlertTriangleIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold">{errorsToday}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Affected Users
            </CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold">{affectedUsers}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Issues</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIssues}
            disabled={loading}
          >
            <RefreshCwIcon
              className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertTriangleIcon className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchIssues}>
                Retry
              </Button>
            </div>
          ) : loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <BugIcon className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No unresolved issues. Nice work!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead className="w-[80px] text-right">Events</TableHead>
                  <TableHead className="w-[80px] text-right">Users</TableHead>
                  <TableHead className="w-[80px]">Level</TableHead>
                  <TableHead className="w-[100px]">First Seen</TableHead>
                  <TableHead className="w-[100px]">Last Seen</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium leading-tight">
                          {issue.title}
                        </span>
                        {issue.culprit && (
                          <span className="text-xs text-muted-foreground truncate max-w-[400px]">
                            {issue.culprit}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(issue.count).toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {(issue.userCount || 0).toLocaleString("en-US")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLevelBadgeVariant(issue.level)}>
                        {issue.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(issue.firstSeen)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(issue.lastSeen)}
                    </TableCell>
                    <TableCell>
                      <a
                        href={issue.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLinkIcon className="size-3.5" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
