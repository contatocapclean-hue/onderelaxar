/**
 * Encolhe as fotos que JÁ ESTÃO salvas no Supabase Storage (não mexe em
 * fotos novas — essas já são comprimidas no navegador antes do upload, veja
 * src/lib/image-compress.ts). Existiam fotos de até 20+ MB (originais de
 * câmera ou geradas por IA em altíssima resolução) sendo servidas sem
 * nenhuma compressão depois que a otimização de imagem do Vercel foi
 * desligada — isso estourou a cota de "Cached Egress" do Supabase.
 *
 * O script:
 *  1. Lê no banco todas as URLs de foto realmente usadas no site (tabelas
 *     photos, professional_profiles, stories, site_settings).
 *  2. Baixa cada uma, e se for maior que 400 KB, redimensiona (máx. 1920px
 *     no lado maior) e reencoda como JPEG qualidade 82.
 *  3. Sobrescreve o mesmo arquivo no Storage (mesma URL) — nada no site
 *     precisa mudar, os links continuam os mesmos.
 *
 * Requer SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL no ambiente
 * (mesmas variáveis do scripts/seed.mjs) e o pacote "sharp" instalado
 * (rode `npm install sharp` antes, se ainda não tiver).
 *
 * Uso: node scripts/shrink-existing-photos.mjs
 *      node scripts/shrink-existing-photos.mjs --dry-run   (só mostra o que faria, não altera nada)
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 82;
const SKIP_IF_UNDER_BYTES = 400 * 1024;

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function parseStorageUrl(u) {
  const match = u.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: decodeURIComponent(match[2]) };
}

async function collectUrls() {
  const urls = new Set();

  const { data: photos, error: photosErr } = await supabase.from("photos").select("image_url");
  if (photosErr) throw photosErr;
  photos?.forEach((p) => p.image_url && urls.add(p.image_url));

  const { data: profiles, error: profilesErr } = await supabase
    .from("professional_profiles")
    .select("cover_photo, profile_photo");
  if (profilesErr) throw profilesErr;
  profiles?.forEach((p) => {
    if (p.cover_photo) urls.add(p.cover_photo);
    if (p.profile_photo) urls.add(p.profile_photo);
  });

  const { data: stories, error: storiesErr } = await supabase.from("stories").select("media_url, media_type");
  if (storiesErr) throw storiesErr;
  stories?.forEach((s) => {
    if (s.media_type === "image" && s.media_url) urls.add(s.media_url);
  });

  const { data: settings, error: settingsErr } = await supabase
    .from("site_settings")
    .select("system_story_media_url, system_story_media_type, featured_example_photo_url")
    .eq("id", 1)
    .single();
  if (settingsErr) throw settingsErr;
  if (settings?.system_story_media_type === "image" && settings.system_story_media_url) {
    urls.add(settings.system_story_media_url);
  }
  if (settings?.featured_example_photo_url) urls.add(settings.featured_example_photo_url);

  return [...urls];
}

async function shrinkOne(u) {
  const parsed = parseStorageUrl(u);
  if (!parsed) return { url: u, skipped: "não é uma URL do Supabase Storage" };

  const res = await fetch(u);
  if (!res.ok) return { url: u, skipped: `falha ao baixar (${res.status})` };
  const contentType = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());

  if (!contentType.startsWith("image/") || contentType.includes("gif") || contentType.includes("svg")) {
    return { url: u, skipped: `tipo não redimensionável (${contentType})`, bytes: buf.length };
  }
  if (buf.length <= SKIP_IF_UNDER_BYTES) {
    return { url: u, skipped: "já é pequena", bytes: buf.length };
  }

  const resized = await sharp(buf)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  if (resized.length >= buf.length) {
    return { url: u, skipped: "versão comprimida não ficou menor", bytes: buf.length };
  }

  if (DRY_RUN) {
    return { url: u, before: buf.length, after: resized.length, dryRun: true };
  }

  const { error: uploadError } = await supabase.storage
    .from(parsed.bucket)
    .upload(parsed.path, resized, { contentType: "image/jpeg", upsert: true });
  if (uploadError) return { url: u, error: uploadError.message };

  return { url: u, before: buf.length, after: resized.length };
}

function fmtMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

async function main() {
  console.log(DRY_RUN ? "Modo simulação (--dry-run): nada será alterado.\n" : "Modo real: as fotos grandes serão sobrescritas por versões menores.\n");

  const urls = await collectUrls();
  console.log(`${urls.length} fotos referenciadas no banco.\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let changed = 0;
  let errors = 0;

  for (const u of urls) {
    const r = await shrinkOne(u);
    if (r.error) {
      errors++;
      console.log(`ERRO   ${r.error}  ${u}`);
    } else if (r.before !== undefined) {
      changed++;
      totalBefore += r.before;
      totalAfter += r.after;
      console.log(`${r.dryRun ? "FARIA " : "OK    "} ${fmtMB(r.before)} -> ${fmtMB(r.after)}  ${u}`);
    } else {
      console.log(`--    ${r.skipped}  ${u}`);
    }
  }

  console.log(`\n${changed} fotos ${DRY_RUN ? "seriam reduzidas" : "reduzidas"}, ${errors} erros.`);
  if (changed > 0) {
    console.log(`Tamanho: ${fmtMB(totalBefore)} -> ${fmtMB(totalAfter)} (economia de ${fmtMB(totalBefore - totalAfter)}).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
