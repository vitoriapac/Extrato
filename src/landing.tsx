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
    title: 'Planeje e ajuste sua semana',
    text: 'Confira uma prévia de recuperação e escolha se deseja aplicar a mudança ao planejamento.',
    image: '/assets/landing/demo-previa-recuperacao.png',
    alt: 'Prévia do plano de recuperação com mudanças e capacidade preservada',
  },
  {
    title: 'Saiba o que fazer hoje',
    text: 'Veja as atividades planejadas e inicie o estudo com o tempo previsto à mão.',
    image: '/assets/landing/demo-execucao-hoje.png',
    alt: 'Tela Hoje da demonstração com atividades planejadas e tempos previstos',
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

const marqueeItems = [
  { icon: 'calendar', label: 'Planejamento semanal' },
  { icon: 'timer', label: 'Cronômetro de estudo' },
  { icon: 'repeat', label: 'Revisão espaçada' },
  { icon: 'file-text', label: 'Caderno de erros' },
  { icon: 'target', label: 'Metas por disciplina' },
  { icon: 'trending-up', label: 'Desempenho do período' },
  { icon: 'lock', label: 'Dados no seu navegador' },
  { icon: 'sparkles', label: 'Demonstração guiada' },
];

const benefits = [
  {
    icon: 'calendar',
    title: 'Semana planejada',
    text: 'Distribua as matérias conforme o tempo que você tem.',
  },
  { icon: 'repeat', title: 'Revisões em dia', text: 'O que você estudou volta para ser revisado.' },
  {
    icon: 'file-text',
    title: 'Caderno de erros',
    text: 'Transforme cada erro em flashcard para fixar.',
  },
  {
    icon: 'lock',
    title: 'Dados com você',
    text: 'Tudo fica no navegador, com backup para exportar.',
  },
];

const comparison = [
  ['Anotações e planilhas espalhadas', 'Uma semana de estudo organizada em um só lugar'],
  ['Dúvida diária sobre o que estudar', 'A próxima atividade pronta, com o tempo previsto'],
  ['Matéria revisada só quando lembra', 'Revisões que voltam no momento certo'],
  ['Sensação de estudar sem saber se evolui', 'Desempenho do período e limites da análise à vista'],
];

const steps = [
  {
    title: 'Cadastre suas matérias',
    text: 'Adicione as disciplinas e a data da prova, se já souber o prazo.',
  },
  { title: 'Monte a semana', text: 'Defina o tempo disponível e veja o plano de estudo sugerido.' },
  {
    title: 'Estude e acompanhe',
    text: 'Abra o Hoje, cronometre cada sessão e acompanhe a evolução.',
  },
];

const pageWidth = 'mx-auto w-full max-w-[1280px] px-4 sm:px-8';
const primaryLink =
  'landing-action inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-6 font-semibold text-primary-contrast no-underline transition-colors hover:bg-brand-secondary motion-reduce:transition-none';
const ctaLink =
  'landing-action inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--secondary)] px-7 font-semibold text-[var(--on-secondary)] no-underline shadow-md hover:bg-[var(--secondary-hover)]';
const eyebrow =
  'm-0 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--secondary-text)]';
const navLink =
  'inline-flex min-h-touch items-center whitespace-nowrap px-2 text-content-secondary no-underline hover:text-brand hover:underline underline-offset-4';
const sectionTitle =
  'm-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] tracking-[-0.025em] text-brand';

function StudyPreview() {
  return (
    <figure
      id="painel"
      class="m-0 min-w-0 overflow-hidden rounded-[28px] border border-border-default bg-surface-card p-3 shadow-2xl sm:p-5"
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
        <span class="block overflow-hidden rounded">
          <img
            src="/assets/landing/demo-proxima-acao.png"
            alt="Visão geral com próxima ação, tempo planejado e revisões"
            width="1216"
            height="689"
            class="block h-auto w-[180%] max-w-none sm:w-full"
          />
        </span>
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
        </div>
        <div class="mx-auto mt-6 grid max-w-[920px] gap-4 sm:grid-cols-2">
          <article class="flex flex-col rounded-default border-2 border-brand bg-surface-card p-6 sm:p-8">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="m-0 font-display text-2xl text-brand">Gratuito</h3>
              <Badge variant="info">Disponível agora</Badge>
            </div>
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
            <p class="mt-auto mb-4 text-sm text-content-secondary">
              Seus dados ficam neste navegador. Exporte um backup para guardar uma cópia ou
              transferir seus registros.
            </p>
            <a href="/app" class={`${primaryLink} self-start`}>
              Começar no gratuito <Icon name="arrow-right" size={18} />
            </a>
          </article>
          <article class="rounded-default border border-border-default bg-surface-subtle p-6 sm:p-8">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="m-0 font-display text-2xl text-brand">Pro</h3>
              <Badge variant="info">Em preparação</Badge>
            </div>
            <p class="mt-2 mb-0 text-content-secondary">
              Para editais maiores e análises avançadas. Ainda não disponível para contratação.
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
            <div id="pro-price" aria-live="polite" aria-atomic="true">
              <p class="mt-4 mb-0 text-sm text-content-secondary">Valor previsto</p>
              <p class="mt-1 mb-0 flex flex-wrap items-baseline gap-2">
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
  useLayoutEffect(() => {
    const root = document.getElementById('inicio');
    if (!root || !('IntersectionObserver' in window)) return;
    root.classList.add('rv-ready');
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }),
      { threshold: 0.12 }
    );
    root.querySelectorAll('[data-rv]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div id="inicio" class="min-h-screen bg-surface-card font-body text-base text-content-primary">
      <a href="#conteudo" class="skip-link">
        Pular para o conteúdo
      </a>
      <div class="landing-mesh bg-surface-page">
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
            <div class="hidden items-center gap-4 lg:flex">
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
          <section aria-labelledby="landing-title" class={`${pageWidth} pt-12 pb-8 sm:pt-20`}>
            <div class="mx-auto flex max-w-[820px] flex-col items-center text-center">
              <p
                data-rv
                class="m-0 inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-card px-4 py-1.5 text-sm font-medium text-brand"
              >
                <span class="size-2 rounded-full bg-[var(--secondary)]" aria-hidden="true" />
                Grátis, no navegador e sem cadastro
              </p>
              <h1
                id="landing-title"
                data-rv
                class="mt-6 mb-0 font-display text-[clamp(2.6rem,7vw,5.25rem)] leading-[1.03] tracking-[-0.035em] text-brand"
              >
                Seu estudo merece{' '}
                <span class="landing-mark text-[var(--secondary-text)]">um plano.</span>
              </h1>
              <p
                data-rv
                class="mt-6 mb-0 max-w-[52ch] text-lg leading-relaxed text-content-secondary sm:text-xl"
              >
                Monte sua semana para o concurso, saiba exatamente o que estudar hoje e veja sua
                evolução crescer a cada sessão.
              </p>
              <div data-rv class="mt-8 flex flex-wrap justify-center gap-3">
                <a href="/app" class={ctaLink}>
                  Começar grátis <Icon name="arrow-right" size={18} />
                </a>
                <a
                  href="/app"
                  class="landing-action inline-flex min-h-12 items-center gap-2 rounded-full border border-border-default bg-surface-card px-6 font-semibold text-brand no-underline hover:bg-surface-subtle"
                >
                  Conhecer demonstração
                </a>
              </div>
              <p data-rv class="mt-4 mb-0 max-w-[56ch] text-sm text-content-secondary">
                No aplicativo, escolha “Explorar demonstração” na tela inicial ou no rodapé. Os
                dados são fictícios e ficam separados dos seus registros.
              </p>
            </div>
            <div class="landing-hero-visual relative mx-auto mt-12 max-w-[1080px] sm:mt-16">
              <StudyPreview />
              <div
                aria-hidden="true"
                class="landing-float absolute -left-6 top-16 hidden items-center gap-3 rounded-default border border-border-default bg-surface-card p-3 pr-5 shadow-xl lg:flex"
              >
                <span class="grid size-10 place-items-center rounded-full bg-surface-subtle text-brand">
                  <Icon name="timer" size={20} />
                </span>
                <span class="text-left text-sm">
                  <strong class="block font-display text-brand">Hoje</strong>
                  <span class="text-content-secondary">atividades com tempo previsto</span>
                </span>
              </div>
              <div
                aria-hidden="true"
                class="landing-float landing-float-late absolute -right-6 bottom-20 hidden items-center gap-3 rounded-default border border-border-default bg-surface-card p-3 pr-5 shadow-xl lg:flex"
              >
                <span class="grid size-10 place-items-center rounded-full bg-[var(--secondary-bg)] text-[var(--secondary-text)]">
                  <Icon name="repeat" size={20} />
                </span>
                <span class="text-left text-sm">
                  <strong class="block font-display text-brand">Revisões</strong>
                  <span class="text-content-secondary">voltam no momento certo</span>
                </span>
              </div>
            </div>
          </section>

          <section aria-label="Recursos" class="overflow-hidden py-8">
            <div class="landing-marquee flex w-max gap-3">
              {[0, 1].map(copy => (
                <ul
                  key={copy}
                  aria-hidden={copy === 1 ? 'true' : undefined}
                  class="m-0 flex list-none gap-3 p-0"
                >
                  {marqueeItems.map(item => (
                    <li
                      key={item.label}
                      class="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border-default bg-surface-card px-5 py-2.5 text-sm font-medium text-brand"
                    >
                      <Icon name={item.icon} size={16} class="text-accent" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </section>

          <section id="como-funciona" class="bg-surface-card">
            <div class={`${pageWidth} py-16 sm:py-24`}>
              <div data-rv class="mx-auto max-w-[720px] text-center">
                <p class={eyebrow}>Como funciona</p>
                <h2 class={`${sectionTitle} mt-3`}>Do plano da semana ao estudo de hoje.</h2>
                <p class="mt-4 mb-0 text-lg text-content-secondary">
                  Três momentos do app, com dados fictícios da demonstração.
                </p>
              </div>
              <div class="mt-12 grid gap-5 md:grid-cols-3">
                {situations.map((item, index) => (
                  <article
                    key={item.title}
                    data-rv
                    style={{ '--rv-delay': `${index * 90}ms` }}
                    class="group flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-border-default bg-surface-page"
                  >
                    <div class="h-72 overflow-hidden bg-surface-subtle p-6 pb-0">
                      <img
                        src={item.image}
                        alt={item.alt}
                        loading="lazy"
                        decoding="async"
                        class="block h-auto w-full rounded-t-default border border-b-0 border-border-default shadow-xl transition-transform duration-500 group-hover:-translate-y-2 motion-reduce:transition-none"
                      />
                    </div>
                    <div class="p-6 sm:p-8">
                      <span class="font-display text-sm text-[var(--secondary-text)]">
                        0{index + 1}
                      </span>
                      <h3 class="mt-1 mb-0 font-display text-2xl leading-tight text-brand">
                        {item.title}
                      </h3>
                      <p class="mt-3 mb-0 text-content-secondary">{item.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section class="bg-surface-primary text-[var(--text-inverse)]">
            <div
              class={`${pageWidth} grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.05fr] lg:gap-20`}
            >
              <div data-rv class="grid grid-cols-2 gap-4">
                <img
                  src="/assets/landing/estudo-na-mesa.webp"
                  alt="Pessoa estudando com notebook, caderno e livros sobre uma mesa"
                  loading="lazy"
                  decoding="async"
                  class="row-span-2 h-full min-h-[360px] w-full rounded-[28px] object-cover"
                />
                <img
                  src="/assets/landing/livros-abertos.webp"
                  alt="Mesa vista de cima com livros abertos, anotações e uma xícara de café"
                  loading="lazy"
                  decoding="async"
                  class="aspect-square w-full rounded-[28px] object-cover"
                />
                <div class="grid place-items-center rounded-[28px] bg-[var(--secondary)] p-5 text-center text-[var(--on-secondary)]">
                  <p class="m-0 font-display text-3xl leading-tight">Cada estudo soma.</p>
                </div>
              </div>
              <div data-rv>
                <p class={`${eyebrow} text-[var(--brand-on-header)]!`}>Feito para quem estuda</p>
                <h2 class={`${sectionTitle} mt-3 text-[var(--text-inverse)]!`}>
                  Menos planilha. Mais estudo de verdade.
                </h2>
                <p class="mt-5 mb-0 max-w-[50ch] text-lg leading-relaxed opacity-90">
                  Sem planilhas soltas nem lembretes espalhados, você concentra a rotina em um só
                  lugar e mantém o controle dos seus dados.
                </p>
                <ul class="mt-8 mb-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                  {benefits.map(item => (
                    <li
                      key={item.title}
                      class="rounded-default border border-white/15 bg-white/5 p-4"
                    >
                      <Icon name={item.icon} size={22} class="text-[var(--secondary)]" />
                      <strong class="mt-3 block font-display text-lg">{item.title}</strong>
                      <span class="mt-1 block text-sm opacity-80">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section class="bg-surface-card">
            <div class={`${pageWidth} py-16 sm:py-24`}>
              <div data-rv class="mx-auto max-w-[720px] text-center">
                <p class={eyebrow}>O que muda</p>
                <h2 class={`${sectionTitle} mt-3`}>O seu dia de estudo, antes e depois.</h2>
              </div>
              <div class="mx-auto mt-12 grid max-w-[960px] gap-5 md:grid-cols-2">
                {[
                  { title: 'Sem o Extrato', icon: 'x', items: comparison.map(row => row[0]) },
                  { title: 'Com o Extrato', icon: 'check', items: comparison.map(row => row[1]) },
                ].map((column, index) => (
                  <article
                    key={column.title}
                    data-rv
                    style={{ '--rv-delay': `${index * 90}ms` }}
                    class={`rounded-[28px] border p-6 sm:p-8 ${
                      index === 1
                        ? 'border-brand bg-surface-page shadow-xl'
                        : 'border-border-default bg-surface-subtle'
                    }`}
                  >
                    <h3 class="m-0 font-display text-2xl text-brand">{column.title}</h3>
                    <ul class="mt-6 mb-0 grid list-none gap-4 p-0">
                      {column.items.map(text => (
                        <li key={text} class="flex gap-3">
                          <span
                            class={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                              index === 1
                                ? 'bg-brand-primary text-primary-contrast'
                                : 'bg-border-default text-content-secondary'
                            }`}
                          >
                            <Icon name={column.icon} size={14} stroke={2} />
                          </span>
                          <span
                            class={index === 1 ? 'text-content-primary' : 'text-content-secondary'}
                          >
                            {text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section class="bg-surface-highlight">
            <div class={`${pageWidth} py-16 sm:py-24`}>
              <div data-rv class="mx-auto max-w-[720px] text-center">
                <p class={eyebrow}>Como você começa</p>
                <h2 class={`${sectionTitle} mt-3`}>Em três passos, sua semana está pronta.</h2>
              </div>
              <ol class="mt-12 grid list-none gap-5 p-0 md:grid-cols-3">
                {steps.map((step, index) => (
                  <li
                    key={step.title}
                    data-rv
                    style={{ '--rv-delay': `${index * 90}ms` }}
                    class="rounded-[28px] bg-surface-card p-6 sm:p-8"
                  >
                    <span class="font-display text-6xl leading-none text-[var(--secondary)]">
                      {index + 1}
                    </span>
                    <h3 class="mt-4 mb-0 font-display text-2xl text-brand">{step.title}</h3>
                    <p class="mt-2 mb-0 text-content-secondary">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <LandingPricing />

          <section id="duvidas" class="bg-surface-card">
            <div
              class={`${pageWidth} grid gap-8 py-16 sm:py-24 md:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]`}
            >
              <div>
                <p class={eyebrow}>Dúvidas</p>
                <h2 class={`${sectionTitle} mt-3`}>Perguntas frequentes</h2>
              </div>
              <div class="grid gap-3">
                {questions.map(item => (
                  <details
                    key={item.title}
                    class="group rounded-default border border-border-default bg-surface-page px-5"
                  >
                    <summary class="flex min-h-touch cursor-pointer list-none items-center justify-between gap-4 rounded py-4 font-medium text-brand [&::-webkit-details-marker]:hidden">
                      {item.title}
                      <Icon
                        name="chevron-down"
                        size={18}
                        class="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                      />
                    </summary>
                    <p class="mt-0 mb-5 max-w-[60ch] text-content-secondary">{item.text}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section class="bg-surface-card pb-8">
            <div class={pageWidth}>
              <div
                data-rv
                class="landing-cta-panel relative overflow-hidden rounded-[32px] bg-surface-primary px-6 py-16 text-center text-[var(--text-inverse)] sm:px-12 sm:py-24"
              >
                <h2 class={`${sectionTitle} mx-auto max-w-[18ch] text-[var(--text-inverse)]!`}>
                  Monte sua primeira semana hoje.
                </h2>
                <p class="mx-auto mt-4 mb-0 max-w-[44ch] text-lg opacity-90">
                  Comece no navegador, sem cadastro, e veja o que estudar já no primeiro dia.
                </p>
                <a href="/app" class={`${ctaLink} mt-8`}>
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
