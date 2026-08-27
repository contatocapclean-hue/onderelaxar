import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireAdmin();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.profileStatus) updates.profile_status = body.profileStatus;
  if (body.verificationStatus) updates.verification_status = body.verificationStatus;
  if (typeof body.isFeatured === "boolean") updates.is_featured = body.isFeatured;

  const { error } = await result.supabase.from("professional_profiles").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
