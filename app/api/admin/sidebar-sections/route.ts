import { NextResponse, type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth"
import { auditLog } from "@/lib/audit"

async function authenticate(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function GET(request: NextRequest) {
  const admin = await authenticate(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from("sidebar_sections")
    .select("*")
    .order("sort_order")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const admin = await authenticate(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { key, label, description, enabled, sort_order } = body

  if (!key || typeof key !== "string") {
    return NextResponse.json(
      { error: "Key is required" },
      { status: 400 }
    )
  }

  if (!label || typeof label !== "string") {
    return NextResponse.json(
      { error: "Label is required" },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from("sidebar_sections")
    .insert({
      key,
      label,
      description: description ?? null,
      enabled: typeof enabled === "boolean" ? enabled : true,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  auditLog("sidebar_section.create", { adminId: admin.sub, sectionId: data.id, key })

  return NextResponse.json(data, { status: 201 })
}
