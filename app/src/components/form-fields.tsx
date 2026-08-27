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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visibility: Visibility;
  onVisibility: (v: Visibility) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
      <Field label={label}>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
      </Field>
      <select value={visibility} onChange={(e) => onVisibility(e.target.value as Visibility)} className="input sm:w-48">
        <option value="public">Exibir publicamente</option>
        <option value="on_request">Exibir após clicar em contato</option>
        <option value="hidden">Não exibir</option>
      </select>
    </div>
  );
}
