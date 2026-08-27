import Image from "next/image";
import Link from "next/link";
import type { ProfessionalProfile } from "@/lib/types";
import { VerifiedBadge } from "./verified-badge";

function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 24 * 21;
}

export function ProfessionalCard({ professional }: { professional: ProfessionalProfile }) {
  const specialties = professional.categories.slice(0, 3);

  return (
    <Link
      href={`/perfil/${professional.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-lg)] bg-surface card-shadow border border-border transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-beige-soft">
        {professional.profilePhoto && (
          <Image
            src={professional.profilePhoto}
            alt={professional.professionalName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {professional.verificationStatus === "verified" && <VerifiedBadge />}
          {isNew(professional.createdAt) && (
            <span className="inline-flex w-fit items-center rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-primary">
              Novo
            </span>
          )}
        </div>
        {professional.isFeatured && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
            Destaque
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg text-foreground leading-tight">
          {professional.professionalName}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {specialties.map((s) => s.name).join(" • ")}
        </p>
        <p className="mt-2 flex items-center gap-1 text-sm text-foreground/80">
          <span aria-hidden>📍</span>
          {professional.city.name} — {professional.neighborhood}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {professional.description}
        </p>
        <span className="mt-4 inline-flex items-center text-sm font-medium text-primary group-hover:underline">
          Ver perfil →
        </span>
      </div>
    </Link>
  );
}
