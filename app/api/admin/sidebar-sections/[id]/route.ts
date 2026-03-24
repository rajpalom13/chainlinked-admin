import { NextResponse, type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth"
import { auditLog } from "@/lib/audit"

async function authenticate(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await authenticate(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (typeof body.enabled === "boolean") updates.enabled = body.enabled
  if (typeof body.sort_order === "number") updates.sort_order = body.sort_order
  if (typeof body.label === "string") updates.label = body.label
  if (typeof body.description === "string") updates.description = body.description

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    )
  }

  updates.updated_at = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("sidebar_sections")
    .update(updates)
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  auditLog("sidebar_section.update", { adminId: admin.sub, sectionId: id, updates })

  return NextResponse.json({ success: true })
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

  const { error } = await supabaseAdmin
    .from("sidebar_sections")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  auditLog("sidebar_section.delete", { adminId: admin.sub, sectionId: id })

  return NextResponse.json({ success: true })
}
