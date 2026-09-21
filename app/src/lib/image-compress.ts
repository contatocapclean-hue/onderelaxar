"use client";

// Redimensiona e comprime uma imagem no navegador antes do upload, pra não
// mandar pro Supabase Storage fotos de câmera/IA em resolução muito maior do
// que qualquer tela do site realmente exibe. Isso já causou um estouro real
// de cota de egress do Supabase: depois que desligamos a otimização de
// imagem do Vercel (que antes encolhia tudo escondido), uma única foto de
// capa de 21 MB passou a ser baixada, sem compressão nenhuma, em toda visita
// ao perfil. Comprimindo já no envio, o problema nem chega a acontecer,
// sem depender de cota ou plano pago de nenhum dos dois serviços.
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;
// Arquivos já pequenos passam direto — não vale a pena gastar tempo
// reprocessando o que já está num tamanho razoável.
const SKIP_IF_UNDER_BYTES = 400 * 1024;

export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // GIF perderia a animação ao passar por um canvas; SVG já é leve/vetorial.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size <= SKIP_IF_UNDER_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;
    // Em casos raros (ex.: PNG já pequeno e bem comprimido) a versão
    // reprocessada pode ficar maior — nesse caso mantém o arquivo original.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Formato não suportado pelo navegador ou qualquer outra falha: segue
    // com o arquivo original em vez de travar o upload.
    return file;
  }
}
