import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso da plataforma Onde Relaxar.",
  alternates: { canonical: "/termos" },
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

/** Termos de Uso — página estática, sem dependência do Supabase (não precisa
 * de dynamic rendering). Conteúdo é um ponto de partida com boas práticas
 * para um diretório/marketplace que conecta clientes a profissionais
 * autônomos; recomenda-se revisão por um advogado antes de tratar como
 * documento definitivo, especialmente pelas cláusulas de pagamento e dados
 * biométricos (ver Política de Privacidade). */
export default function TermosPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Onde Relaxar</p>
        <h1 className="mt-1 font-display text-3xl text-foreground">Termos de Uso</h1>
        <p className="mt-2 text-xs text-muted-foreground">Última atualização: {UPDATED_AT}</p>

        <Section title="1. Aceitação">
          <p>
            Ao acessar ou usar o Onde Relaxar ({"\""}Plataforma{"\""}), você concorda com estes Termos de Uso. Se
            você não concordar com algum ponto, pedimos que não utilize a Plataforma.
          </p>
        </Section>

        <Section title="2. O que é o Onde Relaxar">
          <p>
            O Onde Relaxar é um diretório online que conecta pessoas interessadas em serviços de massagem a
            profissionais autônomos que divulgam seus atendimentos na Plataforma. Nós não empregamos, não
            supervisionamos e não somos parte na relação entre cliente e profissional — nosso papel é oferecer a
            vitrine e os meios de contato e pagamento das funcionalidades pagas descritas abaixo.
          </p>
          <p>
            A contratação de qualquer serviço anunciado é feita diretamente entre cliente e profissional, por sua
            conta e risco.
          </p>
        </Section>

        <Section title="3. Cadastro">
          <p>
            Para criar um perfil profissional ou avaliar um profissional é necessário ter 18 anos ou mais e
            fornecer informações verídicas. Você é responsável por manter seus dados de acesso em sigilo e por
            tudo o que acontecer através da sua conta.
          </p>
          <p>
            Reservamo-nos o direito de suspender ou excluir contas com informações falsas, incompletas ou que
            violem estes Termos.
          </p>
        </Section>

        <Section title="4. Verificação de perfil">
          <p>
            Para reduzir perfis falsos, oferecemos um processo de verificação que compara uma foto enviada pela
            profissional com as fotos do perfil, usando reconhecimento facial automatizado. Esse processo é
            opcional e o tratamento desses dados está descrito na nossa{" "}
            <a href="/privacidade" className="underline hover:text-primary">
              Política de Privacidade
            </a>
            .
          </p>
        </Section>

        <Section title="5. Conduta e conteúdo proibido">
          <p>É proibido usar a Plataforma para, entre outras coisas:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Anunciar ou facilitar qualquer atividade ilegal perante a legislação brasileira;</li>
            <li>Publicar conteúdo envolvendo menores de idade, exploração sexual ou aliciamento, sob qualquer forma;</li>
            <li>Se passar por outra pessoa, ou publicar fotos e informações de terceiros sem autorização;</li>
            <li>Publicar conteúdo ofensivo, discriminatório, difamatório ou fraudulento;</li>
            <li>Tentar contornar a verificação de identidade ou os mecanismos de pagamento da Plataforma.</li>
          </ul>
          <p>
            Podemos remover conteúdo, suspender ou excluir perfis que violem esta seção a qualquer momento, com ou
            sem aviso prévio, e comunicar autoridades competentes quando exigido por lei.
          </p>
        </Section>

        <Section title="6. Funcionalidades pagas e carteira">
          <p>
            Profissionais podem contratar funcionalidades pagas, como destaque de perfil e publicação de stories.
            Os pagamentos são feitos via Pix, processados por um parceiro de pagamentos (Mercado Pago), e o saldo
            fica disponível em uma carteira dentro do painel da profissional.
          </p>
          <p>
            Depósitos já convertidos em saldo utilizado (por exemplo, um destaque já ativado ou um story já
            publicado) não são reembolsáveis, exceto quando exigido pela legislação de defesa do consumidor. Saldo
            ainda não utilizado pode ter reembolso solicitado através dos nossos canais de contato.
          </p>
        </Section>

        <Section title="7. Avaliações">
          <p>
            Avaliações devem refletir uma experiência real e não podem conter ofensas, discurso de ódio ou
            informações falsas. Avaliações que violem esta regra podem ser removidas mediante denúncia ou por
            iniciativa nossa.
          </p>
        </Section>

        <Section title="8. Denúncias">
          <p>
            Qualquer usuário pode denunciar um perfil, foto, story ou avaliação que viole estes Termos. Analisamos
            as denúncias recebidas e podemos remover conteúdo ou suspender contas quando cabível.
          </p>
        </Section>

        <Section title="9. Limitação de responsabilidade">
          <p>
            A Plataforma é fornecida {"\""}como está{"\""}. Não garantimos a exatidão das informações publicadas
            pelos profissionais, nem a qualidade, legalidade, segurança ou resultado de qualquer serviço contratado
            fora da Plataforma. Na máxima extensão permitida pela lei, não nos responsabilizamos por danos
            decorrentes do contato ou contratação entre usuários.
          </p>
        </Section>

        <Section title="10. Propriedade intelectual">
          <p>
            A marca, o layout e o código da Plataforma pertencem ao Onde Relaxar. O conteúdo publicado por cada
            profissional (fotos, descrições, stories) permanece de titularidade de quem o publicou, que concede à
            Plataforma uma licença para exibi-lo enquanto o perfil estiver ativo.
          </p>
        </Section>

        <Section title="11. Alterações destes Termos">
          <p>
            Podemos atualizar estes Termos periodicamente. Mudanças relevantes serão comunicadas na Plataforma. O
            uso continuado após uma atualização implica concordância com a nova versão.
          </p>
        </Section>

        <Section title="12. Legislação aplicável">
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil, sendo competente o foro do
            domicílio do usuário para dirimir eventuais controvérsias, conforme o Código de Defesa do Consumidor.
          </p>
        </Section>

        <Section title="13. Contato">
          <p>
            Dúvidas sobre estes Termos podem ser enviadas para{" "}
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
