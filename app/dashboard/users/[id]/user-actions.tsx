"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { Trash2Icon, BanIcon } from "lucide-react"

interface UserActionsProps {
  userId: string
  userName: string
}

export function UserActions({ userId, userName }: UserActionsProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [suspendLoading, setSuspendLoading] = useState(false)

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to delete user")
        return
      }
      toast.success("User deleted successfully")
      router.push("/dashboard/users")
      router.refresh()
    } catch {
      toast.error("Failed to delete user")
    } finally {
      setDeleteLoading(false)
      setDeleteOpen(false)
    }
  }

  async function handleSuspend() {
    setSuspendLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend" }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to suspend user")
        return
      }
      toast.success("User suspended successfully")
      router.refresh()
    } catch {
      toast.error("Failed to suspend user")
    } finally {
      setSuspendLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSuspend}
        disabled={suspendLoading}
      >
        <BanIcon className="mr-1 size-4" />
        {suspendLoading ? "Suspending..." : "Suspend"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2Icon className="mr-1 size-4" />
        Delete
      </Button>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete User"
        description={`This will permanently delete ${userName} and all associated data. This action cannot be undone.`}
        confirmText="DELETE"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
