import { NextResponse, type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth"
import { auditLog } from "@/lib/audit"

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

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  auditLog("user.delete", { adminId: admin.sub, targetUserId: id })

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await authenticate(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { action } = body

  if (action !== "suspend" && action !== "unsuspend") {
    return NextResponse.json(
      { error: "Invalid action. Must be 'suspend' or 'unsuspend'." },
      { status: 400 }
    )
  }

  const ban_duration = action === "suspend" ? "876000h" : "none"

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  auditLog(action === "suspend" ? "user.suspend" : "user.unsuspend", {
    adminId: admin.sub,
    targetUserId: id,
  })

  return NextResponse.json({ success: true })
}
