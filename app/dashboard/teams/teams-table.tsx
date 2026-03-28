"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
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
import { SearchIcon, ArrowUpDownIcon, DownloadIcon } from "lucide-react"

interface Team {
  id: string
  name: string
  created_at: string
  memberCount: number
  totalPosts: number
  totalTokens: number
  totalCost: number
  lastActive: string | null
}

type SortKey = "name" | "memberCount" | "totalPosts" | "totalTokens" | "totalCost" | "lastActive"
type SortDir = "asc" | "desc"

export function TeamsTable({ teams }: { teams: Team[] }) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("totalPosts")
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
    let result = teams

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q))
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name)
      } else if (sortKey === "lastActive") {
        const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0
        const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0
        cmp = aTime - bTime
      } else {
        cmp = a[sortKey] - b[sortKey]
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [teams, search, sortKey, sortDir])

  function handleExport() {
    const headers = ["Team Name", "Members", "Total Posts", "Token Usage", "Est. Cost", "Last Active"]
    const rows = filtered.map((t) => [
      t.name,
      String(t.memberCount),
      String(t.totalPosts),
      t.totalTokens.toLocaleString(),
      `$${t.totalCost.toFixed(2)}`,
      t.lastActive ? new Date(t.lastActive).toLocaleDateString() : "-",
    ])
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "chainlinked-teams.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      {/* Filters Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by team name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 shrink-0">
          <DownloadIcon className="size-3.5" />
          Export
        </Button>
      </div>

      {search && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {teams.length} teams
        </p>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Team Name
                  <ArrowUpDownIcon className={`size-3 ${sortKey === "name" ? "text-foreground" : "text-muted-foreground/40"}`} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("memberCount")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Members
                  <ArrowUpDownIcon className={`size-3 ${sortKey === "memberCount" ? "text-foreground" : "text-muted-foreground/40"}`} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("totalPosts")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Total Posts
                  <ArrowUpDownIcon className={`size-3 ${sortKey === "totalPosts" ? "text-foreground" : "text-muted-foreground/40"}`} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("totalTokens")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Token Usage
                  <ArrowUpDownIcon className={`size-3 ${sortKey === "totalTokens" ? "text-foreground" : "text-muted-foreground/40"}`} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("totalCost")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Est. Cost
                  <ArrowUpDownIcon className={`size-3 ${sortKey === "totalCost" ? "text-foreground" : "text-muted-foreground/40"}`} />
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No teams match your search
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((team) => (
                <TableRow key={team.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell className="tabular-nums">{team.memberCount}</TableCell>
                  <TableCell className="tabular-nums font-medium">{team.totalPosts}</TableCell>
                  <TableCell className="tabular-nums">{team.totalTokens.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums">${team.totalCost.toFixed(2)}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {team.lastActive ? new Date(team.lastActive).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/teams/${team.id}`}>View</Link>
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
