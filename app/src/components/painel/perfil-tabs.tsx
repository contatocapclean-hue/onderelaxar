"use client";

import { useState } from "react";
import { PerfilForm } from "./perfil-form";
import { FotosForm } from "./fotos-form";
import { ServicosForm } from "./servicos-form";
import { LocalForm } from "./local-form";
import { ContatosForm } from "./contatos-form";
import type { City, ProfessionalProfile, ServiceCategory } from "@/lib/types";

const TABS = [
  { key: "dados", label: "Dados" },
  { key: "fotos", label: "Fotos" },
  { key: "servicos", label: "Serviços" },
  { key: "local", label: "Local de atendimento" },
  { key: "contato", label: "Contato" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isTabKey(value: string | undefined): value is TabKey {
  return TABS.some((t) => t.key === value);
}

export function PerfilTabs({
  profile,
  cities,
  categories,
  initialTab,
}: {
  profile: ProfessionalProfile;
  cities: City[];
  categories: ServiceCategory[];
  initialTab?: string;
}) {
  const [active, setActive] = useState<TabKey>(isTabKey(initialTab) ? initialTab : "dados");

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active === tab.key
                ? "bg-primary text-primary-foreground"
                : "border border-border text-foreground/80 hover:bg-beige-soft"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cada formulário fica sempre montado (só escondido com CSS) para não
       * perder dados digitados ao trocar de sub-aba antes de salvar. */}
      <div className={active === "dados" ? "" : "hidden"}>
        <PerfilForm profile={profile} cities={cities} />
      </div>
      <div className={active === "fotos" ? "" : "hidden"}>
        <FotosForm profile={profile} />
      </div>
      <div className={active === "servicos" ? "" : "hidden"}>
        <ServicosForm profile={profile} categories={categories} />
      </div>
      <div className={active === "local" ? "" : "hidden"}>
        <LocalForm profile={profile} />
      </div>
      <div className={active === "contato" ? "" : "hidden"}>
        <ContatosForm profile={profile} />
      </div>
    </div>
  );
}
