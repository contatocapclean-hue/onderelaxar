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
    // A otimização de imagem do Vercel (redimensionar/converter cada foto
    // sob demanda) tem uma cota mensal de transformações — e quando ela
    // estoura, QUALQUER combinação de imagem+tamanho ainda não processada
    // antes passa a retornar erro 402 (Payment Required) em vez da foto.
    // Fotos de profissionais recém-cadastradas são sempre "novas" pra essa
    // cota, então são as que mais aparecem quebradas quando isso acontece.
    // Desligamos a otimização e servimos as fotos como o Supabase já as
    // entrega (elas já vêm num tamanho razoável) — sem depender de cota ou
    // plano pago do Vercel para as fotos aparecerem.
    unoptimized: true,
  },
};

export default nextConfig;
