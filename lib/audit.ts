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
  | "sidebar_section.create"
  | "sidebar_section.update"
  | "sidebar_section.delete"
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
