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
import { ColumnChart } from './ui/primitives/charts/charts.js';
import { Icon } from './ui/primitives/icon.js';

const weeks = [
  {
    name: 'Semana 01',
    adherence: '67%',
    duration: '4h 00min',
    subject: 'Língua Portuguesa',
    topic: 'Interpretação de texto',
    activity: [45, 30, 40, 25, 45, 55, 0],
  },
  {
    name: 'Semana 02',
    adherence: '86%',
    duration: '5h 10min',
    subject: 'Direito Administrativo',
    topic: 'Atos administrativos',
    activity: [35, 50, 40, 60, 45, 80, 0],
  },
];

const previewChartMax = Math.max(...weeks.flatMap(week => week.activity));
const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const steps = [
  {
    icon: 'list-check',
    title: 'Organize seu edital',
    text: 'Reúna as matérias e os tópicos que fazem parte da sua preparação.',
  },
  {
    icon: 'calendar',
    title: 'Monte uma semana possível',
    text: 'Informe quanto tempo você tem e confira a proposta de plano antes de salvar.',
  },
  {
    icon: 'chart-bar',
    title: 'Veja o que merece revisão',
    text: 'Registre sessões e questões para acompanhar seu desempenho por matéria.',
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
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand-primary px-5 font-semibold text-primary-contrast no-underline transition-colors hover:bg-brand-secondary motion-reduce:transition-none';
const navLink =
  'inline-flex min-h-[44px] items-center px-2 text-content-secondary no-underline hover:text-brand hover:underline underline-offset-4';
const sectionTitle =
  'm-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] tracking-[-0.025em] text-brand';

function StudyPreview() {
  const [activeWeek, setActiveWeek] = useState(1);
  const week = weeks[activeWeek];

  return (
    <section
      id="painel"
      aria-labelledby="preview-title"
      class="min-w-0 rounded-default bg-surface-subtle p-2 sm:p-3"
    >
      <div class="overflow-hidden rounded-default border border-border-default bg-surface-card">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border-default px-3 py-2 sm:px-5 sm:py-3">
          <h2
            id="preview-title"
            class="m-0 inline-flex items-center gap-2 font-display text-lg text-brand"
          >
            <Icon name="chart-bar" size={18} /> Visão geral
          </h2>
          <Badge variant="info">Dados fictícios</Badge>
        </div>
        <div class="p-3 sm:p-5">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 sm:mb-4">
            <h3 class="m-0 font-display text-xl text-brand">Seu extrato da semana</h3>
            <div role="group" aria-label="Semana do exemplo" class="flex gap-1">
              {weeks.map((item, index) => (
                <Button
                  key={item.name}
                  variant={index === activeWeek ? 'tonal' : 'ghost'}
                  size="touch"
                  aria-pressed={index === activeWeek}
                  aria-controls="preview-week"
                  onClick={() => setActiveWeek(index)}
                  className="min-h-[44px]! text-sm"
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
          <div id="preview-week" aria-live="polite">
            <dl class="m-0 grid grid-cols-2 gap-3 border-y border-border-default py-3 sm:gap-6">
              <div>
                <dt class="text-sm text-content-secondary">Tempo estudado</dt>
                <dd class="m-0 font-display text-2xl font-semibold text-brand sm:text-3xl">
                  {week.duration}
                </dd>
              </div>
              <div class="border-l border-border-default pl-3 sm:pl-6">
                <dt class="text-sm text-content-secondary">Aderência ao plano</dt>
                <dd class="m-0 font-display text-2xl font-semibold text-brand sm:text-3xl">
                  {week.adherence}
                </dd>
              </div>
            </dl>
            <div class="py-3 sm:py-4">
              <p class="m-0 mb-2 text-sm font-semibold text-content-secondary">
                Minutos de estudo por dia
              </p>
              <ColumnChart
                columns={week.activity.map((value, index) => ({
                  value,
                  title: `${weekdays[index]}: ${value} min`,
                  tone: index === 5 ? 'primary' : 'soft',
                }))}
                label={`Minutos estudados. ${week.activity.map((value, index) => `${weekdays[index]}: ${value}`).join(', ')}`}
                max={previewChartMax}
                height={64}
                className="h-14 sm:h-16"
              />
              <div
                aria-hidden="true"
                class="mt-1 grid grid-cols-7 text-center text-xs text-content-secondary"
              >
                {weekdays.map(day => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </div>
            <div class="flex items-center gap-3 rounded bg-surface-subtle px-3 py-2.5 sm:px-4">
              <Icon name="target" size={22} class="shrink-0 text-accent" />
              <div>
                <p class="m-0 text-xs font-semibold uppercase tracking-wide text-content-secondary">
                  Próxima atividade
                </p>
                <p class="m-0 font-semibold text-brand">{week.subject}</p>
                <p class="m-0 text-sm text-content-secondary">
                  {week.topic} · <span class="font-data">30 min</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
            class="mt-5 inline-flex gap-1 rounded-default border border-border-default bg-surface-card p-1"
          >
            {(['monthly', 'annual'] as const).map(option => (
              <Button
                key={option}
                variant={option === cycle ? 'tonal' : 'ghost'}
                size="touch"
                aria-pressed={option === cycle}
                aria-controls="pro-price"
                onClick={() => setCycle(option)}
                className="min-h-[44px]! border-transparent! px-4!"
              >
                {option === 'monthly' ? 'Mensal' : 'Anual'}
              </Button>
            ))}
          </div>
        </div>
        <div class="mx-auto mt-6 grid max-w-[920px] gap-4 sm:grid-cols-2">
          <article class="flex flex-col rounded-default border border-border-default bg-surface-card p-5 sm:p-8">
            <h3 class="m-0 font-display text-2xl text-brand">Gratuito</h3>
            <p class="mt-2 mb-0 text-content-secondary">
              Para organizar seus estudos no navegador.
            </p>
            <p class="mt-5 mb-0 flex items-baseline gap-2">
              <strong class="font-display text-4xl leading-none text-brand">R$ 0</strong>
              <span class="text-sm text-content-secondary">sem cadastro</span>
            </p>
            <ul class="mt-5 mb-5 list-none space-y-3 border-t border-border-default p-0 pt-5">
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
          <article class="rounded-default border border-border-default bg-surface-subtle p-5 sm:p-8">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="m-0 font-display text-2xl text-brand">Pro</h3>
              <Badge variant="info">Em preparação</Badge>
            </div>
            <p class="mt-2 mb-0 text-content-secondary">
              Para editais maiores e análises avançadas.
            </p>
            <div id="pro-price" aria-live="polite" aria-atomic="true">
              <p class="mt-5 mb-0 flex flex-wrap items-baseline gap-2">
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
              class="mt-5 mb-0 list-none space-y-3 border-t border-border-default p-0 pt-5"
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
            class="flex min-h-[64px] items-center justify-between gap-2 rounded-full border border-border-default bg-surface-card px-2 sm:gap-6 sm:px-4"
          >
            <a
              href="#inicio"
              class="inline-flex min-h-[44px] items-center gap-2 pl-1 font-display text-base font-semibold text-brand no-underline sm:text-lg"
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
            <a href="/app" class={`${primaryLink} shrink-0 min-h-[44px]! px-3! text-sm sm:px-5!`}>
              <span class="sm:hidden">Abrir app</span>
              <span class="hidden sm:inline">Abrir aplicativo</span>
              <Icon name="arrow-right" class="hidden sm:block" />
            </a>
          </nav>
        </header>
        <main id="conteudo" tabIndex={-1}>
          <section
            aria-labelledby="landing-title"
            class={`${pageWidth} pt-9 pb-8 sm:pt-12 sm:pb-12 lg:pt-14`}
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
              <div class="mt-5 flex flex-wrap gap-2 sm:gap-3">
                <a href="/app" class={primaryLink}>
                  Começar grátis <Icon name="arrow-right" size={18} />
                </a>
                <a
                  href="#painel"
                  class="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border-default bg-surface-card px-4 font-semibold text-brand no-underline transition-colors hover:bg-surface-subtle motion-reduce:transition-none sm:px-5"
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
            <div
              class={`${pageWidth} grid items-center gap-7 py-12 sm:py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16`}
            >
              <div class="relative order-last min-h-[220px] overflow-hidden rounded-default bg-surface-subtle sm:min-h-[350px] md:order-first md:self-stretch">
                <img
                  src="/assets/landing/livros-abertos.webp"
                  alt="Livros e anotações sobre uma mesa de estudo"
                  width="960"
                  height="640"
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-0 size-full object-cover"
                />
              </div>
              <div>
                <h2 class={sectionTitle}>Do edital à próxima sessão.</h2>
                <ul class="mt-5 mb-0 list-none divide-y divide-border-default border-y border-border-default p-0">
                  {steps.map(step => (
                    <li key={step.title} class="flex gap-4 py-4">
                      <Icon name={step.icon} size={22} class="mt-1 shrink-0 text-accent" />
                      <div>
                        <h3 class="m-0 font-display text-xl text-brand">{step.title}</h3>
                        <p class="m-0 mt-1 text-content-secondary">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
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
                    <summary class="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 rounded py-3 text-brand hover:underline [&::-webkit-details-marker]:hidden">
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
              <div class="flex flex-wrap items-center justify-between gap-5 rounded-default bg-surface-subtle px-5 py-8 sm:px-10 sm:py-12">
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
                class="inline-flex min-h-[44px] items-center gap-3 rounded font-display text-xl font-semibold text-brand no-underline"
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
                <a href="#como-funciona" class={`${navLink} px-0!`}>
                  Como funciona
                </a>
                <a href="#precos" class={`${navLink} px-0!`}>
                  Planos
                </a>
              </div>
              <div class="flex flex-col items-start">
                <p class="m-0 font-semibold text-brand">Acesso</p>
                <a href="/app" class={`${navLink} px-0!`}>
                  Abrir o app
                </a>
                <a href="#duvidas" class={`${navLink} px-0!`}>
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
