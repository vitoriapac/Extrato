import { render } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import {
  FREE_TIER_LIMITS,
  PRICING_PLANS,
  PRO_TIER_LIMITS,
  type BillingCycle,
} from './domain/billing/entitlements.js';
import { Badge } from './ui/primitives/badge.js';
import { Button } from './ui/primitives/button.js';
import { Icon } from './ui/primitives/icon.js';

const situations = [
  {
    title: 'Saiba por onde começar',
    text: 'Veja a próxima atividade do plano, o tempo previsto e as pendências do dia.',
    image: '/assets/landing/demo-proxima-acao.png',
    alt: 'Próxima ação e execução de hoje na Visão geral',
  },
  {
    title: 'Ajuste a semana com segurança',
    text: 'Confira uma prévia de recuperação e escolha se deseja aplicar a mudança ao planejamento.',
    image: '/assets/landing/demo-previa-recuperacao.png',
    alt: 'Prévia do plano de recuperação com mudanças e capacidade preservada',
  },
  {
    title: 'Entenda sua evolução',
    text: 'Acompanhe o período, a evidência disponível e os limites das análises.',
    image: '/assets/landing/demo-desempenho.png',
    alt: 'Resumo de desempenho com evolução, prontidão e dados do período',
  },
];

const questions = [
  {
    title: 'Preciso ter um edital escolhido?',
    text: 'Você pode cadastrar suas matérias manualmente e definir a data da prova quando souber o prazo.',
  },
  {
    title: 'Posso conhecer antes de cadastrar meus dados?',
    text: 'Sim. Ao abrir o aplicativo pela primeira vez, você pode escolher a demonstração. Ela usa dados fictícios e fica separada dos seus registros.',
  },
  {
    title: 'Onde ficam meus registros?',
    text: 'Seus dados ficam neste navegador. Você pode exportar um backup para guardar uma cópia ou transferir seus registros.',
  },
];

const pageWidth = 'mx-auto w-full max-w-[1280px] px-4 sm:px-8';
const primaryLink =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-6 font-semibold text-primary-contrast no-underline transition-colors hover:bg-brand-secondary motion-reduce:transition-none';
const navLink =
  'inline-flex min-h-touch items-center px-2 text-content-secondary no-underline hover:text-brand hover:underline underline-offset-4';
const sectionTitle =
  'm-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] tracking-[-0.025em] text-brand';

function StudyPreview() {
  return (
    <figure
      id="painel"
      class="m-0 min-w-0 rounded-default border border-border-default bg-surface-card p-3 sm:p-4"
    >
      <figcaption class="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-brand">
        Visão geral do Extrato <Badge variant="info">Dados fictícios da demonstração</Badge>
      </figcaption>
      <a
        href="/assets/landing/demo-proxima-acao.png"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ampliar imagem da Visão geral (abre em nova aba)"
        class="block rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <img
          src="/assets/landing/demo-proxima-acao.png"
          alt="Visão geral com próxima ação, tempo planejado e revisões"
          width="1216"
          height="689"
          class="block h-auto w-full rounded"
        />
      </a>
      <p class="mt-2 mb-0 text-sm text-content-secondary">
        Toque ou clique na imagem para ampliar.
      </p>
    </figure>
  );
}

