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
import { LayoutTemplateIcon } from "lucide-react"

export default async function TemplatesPage() {
  const { data: templates, count, error } = await supabaseAdmin
    .from("templates")
    .select(
      "id, name, category, is_public, usage_count, is_ai_generated, created_at, profiles(full_name, email)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(50)

  if (error || !templates || templates.length === 0) {
    return (
      <div className="px-4 lg:px-6">
        <EmptyState
          title="No templates"
          description="Templates will appear here."
          icon={<LayoutTemplateIcon className="size-12" />}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="text-sm text-muted-foreground">
          {count ?? templates.length} total templates
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Usage Count</TableHead>
            <TableHead>AI</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => {
            const profile = template.profiles as unknown as {
              full_name: string
              email: string
            } | null

            return (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  {template.name ?? "Untitled"}
                </TableCell>
                <TableCell>{profile?.full_name ?? "Unknown"}</TableCell>
                <TableCell>{template.category ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={template.is_public ? "default" : "secondary"}>
                    {template.is_public ? "Public" : "Private"}
                  </Badge>
                </TableCell>
                <TableCell>{template.usage_count ?? 0}</TableCell>
                <TableCell>
                  {template.is_ai_generated ? (
                    <Badge variant="outline">AI Generated</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {new Date(template.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
