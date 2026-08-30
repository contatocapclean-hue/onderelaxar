import Image from "next/image";
import Link from "next/link";
import type { ProfessionalProfile } from "@/lib/types";
import { BLUR_DATA_URL } from "@/lib/utils";

/** Card compacto para a seção "Todas as outras profissionais" — mesmo
 * tamanho aproximado dos quadrados de categoria, bem menor que os cards de
 * destaque. */
export function ProfessionalMiniCard({ professional }: { professional: ProfessionalProfile }) {
  return (
    <Link
      href={`/perfil/${professional.slug}`}
      className="group flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-3 text-center card-shadow transition-transform hover:-translate-y-0.5"
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-[var(--radius-sm)] bg-beige-soft">
        {professional.profilePhoto && (
          <Image
            src={professional.profilePhoto}
            alt={professional.professionalName}
            fill
            loading="lazy"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            quality={65}
            sizes="(max-width: 640px) 30vw, (max-width: 1024px) 16vw, 10vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </span>
      <span className="line-clamp-1 text-xs font-medium text-foreground">
        {professional.professionalName}
      </span>
      <span className="line-clamp-1 text-[11px] text-muted-foreground">
        {professional.city.name}
      </span>
    </Link>
  );
}
