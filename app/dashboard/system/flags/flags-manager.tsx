"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface Flag {
  id: string
  name: string
  description: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export function FlagsManager({ initialFlags }: { initialFlags: Flag[] }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/admin/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to create flag")
        return
      }

      toast.success("Flag created")
      setName("")
      setDescription("")
      router.refresh()
    } catch {
      toast.error("Failed to create flag")
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/admin/flags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to update flag")
        return
      }

      toast.success("Flag updated")
      router.refresh()
    } catch {
      toast.error("Failed to update flag")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/flags/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to delete flag")
        return
      }

      toast.success("Flag deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete flag")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 pt-0">
      <form onSubmit={handleCreate} className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="flag-name">Name</Label>
          <Input
            id="flag-name"
            placeholder="e.g. enable_ai_suggestions"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="flag-desc">Description</Label>
          <Input
            id="flag-desc"
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading || !name.trim()}>
          Add
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {initialFlags.map((flag) => (
          <div
            key={flag.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={flag.enabled}
                onCheckedChange={(checked) =>
                  handleToggle(flag.id, checked === true)
                }
              />
              <div>
                <p className="text-sm font-medium">{flag.name}</p>
                {flag.description && (
                  <p className="text-xs text-muted-foreground">
                    {flag.description}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(flag.id)}
            >
              Delete
            </Button>
          </div>
        ))}

        {initialFlags.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No feature flags configured yet.
          </p>
        )}
      </div>
    </div>
  )
}
