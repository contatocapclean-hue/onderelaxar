/**
 * Popula o Supabase com profissionais de exemplo (dados fictícios).
 * Requer SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL no ambiente.
 *
 * Uso: node scripts/seed.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar o seed.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const SAMPLE = [
  { name: "Mariana Silva", email: "mariana.silva.demo@example.com", city: "salvador-ba", neighborhood: "Pituba" },
  { name: "Camila Souza", email: "camila.souza.demo@example.com", city: "salvador-ba", neighborhood: "Barra" },
  { name: "Fernanda Alves", email: "fernanda.alves.demo@example.com", city: "feira-de-santana-ba", neighborhood: "Centro" },
  { name: "Beatriz Costa", email: "beatriz.costa.demo@example.com", city: "lauro-de-freitas-ba", neighborhood: "Itinga" },
];

function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const { data: cities } = await supabase.from("cities").select("id, slug");
  const { data: categories } = await supabase.from("service_categories").select("id, slug").limit(3);

  for (const person of SAMPLE) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: person.email,
      password: `Demo${Math.random().toString(36).slice(2, 10)}!`,
      email_confirm: true,
      user_metadata: { name: person.name },
    });

    if (createError) {
      console.error(`Erro ao criar usuário ${person.email}:`, createError.message);
      continue;
    }

    const city = cities.find((c) => c.slug === person.city);
    const slug = `${slugify(person.name)}-${created.user.id.slice(0, 6)}`;

    const { data: profile, error: profileError } = await supabase
      .from("professional_profiles")
      .insert({
        user_id: created.user.id,
        professional_name: person.name,
        slug,
        description: "Atendimento personalizado focado em relaxamento, bem-estar e qualidade de vida.",
        city_id: city?.id,
        neighborhood: person.neighborhood,
        attendance_type: "both",
        profile_status: "published",
        verification_status: "verified",
        is_featured: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error(`Erro ao criar perfil de ${person.name}:`, profileError.message);
      continue;
    }

    await supabase
      .from("professional_services")
      .insert(categories.map((c) => ({ professional_id: profile.id, category_id: c.id })));

    await supabase.from("contact_info").insert({
      professional_id: profile.id,
      whatsapp: "5571999990000",
      whatsapp_visibility: "on_request",
      instagram: `@${slugify(person.name)}`,
      instagram_visibility: "public",
    });

    console.log(`Criado: ${person.name} (${slug})`);
  }
}

main().then(() => process.exit(0));