function LandingPricing() {
  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const offer = PRICING_PLANS[cycle];

  return (
    <section
      id="precos"
      aria-labelledby="pricing-title"
      class="border-b border-border-default bg-surface-page"
    >
      <div class={`${pageWidth} py-12 sm:py-20`}>
        <div class="mx-auto max-w-xl text-center">
          <h2 id="pricing-title" class={sectionTitle}>
            Planos e preços
          </h2>
          <p class="mt-3 mb-0 text-content-secondary">
            O plano gratuito já está disponível. Veja também os valores previstos para o Pro.
          </p>
          <div
            role="group"
            aria-label="Ciclo do plano Pro"
            class="mt-6 inline-flex gap-1 rounded-default border border-border-default bg-surface-card p-1"
          >
            {(['monthly', 'annual'] as const).map(option => (
              <Button
                key={option}
                variant={option === cycle ? 'tonal' : 'ghost'}
                size="touch"
                aria-pressed={option === cycle}
                aria-controls="pro-price"
                onClick={() => setCycle(option)}
                className="min-h-touch border-transparent px-4"
              >
                {option === 'monthly' ? 'Mensal' : 'Anual'}
              </Button>
            ))}
          </div>
        </div>
        <div class="mx-auto mt-6 grid max-w-[920px] gap-4 sm:grid-cols-2">
          <article class="flex flex-col rounded-default border border-border-default bg-surface-card p-6 sm:p-8">
            <h3 class="m-0 font-display text-2xl text-brand">Gratuito</h3>
            <p class="mt-2 mb-0 text-content-secondary">
              Para organizar seus estudos no navegador.
            </p>
            <p class="mt-6 mb-0 flex items-baseline gap-2">
              <strong class="font-display text-4xl leading-none text-brand">R$ 0</strong>
              <span class="text-sm text-content-secondary">sem cadastro</span>
            </p>
            <ul class="my-6 list-none space-y-3 border-t border-border-default p-0 pt-6">
              <li class="flex gap-2">
                <Icon name="check" size={18} class="mt-1 shrink-0 text-accent" />{' '}
                <span>
                  Até {FREE_TIER_LIMITS.maxActiveSubjects} disciplinas e{' '}
                  {FREE_TIER_LIMITS.maxActiveExams} concurso ativo
                </span>
              </li>
              <li class="flex gap-2">
                <Icon name="check" size={18} class="mt-1 shrink-0 text-accent" /> Planejamento
                semanal e cronômetro de estudo
              </li>
              <li class="flex gap-2">
                <Icon name="check" size={18} class="mt-1 shrink-0 text-accent" />{' '}
                <span>
                  Caderno de erros com até {FREE_TIER_LIMITS.maxErrorFlashcards} flashcards
                </span>
              </li>
            </ul>
            <a href="/app" class={`${primaryLink} mt-auto self-start`}>
              Começar no gratuito <Icon name="arrow-right" size={18} />
            </a>
          </article>
          <article class="rounded-default border border-border-default bg-surface-subtle p-6 sm:p-8">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="m-0 font-display text-2xl text-brand">Pro</h3>
              <Badge variant="info">Em preparação</Badge>
            </div>
            <p class="mt-2 mb-0 text-content-secondary">
              Para editais maiores e análises avançadas.
            </p>
            <div id="pro-price" aria-live="polite" aria-atomic="true">
              <p class="mt-6 mb-0 flex flex-wrap items-baseline gap-2">
                <strong class="font-display text-4xl leading-none text-brand">
                  {offer.monthlyEquivalentFormatted}
                </strong>
                <span class="text-sm text-content-secondary">/ mês</span>
              </p>
              <p class="mt-2 mb-0 text-sm text-content-secondary">
                {cycle === 'annual'
                  ? `${offer.priceFormatted} por ano à vista no Pix`
                  : 'Cobrança mensal via Pix'}
              </p>
            </div>
            <ul
              aria-label="Recursos previstos para o Pro"
              class="mt-6 mb-0 list-none space-y-3 border-t border-border-default p-0 pt-6"
            >
              <li class="flex gap-2">
                <Icon name="check" size={18} class="mt-1 shrink-0 text-accent" />{' '}
                <span>
                  Até {PRO_TIER_LIMITS.maxActiveSubjects} disciplinas e{' '}
                  {PRO_TIER_LIMITS.maxActiveExams} concursos ativos
                </span>
              </li>
              <li class="flex gap-2">
                <Icon name="check" size={18} class="mt-1 shrink-0 text-accent" /> Importação de
                questões por CSV
              </li>
              <li class="flex gap-2">
                <Icon name="check" size={18} class="mt-1 shrink-0 text-accent" /> Simulador de
                cenários e relatório estratégico
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

function FooterWordmark() {
  const boxRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const brand = 'Extrato de Estudos';

  useLayoutEffect(() => {
    const box = boxRef.current;
    const ruler = rulerRef.current;
    if (!box || !ruler) return;

    const fit = () => {
      const width = ruler.getBoundingClientRect().width;
      if (width > 0)
        box.style.setProperty('--wordmark-size', `${(box.clientWidth / (width + 4)) * 100}px`);
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(box);
    resize.observe(ruler);

    const reveal = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.25) return;
        box.dataset.reveal = 'shown';
        reveal.disconnect();
      },
      { threshold: 0.25 }
    );
    box.dataset.reveal = 'pending';
    reveal.observe(box);

    return () => {
      resize.disconnect();
      reveal.disconnect();
    };
  }, []);

  return (
    <div
      ref={boxRef}
      class="landing-wordmark font-display font-semibold text-brand"
      aria-hidden="true"
      onPointerMove={event => {
        if (event.pointerType === 'touch') return;
        const box = event.currentTarget;
        const bounds = box.getBoundingClientRect();
        box.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`);
        box.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`);
      }}
    >
      <span ref={rulerRef} class="landing-wordmark-ruler">
        {brand}
      </span>
      <div class="landing-wordmark-rise">
        <span class="landing-wordmark-ink">{brand}</span>
        <span class="landing-wordmark-light">{brand}</span>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div id="inicio" class="min-h-screen bg-surface-card font-body text-base text-content-primary">
      <a href="#conteudo" class="skip-link">
        Pular para o conteúdo
      </a>
      <div class="bg-surface-page">
        <header class={`${pageWidth} pt-3 sm:pt-6`}>
          <nav
            aria-label="Navegação principal"
            class="flex min-h-16 items-center justify-between gap-2 rounded-full border border-border-default bg-surface-card px-2 sm:gap-6 sm:px-4"
          >
            <a
              href="#inicio"
              class="inline-flex min-h-touch items-center gap-2 pl-1 font-display text-base font-semibold text-brand no-underline sm:text-lg"
            >
              <img
                src="/icons/app-icon.svg"
                alt=""
                width="32"
                height="32"
                class="size-8 shrink-0 rounded"
              />
              Extrato de Estudos
            </a>
            <div class="hidden items-center gap-4 md:flex">
              <a href="#painel" class={navLink}>
                Ver o painel
              </a>
              <a href="#como-funciona" class={navLink}>
                Como funciona
              </a>
              <a href="#precos" class={navLink}>
                Planos
              </a>
              <a href="#duvidas" class={navLink}>
                Dúvidas
              </a>
            </div>
            <a href="/app" class={`${primaryLink} shrink-0 min-h-touch! px-3! text-sm sm:px-6!`}>
              <span class="sm:hidden">Abrir app</span>
              <span class="hidden sm:inline">Abrir aplicativo</span>
              <Icon name="arrow-right" class="hidden sm:block" />
            </a>
          </nav>
        </header>
        <main id="conteudo" tabIndex={-1}>
          <section
            aria-labelledby="landing-title"
            class={`${pageWidth} pt-8 pb-8 sm:pt-12 sm:pb-12 lg:pt-16`}
          >
            <div class="mb-6 sm:mb-8">
              <h1
                id="landing-title"
                class="m-0 max-w-[20ch] font-display text-[clamp(2.5rem,6.1vw,5.25rem)] leading-[1.02] tracking-[-0.035em] text-brand"
              >
                Saiba o que estudar hoje.
              </h1>
              <p class="mt-4 mb-0 max-w-[53ch] text-base leading-relaxed text-content-secondary sm:text-lg">
                Planeje sua semana para o concurso, registre o que estudou e veja onde concentrar
                seu tempo.
              </p>
              <div class="mt-6 flex flex-wrap gap-2 sm:gap-3">
                <a href="/app" class={primaryLink}>
                  Começar grátis <Icon name="arrow-right" size={18} />
                </a>
                <a
                  href="#painel"
                  class="inline-flex min-h-12 items-center gap-2 rounded-full border border-border-default bg-surface-card px-4 font-semibold text-brand no-underline transition-colors hover:bg-surface-subtle motion-reduce:transition-none sm:px-6"
                >
                  Ver o painel <Icon name="chevron-down" />
                </a>
              </div>
            </div>
            <div class="grid items-stretch gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:gap-4">
              <StudyPreview />
              <figure class="relative m-0 min-h-[220px] overflow-hidden rounded-default bg-surface-subtle sm:min-h-[300px]">
                <img
                  src="/assets/landing/estudo-na-mesa.webp"
                  alt="Estudante com caderno aberto e notebook na mesa"
                  width="800"
                  height="1200"
                  fetchPriority="high"
                  class="absolute inset-0 size-full object-cover object-[50%_37%]"
                />
              </figure>
            </div>
          </section>
          <section id="como-funciona" class="border-y border-border-default bg-surface-card">
            <div class={`${pageWidth} py-12 sm:py-20`}>
              <h2 class={sectionTitle}>Seu estudo, com mais clareza.</h2>
              <p class="mt-3 mb-0 max-w-[60ch] text-content-secondary">
                Veja três momentos do aplicativo com dados fictícios da demonstração.
              </p>
              <div class="mt-8 grid gap-10">
                {situations.map(item => (
                  <article
                    key={item.title}
                    class="grid min-w-0 items-start gap-4 border-t border-border-default pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-10"
                  >
                    <div>
                      <h3 class="m-0 font-display text-xl text-brand">{item.title}</h3>
                      <p class="mt-2 mb-0 max-w-[50ch] text-content-secondary">{item.text}</p>
                    </div>
                    <a
                      href={item.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ampliar: ${item.alt} (abre em nova aba)`}
                      class="block rounded-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <img
                        src={item.image}
                        alt={item.alt}
                        loading="lazy"
                        decoding="async"
                        class="block h-auto max-w-full rounded-default border border-border-default"
                      />
                    </a>
                  </article>
                ))}
              </div>
            </div>
          </section>
          <LandingPricing />
          <section id="duvidas" class="bg-surface-card">
            <div
              class={`${pageWidth} grid gap-6 py-12 sm:py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]`}
            >
              <h2 class={sectionTitle}>Perguntas frequentes</h2>
              <div class="divide-y divide-border-default border-y border-border-default">
                {questions.map(item => (
                  <details key={item.title} class="group">
                    <summary class="flex min-h-touch sm:min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded py-3 text-brand hover:underline [&::-webkit-details-marker]:hidden">
                      {item.title}
                      <Icon
                        name="chevron-down"
                        size={18}
                        class="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                      />
                    </summary>
                    <p class="mt-0 mb-4 max-w-[60ch] text-content-secondary">{item.text}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
          <section class="bg-surface-card pb-8">
            <div class={pageWidth}>
              <div class="flex flex-wrap items-center justify-between gap-6 rounded-default bg-surface-subtle px-6 py-8 sm:px-10 sm:py-12">
                <div>
                  <h2 class={sectionTitle}>Monte sua primeira semana.</h2>
                  <p class="mt-3 mb-0 text-content-secondary">Comece no navegador, sem cadastro.</p>
                </div>
                <a href="/app" class={primaryLink}>
                  Começar grátis <Icon name="arrow-right" size={18} />
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
      <footer class="overflow-hidden border-t border-border-default bg-surface-subtle">
        <div class={`${pageWidth} pt-10 sm:pt-16`}>
          <div class="grid gap-6 pb-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-10 sm:pb-12">
            <div class="text-left">
              <a
                href="#inicio"
                class="inline-flex min-h-touch items-center gap-3 rounded font-display text-xl font-semibold text-brand no-underline"
              >
                <img
                  src="/icons/app-icon.svg"
                  alt=""
                  width="32"
                  height="32"
                  class="size-8 shrink-0 rounded"
                />
                Extrato de Estudos
              </a>
              <p class="mt-2 mb-0 text-content-secondary">Cada estudo soma.</p>
            </div>
            <nav
              aria-label="Navegação do rodapé"
              class="grid grid-cols-2 gap-x-3 text-sm sm:gap-x-8"
            >
              <div class="flex flex-col items-start">
                <p class="m-0 font-semibold text-brand">Produto</p>
                <a href="#como-funciona" class={`${navLink} px-0! min-w-touch justify-start`}>
                  Como funciona
                </a>
                <a href="#precos" class={`${navLink} px-0! min-w-touch justify-start`}>
                  Planos
                </a>
              </div>
              <div class="flex flex-col items-start">
                <p class="m-0 font-semibold text-brand">Acesso</p>
                <a href="/app" class={`${navLink} px-0! min-w-touch justify-start`}>
                  Abrir o app
                </a>
                <a href="#duvidas" class={`${navLink} px-0! min-w-touch justify-start`}>
                  Dúvidas
                </a>
              </div>
            </nav>
          </div>
          <div class="flex justify-end border-t border-border-default py-2 text-sm">
            <a href="#inicio" class={navLink}>
              Voltar ao topo <Icon name="chevron-up" class="ml-1" />
            </a>
          </div>
        </div>
        <div class="px-2 sm:px-4">
          <FooterWordmark />
        </div>
      </footer>
    </div>
  );
}

const legacyAppHashes = [
  '#hoje',
  '#questoes',
  '#agenda',
  '#disciplinas',
  '#dashboard',
  '#desempenho',
  '#metas',
  '#instrucoes',
];
if (
  window.matchMedia('(display-mode: standalone)').matches ||
  legacyAppHashes.includes(location.hash)
) {
  location.replace(`/app${location.search}${location.hash}`);
} else {
  const root = document.getElementById('landing-root');
  if (root) {
    root.textContent = '';
    render(<LandingPage />, root);
  }
}
