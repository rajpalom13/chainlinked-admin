"use client"

import { useState } from "react"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  LayoutTemplateIcon,
  EyeIcon,
  UserIcon,
  CalendarIcon,
  SparklesIcon,
  HashIcon,
  GlobeIcon,
  LockIcon,
  BotIcon,
} from "lucide-react"

interface Template {
  id: string
  user_id: string
  name: string | null
  content: string | null
  category: string | null
  is_public: boolean | null
  usage_count: number | null
  is_ai_generated: boolean | null
  created_at: string
  userName: string
}

function categoryColor(category: string | null): string {
  switch (category?.toLowerCase()) {
    case "thought-leadership":
    case "thought leadership":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800"
    case "engagement":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
    case "promotional":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800"
    case "educational":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
    case "storytelling":
    case "story":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800"
  }
}

export function TemplateList({ templates }: { templates: Template[] }) {
  const [selected, setSelected] = useState<Template | null>(null)

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Name</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Usage</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id} className="group">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[220px]">
                      {template.name ?? "Untitled"}
                    </span>
                    {template.is_ai_generated && (
                      <Badge
                        variant="outline"
                        className="shrink-0 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800 text-[10px] px-1.5"
                      >
                        <BotIcon className="mr-0.5 size-2.5" />
                        AI
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {template.userName}
                </TableCell>
                <TableCell>
                  {template.category ? (
                    <Badge
                      variant="outline"
                      className={`text-xs ${categoryColor(template.category)}`}
                    >
                      {template.category}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">--</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      template.is_public
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
                    }
                  >
                    {template.is_public ? (
                      <>
                        <GlobeIcon className="mr-1 size-3" />
                        Public
                      </>
                    ) : (
                      <>
                        <LockIcon className="mr-1 size-3" />
                        Private
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {template.usage_count ?? 0}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(template.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSelected(template)}
                  >
                    <EyeIcon className="mr-1 size-3" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Template detail sheet */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
          {selected && (
            <>
              <SheetHeader className="px-6 pt-6 pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <LayoutTemplateIcon className="size-4" />
                  {selected.name ?? "Untitled Template"}
                </SheetTitle>
                <SheetDescription>
                  Template details and content
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-6 pb-6">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  {selected.category && (
                    <Badge
                      variant="outline"
                      className={categoryColor(selected.category)}
                    >
                      {selected.category}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      selected.is_public
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
                    }
                  >
                    {selected.is_public ? (
                      <>
                        <GlobeIcon className="mr-1 size-3" />
                        Public
                      </>
                    ) : (
                      <>
                        <LockIcon className="mr-1 size-3" />
                        Private
                      </>
                    )}
                  </Badge>
                  {selected.is_ai_generated && (
                    <Badge
                      variant="outline"
                      className="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800"
                    >
                      <BotIcon className="mr-1 size-3" />
                      AI Generated
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Creator:</span>
                    <span className="font-medium">{selected.userName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(selected.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HashIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Usage count:</span>
                    <span className="font-medium">
                      {selected.usage_count ?? 0}
                    </span>
                  </div>
                </div>

                {/* AI Generation context */}
                {selected.is_ai_generated && (
                  <>
                    <Separator />
                    <div className="rounded-lg border bg-violet-50/50 dark:bg-violet-900/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="size-4 text-violet-600 dark:text-violet-400" />
                        <h3 className="text-sm font-medium text-violet-800 dark:text-violet-300">
                          AI-Generated Template
                        </h3>
                      </div>
                      <p className="text-sm text-violet-700/80 dark:text-violet-400/80">
                        This template was automatically generated by AI based on
                        user preferences and content patterns.
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Full content */}
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Template Content
                  </h3>
                  <div className="rounded-lg border bg-card p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selected.content || selected.name || "No content available"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
