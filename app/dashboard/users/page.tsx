import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase/client"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { UsersIcon } from "lucide-react"

async function getUsers() {
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, created_at, onboarding_completed, linkedin_user_id")
    .order("created_at", { ascending: false })

  if (error || !profiles) return []

  // Get post counts per user
  const { data: postCounts } = await supabaseAdmin
    .from("generated_posts")
    .select("user_id")

  const postCountMap = new Map<string, number>()
  postCounts?.forEach((p) => {
    postCountMap.set(p.user_id, (postCountMap.get(p.user_id) ?? 0) + 1)
  })

  // Get team memberships
  const { data: teamMembers } = await supabaseAdmin
    .from("team_members")
    .select("user_id, team_id, teams(name)")

  const teamMap = new Map<string, string>()
  teamMembers?.forEach((tm) => {
    const teamName = (tm.teams as unknown as { name: string })?.name
    if (teamName) {
      teamMap.set(tm.user_id, teamName)
    }
  })

  return profiles.map((profile) => ({
    ...profile,
    postCount: postCountMap.get(profile.id) ?? 0,
    teamName: teamMap.get(profile.id) ?? null,
  }))
}

export default async function UsersPage() {
  const users = await getUsers()

  if (users.length === 0) {
    return (
      <div className="px-4 lg:px-6">
        <EmptyState
          title="No users yet"
          description="Users will appear here once they sign up."
          icon={<UsersIcon className="size-12" />}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} total users
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Signed Up</TableHead>
            <TableHead>Onboarding</TableHead>
            <TableHead>Posts Generated</TableHead>
            <TableHead>LinkedIn</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.full_name || "No name"}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString("en-US")}
              </TableCell>
              <TableCell>
                <Badge variant={user.onboarding_completed ? "default" : "secondary"}>
                  {user.onboarding_completed ? "Complete" : "Incomplete"}
                </Badge>
              </TableCell>
              <TableCell>{user.postCount}</TableCell>
              <TableCell>
                <Badge variant={user.linkedin_user_id ? "default" : "outline"}>
                  {user.linkedin_user_id ? "Connected" : "Not connected"}
                </Badge>
              </TableCell>
              <TableCell>{user.teamName ?? "-"}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/users/${user.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
