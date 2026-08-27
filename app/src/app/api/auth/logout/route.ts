import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

export async function POST() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase!.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
