type AuditAction =
  | "login"
  | "logout"
  | "user.delete"
  | "user.suspend"
  | "user.unsuspend"
  | "content.delete"
  | "prompt.update"
  | "flag.create"
  | "flag.update"
  | "flag.delete"
  | "password.change"

export function auditLog(action: AuditAction, details: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      type: "admin_audit",
      action,
      timestamp: new Date().toISOString(),
      ...details,
    })
  )
}
