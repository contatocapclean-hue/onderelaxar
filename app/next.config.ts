import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    // 60/65/70 usados nas miniaturas e cards de listagem (fotos menores,
    // onde uma qualidade um pouco menor não é perceptível e reduz o peso
    // baixado); 75 é o padrão do Next, mantido para a foto principal do
    // perfil e do lightbox.
    qualities: [60, 65, 70, 75],
  },
};

export default nextConfig;
