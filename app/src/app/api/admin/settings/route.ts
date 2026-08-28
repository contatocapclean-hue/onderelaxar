import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/require-admin";

export async function PATCH(request: NextRequest) {
  const result = await requireSuperAdmin();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.heroBadge === "string") updates.hero_badge = body.heroBadge;
  if (typeof body.heroTitle === "string") updates.hero_title = body.heroTitle;
  if (typeof body.heroSubtitle === "string") updates.hero_subtitle = body.heroSubtitle;
  if (typeof body.ctaTitle === "string") updates.cta_title = body.ctaTitle;
  if (typeof body.ctaSubtitle === "string") updates.cta_subtitle = body.ctaSubtitle;
  if (typeof body.footerDescription === "string") updates.footer_description = body.footerDescription;

  const { error } = await result.supabase.from("site_settings").update(updates).eq("id", 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
