"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { GripVerticalIcon, TrashIcon, PlusIcon } from "lucide-react"

interface SidebarSection {
  id: string
  key: string
  label: string
  description: string | null
  enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

function SortableItem({
  section,
  onToggle,
  onDelete,
}: {
  section: SidebarSection
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card p-4 ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-5" />
      </button>

      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{section.label}</span>
          <Badge variant="outline" className="text-xs font-mono">
            {section.key}
          </Badge>
        </div>
        {section.description && (
          <p className="text-xs text-muted-foreground">{section.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor={`toggle-${section.id}`} className="text-xs text-muted-foreground">
            {section.enabled ? "Visible" : "Hidden"}
          </Label>
          <Switch
            id={`toggle-${section.id}`}
            checked={section.enabled}
            onCheckedChange={(checked) => onToggle(section.id, checked === true)}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(section.id)}
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function SidebarSectionsManager({
  initialSections,
}: {
  initialSections: SidebarSection[]
}) {
  const router = useRouter()
  const [sections, setSections] = useState<SidebarSection[]>(initialSections)
  const [showAdd, setShowAdd] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(sections, oldIndex, newIndex)

    // Optimistic update
    setSections(reordered)

    // Update sort_order for all items
    const updates = reordered.map((section, index) => ({
      id: section.id,
      sort_order: index,
    }))

    try {
      await Promise.all(
        updates.map((u) =>
          fetch(`/api/admin/sidebar-sections/${u.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: u.sort_order }),
          })
        )
      )
      toast.success("Order updated")
      router.refresh()
    } catch {
      toast.error("Failed to update order")
      setSections(initialSections)
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    // Optimistic update
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled } : s))
    )

    try {
      const res = await fetch(`/api/admin/sidebar-sections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to update section")
        setSections((prev) =>
          prev.map((s) => (s.id === id ? { ...s, enabled: !enabled } : s))
        )
        return
      }

      toast.success(`Section ${enabled ? "enabled" : "disabled"}`)
      router.refresh()
    } catch {
      toast.error("Failed to update section")
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: !enabled } : s))
      )
    }
  }

  async function handleDelete(id: string) {
    const section = sections.find((s) => s.id === id)
    if (!section) return

    if (!confirm(`Delete "${section.label}"? This cannot be undone.`)) return

    setSections((prev) => prev.filter((s) => s.id !== id))

    try {
      const res = await fetch(`/api/admin/sidebar-sections/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to delete section")
        setSections(initialSections)
        return
      }

      toast.success("Section deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete section")
      setSections(initialSections)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newKey.trim() || !newLabel.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/admin/sidebar-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newKey.trim(),
          label: newLabel.trim(),
          description: newDescription.trim() || null,
          sort_order: sections.length,
          enabled: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to create section")
        return
      }

      toast.success("Section created")
      setNewKey("")
      setNewLabel("")
      setNewDescription("")
      setShowAdd(false)
      router.refresh()
    } catch {
      toast.error("Failed to create section")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 pt-0">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {sections.map((section) => (
              <SortableItem
                key={section.id}
                section={section}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}

            {sections.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sidebar sections configured yet.
              </p>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {showAdd ? (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-key">Key</Label>
              <Input
                id="new-key"
                placeholder="e.g. saved_drafts"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-label">Label</Label>
              <Input
                id="new-label"
                placeholder="e.g. Saved Drafts"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-desc">Description (optional)</Label>
            <Input
              id="new-desc"
              placeholder="What this section contains"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={loading || !newKey.trim() || !newLabel.trim()}>
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setShowAdd(true)}
        >
          <PlusIcon className="mr-1.5 size-4" />
          Add Section
        </Button>
      )}
    </div>
  )
}
