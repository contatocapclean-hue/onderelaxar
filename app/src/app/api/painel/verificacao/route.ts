import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";
import {
  isFaceVerificationConfigured,
  verifyFaceAgainstProfile,
  MAX_ATTEMPTS_PER_DAY,
} from "@/lib/rekognition";

async function getOwnProfile(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado.", status: 401 as const };

  const { data: profile } = await supabase
    .from("professional_profiles")
    .select("id, profile_photo, verification_status, email_confirmed_at, photos(image_url, kind)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return { error: "Você ainda não tem um perfil profissional.", status: 404 as const };

  return { profile };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Modo demonstração." }, { status: 400 });
  }
  const supabase = await createClient();
  const result = await getOwnProfile(supabase!);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const { profile } = result;
  const referenceCount = (profile.profile_photo ? 1 : 0) + (profile.photos ?? []).length;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase!
    .from("face_verification_attempts")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", profile.id)
    .gte("created_at", since);

  return NextResponse.json({
    verificationStatus: profile.verification_status,
    configured: isFaceVerificationConfigured(),
    emailConfirmed: Boolean(profile.email_confirmed_at),
    hasEnoughPhotos: referenceCount > 0,
    attemptsToday: count ?? 0,
    maxAttemptsPerDay: MAX_ATTEMPTS_PER_DAY,
  });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Modo demonstração." }, { status: 400 });
  }
  if (!isFaceVerificationConfigured()) {
    return NextResponse.json(
      { error: "A verificação automática ainda não foi configurada neste site." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const result = await getOwnProfile(supabase!);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { profile } = result;

  if (profile.verification_status === "verified") {
    return NextResponse.json({ error: "Seu perfil já está verificado." }, { status: 400 });
  }

  if (!profile.email_confirmed_at) {
    return NextResponse.json(
      { error: "Confirme seu e-mail de cadastro antes de verificar seu perfil." },
      { status: 400 }
    );
  }

  const referenceUrls: string[] = [
    ...(profile.profile_photo ? [profile.profile_photo] : []),
    ...(profile.photos ?? []).map((p) => p.image_url),
  ];
  if (referenceUrls.length === 0) {
    return NextResponse.json(
      { error: "Adicione ao menos uma foto ao seu perfil antes de verificar." },
      { status: 400 }
    );
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase!
    .from("face_verification_attempts")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", profile.id)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_ATTEMPTS_PER_DAY) {
    return NextResponse.json(
      { error: "Você atingiu o limite de tentativas por hoje. Tente novamente amanhã." },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const selfieFile = formData.get("selfie");
  if (!(selfieFile instanceof File)) {
    return NextResponse.json({ error: "Envie uma foto de selfie." }, { status: 400 });
  }
  if (selfieFile.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "A selfie deve ter no máximo 8MB." }, { status: 400 });
  }

  const selfieBytes = new Uint8Array(await selfieFile.arrayBuffer());

  let referenceBytesList: Uint8Array[];
  try {
    referenceBytesList = await Promise.all(
      referenceUrls.map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("download failed");
        return new Uint8Array(await res.arrayBuffer());
      })
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar as fotos do seu perfil para comparar. Tente novamente." },
      { status: 500 }
    );
  }

  const { matched, similarity, noFaceDetected } = await verifyFaceAgainstProfile(
    selfieBytes,
    referenceBytesList
  );

  if (noFaceDetected) {
    return NextResponse.json({
      matched: false,
      error:
        "Não conseguimos identificar um rosto na selfie ou nas fotos do perfil. Tire a selfie com boa iluminação, rosto centralizado e sem óculos escuros, e confira se ao menos uma foto do perfil mostra seu rosto claramente.",
    });
  }

  const { error: rpcError } = await supabase!.rpc("record_face_verification_attempt", {
    p_professional_id: profile.id,
    p_matched: matched,
    p_similarity: similarity,
  });
  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 400 });

  if (!matched) {
    return NextResponse.json({
      matched: false,
      similarity,
      error:
        "Não conseguimos confirmar que é você com certeza suficiente. Tire outra selfie com boa iluminação e o rosto bem visível, e tente de novo.",
    });
  }

  return NextResponse.json({ matched: true, similarity });
}
