import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const result = await requireAdmin();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const { name, state } = await request.json();
  if (!name || !state) return NextResponse.json({ error: "Preencha nome e estado." }, { status: 400 });

  const slug = `${slugify(name)}-${state.toLowerCase()}`;
  const { error } = await result.supabase.from("cities").insert({ name, state, slug });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
