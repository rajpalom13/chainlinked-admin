import { supabaseAdmin } from "@/lib/supabase/client"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SidebarSectionsManager } from "./sidebar-sections-manager"

async function getSidebarSections() {
  const { data, error } = await supabaseAdmin
    .from("sidebar_sections")
    .select("*")
    .order("sort_order")

  if (error || !data) return []
  return data
}

export default async function SidebarControlPage() {
  const sections = await getSidebarSections()

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Sidebar Control</CardTitle>
          <CardDescription>
            Manage which sections appear in the ChainLinked platform sidebar. Toggle visibility and drag to reorder.
          </CardDescription>
        </CardHeader>
        <SidebarSectionsManager initialSections={sections} />
      </Card>
    </div>
  )
}
