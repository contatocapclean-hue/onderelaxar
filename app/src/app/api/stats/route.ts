import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

const ALLOWED_FIELDS = new Set(["views", "whatsapp_clicks", "contact_clicks"]);

/** IP do visitante a partir dos headers de proxy mais comuns (Vercel inclui
 * x-forwarded-for). Nunca é gravado em texto puro — só o hash é persistido,
 * só para deduplicar visualizações repetidas do mesmo visitante. */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const professionalId = body?.professionalId as string | undefined;
  const field = body?.field as string | undefined;

  if (!professionalId || !field || !ALLOWED_FIELDS.has(field)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    // Modo demo: não há banco real para gravar a métrica.
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createClient();

  if (field === "views") {
    // Visualizações contam no máximo uma vez por IP a cada 24h, para que
    // atualizar a página repetidamente não infle o contador.
    const ipHash = hashIp(getClientIp(request));
    const { error } = await supabase!.rpc("register_profile_view", {
      p_professional_id: professionalId,
      p_ip_hash: ipHash,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase!.rpc("increment_profile_stat", {
    p_professional_id: professionalId,
    p_field: field,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
