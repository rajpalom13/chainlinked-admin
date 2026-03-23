import { NextResponse, type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth"
import { auditLog } from "@/lib/audit"

const ALLOWED_TABLES = ["generated_posts", "scheduled_posts", "templates"]

async function authenticate(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await authenticate(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const table = searchParams.get("table")

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json(
      { error: "Invalid table. Must be one of: " + ALLOWED_TABLES.join(", ") },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin.from(table).delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  auditLog("content.delete", {
    adminId: admin.sub,
    table,
    contentId: id,
  })

  return NextResponse.json({ success: true })
}
