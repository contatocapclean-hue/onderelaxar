"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "or_age_confirmed";

// localStorage não dispara evento na própria aba (só em outras abas), e a
// gente não precisa reagir a mudanças externas aqui — só ler o valor uma
// vez por render. Um "subscribe" vazio é o jeito certo de usar
// useSyncExternalStore nesse caso.
function subscribe() {
  return () => {};
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // localStorage indisponível (ex.: modo privado/navegador restrito) — não
    // vale a pena travar o acesso por causa disso.
    return true;
  }
}

function getServerSnapshot() {
  // No servidor não dá pra saber se a pessoa já confirmou antes, então
  // usamos "confirmado" aqui só pra o HTML inicial bater com o primeiro
  // render do cliente (evita erro de hidratação) — o valor real vem de
  // getSnapshot assim que roda no navegador, exibindo o aviso se preciso.
  return true;
}

/** Aviso de conteúdo adulto: bloqueia a navegação até a pessoa confirmar que
 * é maior de 18 anos. A confirmação fica salva no localStorage do próprio
 * navegador, então não pergunta de novo a cada página — só volta a aparecer
 * se a pessoa limpar os dados do site, usar outro navegador ou dispositivo. */
export function AgeGate() {
  const storedConfirmed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Evita reler o localStorage só pra fechar o aviso depois de confirmar —
  // o clique já garante que, nesta visita, não precisa mostrar de novo.
  const [justConfirmed, setJustConfirmed] = useState(false);
  const confirmed = storedConfirmed || justConfirmed;

  if (confirmed) return null;

  function confirm() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Sem localStorage não dá pra lembrar a escolha da próxima vez, mas o
      // estado abaixo já garante que não aparece de novo nesta visita.
    }
    setJustConfirmed(true);
  }

  function leave() {
    window.location.href = "https://www.google.com";
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] bg-surface p-6 text-center card-shadow">
        <h2 className="font-display text-xl text-foreground">Conteúdo para maiores de 18 anos</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          O Onde Relaxar reúne anúncios de profissionais de massagem e pode conter fotos e descrições voltadas a um
          público adulto. Ao continuar, você confirma que tem 18 anos ou mais.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={confirm}
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Sim, sou maior de 18 anos
          </button>
          <button
            onClick={leave}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-beige-soft"
          >
            Não, sair do site
          </button>
        </div>
      </div>
    </div>
  );
}
