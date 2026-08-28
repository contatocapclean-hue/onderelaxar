import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const result = await requireAdmin();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "Informe o nome da categoria." }, { status: 400 });

  const { error } = await result.supabase
    .from("service_categories")
    .insert({ name, slug: slugify(name) });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
