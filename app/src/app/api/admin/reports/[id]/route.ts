import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireAdmin();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const { status } = await request.json();
  const { error } = await result.supabase.from("reports").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
