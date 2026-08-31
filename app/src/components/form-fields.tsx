import type { Visibility } from "@/lib/types";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export function ContactField({
  label,
  value,
  onChange,
  visibility,
  onVisibility,
  placeholder,
  visibilityLocked,
  lockedHint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visibility: Visibility;
  onVisibility: (v: Visibility) => void;
  placeholder?: string;
  /** Quando true, esconde o seletor de visibilidade e mostra `lockedHint` no
   * lugar — usado para o WhatsApp, que sempre é exibido publicamente (é o
   * canal de contato principal da plataforma, não faz sentido a pessoa
   * conseguir escondê-lo). O valor de `visibility` continua sendo "public"
   * por baixo, só não fica editável. */
  visibilityLocked?: boolean;
  lockedHint?: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
      <Field label={label}>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
      </Field>
      {visibilityLocked ? (
        <p className="text-xs text-muted-foreground sm:w-48 sm:text-right">{lockedHint ?? "Sempre visível"}</p>
      ) : (
        <select value={visibility} onChange={(e) => onVisibility(e.target.value as Visibility)} className="input sm:w-48">
          <option value="public">Exibir publicamente</option>
          <option value="on_request">Exibir após clicar em contato</option>
          <option value="hidden">Não exibir</option>
        </select>
      )}
    </div>
  );
}
