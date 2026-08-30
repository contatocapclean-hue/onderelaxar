import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Onde Relaxar coleta, usa e protege dados pessoais, em conformidade com a LGPD.",
  alternates: { canonical: "/privacidade" },
};

const UPDATED_AT = "27 de agosto de 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-2 font-display text-lg text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

/** Política de Privacidade — mesma observação do /termos: é um ponto de
 * partida alinhado à LGPD (Lei 13.709/2018), cobrindo especificamente os
 * dados sensíveis (biometria facial na verificação) e os terceiros que já
 * processam dados na plataforma hoje (Supabase, AWS Rekognition, Mercado
 * Pago, Vercel). Revisão jurídica é recomendada antes de tratar como
 * documento definitivo. */
export default function PrivacidadePage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Onde Relaxar</p>
        <h1 className="mt-1 font-display text-3xl text-foreground">Política de Privacidade</h1>
        <p className="mt-2 text-xs text-muted-foreground">Última atualização: {UPDATED_AT}</p>

        <Section title="1. Quem trata seus dados">
          <p>
            O Onde Relaxar ({"\""}nós{"\""}) é o controlador dos dados pessoais tratados na Plataforma, nos termos
            da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>
        </Section>

        <Section title="2. Quais dados coletamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="text-foreground">Dados de cadastro:</span> nome, e-mail, telefone e cidade/bairro.
            </li>
            <li>
              <span className="text-foreground">Dados de perfil profissional:</span> fotos, descrição, categorias
              de serviço, forma de atendimento e demais informações que a profissional optar por publicar.
            </li>
            <li>
              <span className="text-foreground">Dados biométricos (dado sensível):</span> quando a profissional
              opta pela verificação de perfil, coletamos uma foto usada exclusivamente para comparação facial
              automatizada com as fotos do perfil.
            </li>
            <li>
              <span className="text-foreground">Dados de pagamento:</span> processados pelo Mercado Pago para
              depósitos via Pix. Não temos acesso nem armazenamos dados completos de instrumentos de pagamento.
            </li>
            <li>
              <span className="text-foreground">Dados de navegação:</span> endereço IP, cookies essenciais de
              sessão e contadores de visualização de perfil, usados para estatísticas e segurança.
            </li>
          </ul>
        </Section>

        <Section title="3. Para que usamos esses dados">
          <ul className="list-disc space-y-1 pl-5">
            <li>Viabilizar a criação e exibição do perfil profissional (execução de contrato);</li>
            <li>Verificar a identidade de profissionais que optarem pela verificação (consentimento);</li>
            <li>Processar depósitos, destaques e stories pagos (execução de contrato);</li>
            <li>Prevenir fraude, perfis falsos e uso indevido da Plataforma (legítimo interesse);</li>
            <li>Cumprir obrigações legais e responder a autoridades competentes, quando exigido.</li>
          </ul>
          <p>
            Os dados biométricos usados na verificação são tratados apenas com o consentimento específico da
            profissional no momento em que ela inicia o processo, e usados exclusivamente para essa finalidade.
          </p>
        </Section>

        <Section title="4. Com quem compartilhamos dados">
          <p>Usamos os seguintes prestadores de serviço (operadores) para viabilizar a Plataforma:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="text-foreground">Supabase</span> — banco de dados, autenticação e armazenamento de
              arquivos;
            </li>
            <li>
              <span className="text-foreground">Amazon Web Services (Rekognition)</span> — comparação facial no
              processo de verificação de perfil;
            </li>
            <li>
              <span className="text-foreground">Mercado Pago</span> — processamento de pagamentos via Pix;
            </li>
            <li>
              <span className="text-foreground">Vercel</span> — hospedagem da aplicação.
            </li>
          </ul>
          <p>
            Não vendemos dados pessoais a terceiros. Só compartilhamos dados fora dessa lista quando exigido por
            lei, ordem judicial ou para exercer defesa em processos.
          </p>
        </Section>

        <Section title="5. Por quanto tempo guardamos os dados">
          <p>
            Mantemos os dados enquanto a conta estiver ativa. Após a exclusão de uma conta, mantemos apenas o que
            for necessário para cumprir obrigações legais (por exemplo, registros fiscais de pagamentos) pelo prazo
            exigido em lei, e então eliminamos os dados de forma segura. A foto usada na verificação facial não é
            retida além do tempo necessário para concluir a checagem.
          </p>
        </Section>

        <Section title="6. Seus direitos">
          <p>Nos termos da LGPD, você pode solicitar a qualquer momento:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Confirmação de que tratamos seus dados, e acesso a eles;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
            <li>Portabilidade dos dados a outro fornecedor;</li>
            <li>Eliminação dos dados tratados com base no seu consentimento;</li>
            <li>Revogação do consentimento, a qualquer momento;</li>
            <li>Informação sobre com quem compartilhamos seus dados.</li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos, entre em contato pelo e-mail informado ao final desta
            página.
          </p>
        </Section>

        <Section title="7. Segurança">
          <p>
            Adotamos medidas técnicas e administrativas razoáveis para proteger os dados pessoais contra acessos
            não autorizados e situações acidentais ou ilícitas de destruição, perda, alteração ou vazamento. Nenhum
            sistema é 100% livre de risco; caso identifiquemos um incidente de segurança relevante, comunicaremos
            os titulares afetados e a Autoridade Nacional de Proteção de Dados (ANPD) conforme exigido em lei.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Usamos cookies essenciais para manter sua sessão de login e o funcionamento básico da Plataforma. Não
            usamos cookies de publicidade de terceiros.
          </p>
        </Section>

        <Section title="9. Menores de idade">
          <p>
            A Plataforma é destinada exclusivamente a maiores de 18 anos. Não coletamos intencionalmente dados de
            menores de idade e removemos qualquer conta identificada como pertencente a um menor assim que
            tomamos conhecimento.
          </p>
        </Section>

        <Section title="10. Alterações desta política">
          <p>
            Podemos atualizar esta Política periodicamente. A data no topo desta página indica a versão mais
            recente. Mudanças relevantes serão comunicadas na Plataforma.
          </p>
        </Section>

        <Section title="11. Contato">
          <p>
            Para exercer seus direitos como titular de dados ou tirar dúvidas sobre esta Política, entre em
            contato pelo e-mail{" "}
            <a href="mailto:contato@onderelaxar.com.br" className="underline hover:text-primary">
              contato@onderelaxar.com.br
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
