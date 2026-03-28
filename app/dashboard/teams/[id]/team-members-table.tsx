"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchIcon, ArrowUpDownIcon } from "lucide-react"

interface Member {
  id: string
  full_name: string | null
  email: string
  created_at: string
  onboarding_completed: boolean
  extension_last_active_at: string | null
  postCount: number
  totalTokens: number
}

type SortKey = "name" | "created_at" | "postCount" | "totalTokens" | "lastActive"
type SortDir = "asc" | "desc"

export function TeamMembersTable({ members }: { members: Member[] }) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("postCount")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const filtered = useMemo(() => {
    let result = members

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (m) =>
          (m.full_name?.toLowerCase().includes(q)) ||
          m.email.toLowerCase().includes(q)
      )
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") {
        cmp = (a.full_name || "").localeCompare(b.full_name || "")
      } else if (sortKey === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortKey === "postCount") {
        cmp = a.postCount - b.postCount
      } else if (sortKey === "totalTokens") {
        cmp = a.totalTokens - b.totalTokens
      } else if (sortKey === "lastActive") {
        const aTime = a.extension_last_active_at ? new Date(a.extension_last_active_at).getTime() : 0
        const bTime = b.extension_last_active_at ? new Date(b.extension_last_active_at).getTime() : 0
        cmp = aTime - bTime
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [members, search, sortKey, sortDir])

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {search && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {members.length} members
        </p>
      )}

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Name
                  <ArrowUpDownIcon className={`size-3 ${sortKey === "name" ? "text-foreground" : "text-muted-foreground/40"}`} />
                </button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>
                <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Joined
                  <ArrowUpDownIcon className={`size-3 ${sortKey === "created_at" ? "text-foreground" : "text-muted-foreground/40"}`} />
                </button>
              </TableHead>
              <TableHead>Onboarding</TableHead>
              <TableHead>
                <button onClick={() => toggleSort("postCount")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Posts
                  <ArrowUpDownIcon className={`size-3 ${sortKey === "postCount" ? "text-foreground" : "text-muted-foreground/40"}`} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("totalTokens")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Token Usage
                  <ArrowUpDownIcon className={`size-3 ${sortKey === "totalTokens" ? "text-foreground" : "text-muted-foreground/40"}`} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("lastActive")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Last Active
                  <ArrowUpDownIcon className={`size-3 ${sortKey === "lastActive" ? "text-foreground" : "text-muted-foreground/40"}`} />
                </button>
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No members match your search
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    {member.full_name || "No name"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell className="tabular-nums">
                    {new Date(member.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.onboarding_completed ? "default" : "secondary"}>
                      {member.onboarding_completed ? "Complete" : "Incomplete"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">{member.postCount}</TableCell>
                  <TableCell className="tabular-nums">{member.totalTokens.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {member.extension_last_active_at
                      ? new Date(member.extension_last_active_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/users/${member.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
