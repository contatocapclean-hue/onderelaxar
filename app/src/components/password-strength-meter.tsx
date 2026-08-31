import { passwordStrength } from "@/lib/utils";

const BAR_COLOR = ["bg-border", "bg-red-500", "bg-amber-500", "bg-amber-500", "bg-green-600"];
const LABEL_COLOR = ["text-muted-foreground", "text-red-600", "text-amber-700", "text-amber-700", "text-green-700"];

/** Indicador visual de força de senha (4 barrinhas + rótulo), usado no
 * cadastro. Não impede o envio do formulário mesmo com senha fraca — é só
 * um retorno visual pra pessoa escolher uma senha melhor, já que a regra
 * dura de mínimo continua sendo os 6 caracteres validados no submit. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const { score, label } = passwordStrength(password);

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? BAR_COLOR[score] : "bg-border"}`}
          />
        ))}
      </div>
      <p className={`mt-1 text-xs ${LABEL_COLOR[score]}`}>Força da senha: {label}</p>
    </div>
  );
}
