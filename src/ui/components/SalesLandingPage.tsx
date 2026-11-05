import { useState } from 'preact/hooks';
import {
  FREE_TIER_LIMITS,
  PRICING_PLANS,
  type BillingCycle,
} from '../../domain/billing/entitlements.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';

export interface SalesLandingPageProps {
  onStartFreeApp: () => void;
  onStartLiveDemo: () => void;
  onSelectProPlan: (cycle: BillingCycle) => void;
  onToggleTheme?: () => void;
}

interface StatementPreviewState {
  periodLabel: string;
  readinessScore: number;
  readinessDelta: string;
  adherencePercent: string;
  weeklyHours: string;
  nextActionSubject: string;
  nextActionTopic: string;
  nextActionReason: string;
  rows: ReadonlyArray<{
    code: string;
    subject: string;
    hours: string;
    accuracy: string;
    status: string;
    statusVariant: 'success' | 'warning' | 'danger' | 'info';
  }>;
}

const STATEMENT_SNAPSHOTS: Record<'week1' | 'week14', StatementPreviewState> = {
  week1: {
    periodLabel: 'FECHAMENTO · SEMANA 01 · BASE INICIAL',
    readinessScore: 46,
    readinessDelta: '+4 pts vs. diagnóstico inicial',
    adherencePercent: '84%',
    weeklyHours: '14h 20m',
    nextActionSubject: 'Direito Constitucional',
    nextActionTopic: 'Controle de Constitucionalidade',
    nextActionReason: 'Peso máximo na prova (92/100) · Domínio atual em 48% · 45 min prescritos',
    rows: [
      {
        code: 'DISC-01',
        subject: 'Direito Constitucional',
        hours: '04h 10m',
        accuracy: '58%',
        status: 'Prioridade de lacuna',
        statusVariant: 'warning',
      },
      {
        code: 'DISC-02',
        subject: 'Língua Portuguesa',
        hours: '03h 40m',
        accuracy: '76%',
        status: 'No ritmo',
        statusVariant: 'success',
      },
      {
        code: 'DISC-03',
        subject: 'Direito Administrativo',
        hours: '03h 15m',
        accuracy: '51%',
        status: 'Revisão pendente',
        statusVariant: 'danger',
      },
      {
        code: 'DISC-04',
        subject: 'Raciocínio Lógico-Quantitativo',
        hours: '03h 15m',
        accuracy: '69%',
        status: 'Estável',
        statusVariant: 'info',
      },
    ],
  },
  week14: {
    periodLabel: 'FECHAMENTO · SEMANA 14 · CONSOLIDAÇÃO AVANÇADA',
    readinessScore: 82,
    readinessDelta: '+36 pts acumulados em 14 semanas',
    adherencePercent: '94%',
    weeklyHours: '21h 45m',
    nextActionSubject: 'Direito Administrativo',
    nextActionTopic: 'Licitações e Contratos (Lei 14.133/21)',
    nextActionReason: 'Bateria de manutenção (30 min) · Retenção estabilizada acima de 85%',
    rows: [
      {
        code: 'DISC-01',
        subject: 'Direito Constitucional',
        hours: '05h 30m',
        accuracy: '88%',
        status: 'Dominado',
        statusVariant: 'success',
      },
      {
        code: 'DISC-02',
        subject: 'Língua Portuguesa',
        hours: '04h 50m',
        accuracy: '91%',
        status: 'Dominado',
        statusVariant: 'success',
      },
      {
        code: 'DISC-03',
        subject: 'Direito Administrativo',
        hours: '06h 15m',
        accuracy: '81%',
        status: 'No ritmo',
        statusVariant: 'success',
      },
      {
        code: 'DISC-04',
        subject: 'Raciocínio Lógico-Quantitativo',
        hours: '05h 10m',
        accuracy: '84%',
        status: 'No ritmo',
        statusVariant: 'success',
      },
    ],
  },
};

const COMPARISON_ROWS: ReadonlyArray<{
  criterion: string;
  spreadsheetWay: string;
  studyTrackWay: string;
}> = [
  {
    criterion: 'Imprevisto ou 3 dias sem estudar',
    spreadsheetWay:
      'Acumula uma bola de neve impagável e obriga você a refazer a tabela inteira no fim de semana.',
    studyTrackWay:
      'Replanejamento adaptativo automático dentro da sua capacidade real, declarando excedente sem criar metas irreais.',
  },
  {
    criterion: 'Decisão do que estudar ao sentar na cadeira',
    spreadsheetWay:
      'Divide o tempo igualmente entre matérias que valem 5% e matérias que valem 35% da prova.',
    studyTrackWay:
      'Cruza o peso oficial do edital com a sua taxa de acerto pessoal e entrega a Próxima Melhor Ação em 1 clique.',
  },
  {
    criterion: 'Falsa sensação de saber a matéria',
    spreadsheetWay:
      'Marca "PDF lido" como concluído, mas você esquece os detalhes na hora do simulado 20 dias depois.',
    studyTrackWay:
      'Detector de Ilusão de Competência alerta quando um tópico de alto domínio passa mais de 14 dias sem validação prática.',
  },
  {
    criterion: 'Erros recorrentes em pegadinhas da banca',
    spreadsheetWay:
      'Anotações soltas que nunca voltam para a agenda de revisão no momento exato do esquecimento.',
    studyTrackWay:
      'Caderno de Erros Ativo com flashcards SM-2 integrados à agenda diária até você acertar 3 vezes seguidas.',
  },
];

const ENGINE_SPECS: ReadonlyArray<{
  code: string;
  title: string;
  summary: string;
  metricTag: string;
}> = [
  {
    code: 'MOTOR 01',
    title: 'Edital Verticalizado & Leitor Estruturado de PDF',
    summary:
      'Cole o texto bruto do edital (Cebraspe, FGV, FCC, Cesgranrio) ou escolha do catálogo. Controle as 4 etapas por tópico: Teoria, Resumo, Lei Seca e Questões.',
    metricTag: '4 etapas por tópico',
  },
  {
    code: 'MOTOR 02',
    title: 'Ciclo Rotativo & Agenda Unificada de Revisões',
    summary:
      'Alterne entre agenda semanal fixa ou fila rotativa proporcional ao peso de cada disciplina. Se um dia atrasar, o ciclo retoma do ponto exato sem quebrar seu plano.',
    metricTag: 'Zero efeito bola de neve',
  },
  {
    code: 'MOTOR 03',
    title: 'Simulador de Cenários "E se?" & Modo Reta Final',
    summary:
      'Simule em memória o ganho de prontidão ao adicionar +30 min/dia sem alterar seus dados reais. A 15 dias da prova, o Modo Reta Final prioriza 85% questões e revisão.',
    metricTag: 'Simulação 100% segura',
  },
  {
    code: 'MOTOR 04',
    title: 'Caderno de Erros SM-2 & Energia Cronobiológica',
    summary:
      'Transforme cada questão errada em flashcard com a Pegadinha da Banca e o Conceito Correto, enquanto o diagnóstico cruza seu rendimento entre Manhã, Tarde e Noite.',
    metricTag: 'Repetição espaçada ativa',
  },
];

const FAQ_ITEMS: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: 'Preciso cadastrar cartão de crédito para usar o Plano Free ou a Demonstração?',
    answer:
      'Não. Você pode explorar imediatamente a demonstração interativa com 140 dias de histórico simulado (17 disciplinas e 305 tópicos) ou iniciar seu próprio plano gratuito local sem informar cartão nem criar senha.',
  },
  {
    question: 'O que acontece com meus dados se eu começar no Plano Free e depois assinar o Pro?',
    answer:
      'Todo o histórico que você já registrou no navegador (sessões, questões, simulados e tópicos) é preservado integralmente e sincronizado com a sua conta na nuvem assim que você ativa o Plano Pro.',
  },
  {
    question: 'Como funciona o pagamento via PIX e a liberação do Plano Pro?',
    answer:
      'O pagamento é processado instantaneamente via PIX pela AbacatePay. Assim que o PIX é confirmado (em poucos segundos), seu perfil é atualizado automaticamente para o Plano Pro pelo período contratado (31 dias no mensal ou 366 dias no anual).',
  },
  {
    question: 'Se eu cancelar o Plano Pro no futuro, perco acesso ao meu histórico de estudos?',
    answer:
      'Jamais. Como o StudyTrack tem arquitetura Local-First, seus dados continuam salvos no seu dispositivo e você pode exportar backups completos em JSON a qualquer momento.',
  },
];

export function SalesLandingPage({
  onStartFreeApp,
  onStartLiveDemo,
  onSelectProPlan,
  onToggleTheme,
}: SalesLandingPageProps) {
  const [previewStage, setPreviewStage] = useState<'week1' | 'week14'>('week14');
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('annual');

  const snapshot = STATEMENT_SNAPSHOTS[previewStage];
  const activeOffer = PRICING_PLANS[selectedCycle];

  return (
    <div class="min-h-screen bg-surface-page text-primary font-body flex flex-col">
      {/* Barra de Navegação Comercial */}
      <header class="sticky top-0 z-30 border-b border-border-default bg-surface-card/95 backdrop-blur-xs">
        <div class="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="font-display font-semibold text-lg tracking-tight text-primary">
              StudyTrack
            </span>
            <span class="hidden sm:inline-block text-xs font-mono text-secondary border-l border-border-default pl-3">
              EXTRATO DE ESTUDOS
            </span>
          </div>

          <nav aria-label="Navegação da página de apresentação" class="hidden md:flex items-center gap-6 text-sm text-secondary">
            <a href="#comparativo" class="hover:text-primary no-underline">
              Por que funciona
            </a>
            <a href="#motores" class="hover:text-primary no-underline">
              Motores analíticos
            </a>
            <a href="#precos" class="hover:text-primary no-underline">
              Planos Free & Pro
            </a>
            <a href="#duvidas" class="hover:text-primary no-underline">
              Dúvidas
            </a>
          </nav>

          <div class="flex items-center gap-2">
            {onToggleTheme && (
              <Button
                variant="ghost"
                size="small"
                onClick={onToggleTheme}
                aria-label="Alternar tema claro ou escuro"
              >
                <Icon name="sun-moon" size={16} />
              </Button>
            )}
            <Button
              variant="secondary"
              size="small"
              iconLeft="player-play"
              onClick={onStartLiveDemo}
              className="hidden sm:inline-flex"
            >
              Ver Demo (140d)
            </Button>
            <Button
              variant="primary"
              size="small"
              iconRight="arrow-right"
              onClick={onStartFreeApp}
            >
              Abrir Aplicativo
            </Button>
          </div>
        </div>
      </header>

      <main class="flex-1">
        {/* Hero Section: A Tese + O Extrato Interativo */}
        <section class="py-10 sm:py-16 border-b border-border-default">
          <div class="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Coluna Esquerda: Proposta de Valor */}
            <div class="lg:col-span-6 flex flex-col gap-5 pt-2">
              <h1 class="font-display font-semibold text-3xl sm:text-4xl leading-tight tracking-tight text-primary m-0">
                Pare de estudar no escuro. Transforme cada hora líquida em um extrato de prontidão auditável.
              </h1>

              <p class="text-base text-secondary leading-relaxed m-0 max-w-[65ch]">
                Planilhas quebram na primeira semana difícil e tratam todas as matérias como iguais.
                O StudyTrack cruza o peso real do seu edital com a sua taxa de acerto pessoal para
                mostrar exatamente o que estudar hoje, quando revisar e o quanto falta para a sua meta.
              </p>

              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Button
                  variant="primary"
                  size="touch"
                  iconRight="arrow-right"
                  onClick={onStartFreeApp}
                >
                  Começar meu plano grátis
                </Button>
                <Button
                  variant="secondary"
                  size="touch"
                  iconLeft="player-play"
                  onClick={onStartLiveDemo}
                >
                  Testar Demo Ao Vivo (140 dias)
                </Button>
              </div>

              <div class="grid grid-cols-3 gap-3 pt-4 border-t border-border-default">
                <div>
                  <div class="font-mono font-semibold text-base text-primary">100% Local-First</div>
                  <div class="text-xs text-secondary">Zero espera ao registrar</div>
                </div>
                <div>
                  <div class="font-mono font-semibold text-base text-primary">Até 8 matérias</div>
                  <div class="text-xs text-secondary">Grátis sem pedir cartão</div>
                </div>
                <div>
                  <div class="font-mono font-semibold text-base text-primary">R$ 14,90/mês</div>
                  <div class="text-xs text-secondary">No Plano Pro Anual (PIX)</div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: O Extrato Bancário Interativo */}
            <div class="lg:col-span-6">
              <article
                aria-label="Demonstração interativa do Extrato de Prontidão"
                class="rounded border border-border-default bg-surface-card overflow-hidden"
              >
                {/* Cabeçalho Musgo Oficial do Extrato */}
                <div
                  style={{ background: 'var(--brand)', color: 'var(--on-brand)' }}
                  class="p-5 flex flex-col gap-4"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-mono text-xs tracking-wider uppercase opacity-85">
                      {snapshot.periodLabel}
                    </span>
                    <div
                      role="group"
                      aria-label="Alternar estágio de evolução do aluno"
                      class="inline-flex rounded border border-white/20 p-0.5 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewStage('week1')}
                        aria-pressed={previewStage === 'week1'}
                        class={`px-2.5 py-1 rounded cursor-pointer font-mono transition-colors ${
                          previewStage === 'week1'
                            ? 'bg-white text-black font-semibold'
                            : 'bg-transparent text-white/80 hover:text-white'
                        }`}
                      >
                        Semana 01
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewStage('week14')}
                        aria-pressed={previewStage === 'week14'}
                        class={`px-2.5 py-1 rounded cursor-pointer font-mono transition-colors ${
                          previewStage === 'week14'
                            ? 'bg-white text-black font-semibold'
                            : 'bg-transparent text-white/80 hover:text-white'
                        }`}
                      >
                        Semana 14
                      </button>
                    </div>
                  </div>

                  <div class="flex items-end justify-between gap-4 pt-1">
                    <div>
                      <div class="text-xs opacity-80">Saldo de Prontidão para a Prova</div>
                      <div class="flex items-baseline gap-2 mt-1">
                        <span
                          style={{ color: 'var(--attention)' }}
                          class="font-display font-semibold text-4xl leading-none"
                        >
                          {snapshot.readinessScore}
                        </span>
                        <span class="font-mono text-sm opacity-75">/100</span>
                        <span class="font-mono text-xs px-2 py-0.5 rounded bg-white/10">
                          {snapshot.readinessDelta}
                        </span>
                      </div>
                    </div>

                    <div class="text-right font-mono">
                      <div class="text-xs opacity-75">Aderência · Carga</div>
                      <div class="text-sm font-semibold mt-0.5">
                        {snapshot.adherencePercent} · {snapshot.weeklyHours}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prescrição de Próxima Ação */}
                <div class="p-4 border-b border-border-default bg-surface-subtle flex items-start justify-between gap-3">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-xs font-semibold uppercase tracking-wide text-secondary">
                      Próxima melhor ação calculada
                    </span>
                    <strong class="text-sm font-semibold text-primary">
                      {snapshot.nextActionSubject} — {snapshot.nextActionTopic}
                    </strong>
                    <span class="text-xs text-secondary">{snapshot.nextActionReason}</span>
                  </div>
                  <Badge variant="info" icon="target">
                    Prioridade #1
                  </Badge>
                </div>

                {/* Linhas do Extrato por Disciplina */}
                <div class="divide-y divide-border-default">
                  {snapshot.rows.map(row => (
                    <div
                      key={row.code}
                      class="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="font-mono text-secondary shrink-0">{row.code}</span>
                        <span class="font-medium text-primary truncate">{row.subject}</span>
                      </div>
                      <div class="flex items-center gap-3 shrink-0">
                        <span class="font-mono text-secondary">{row.hours}</span>
                        <span class="font-mono font-semibold text-primary w-10 text-right">
                          {row.accuracy}
                        </span>
                        <Badge variant={row.statusVariant}>{row.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div class="px-4 py-3 bg-surface-subtle border-t border-border-default flex items-center justify-between gap-2 text-xs">
                  <span class="text-secondary">
                    Quer interagir com esse histórico completo de 140 dias agora?
                  </span>
                  <button
                    type="button"
                    onClick={onStartLiveDemo}
                    class="font-medium text-primary underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    Abrir demonstração interativa
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Seção de Contraste: Planilha Estática vs. Extrato Auditável */}
        <section id="comparativo" class="py-12 sm:py-16 border-b border-border-default bg-surface-card">
          <div class="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-8">
            <div class="max-w-[68ch] flex flex-col gap-2">
              <h2 class="font-display font-semibold text-2xl sm:text-3xl text-primary m-0">
                Por que cronogramas de planilha falham na vida real?
              </h2>
              <p class="text-sm sm:text-base text-secondary m-0 leading-relaxed">
                Estudar para concursos de alto nível não é preencher células coloridas. É alocar horas
                escassas onde há maior retorno de pontos na prova.
              </p>
            </div>

            <div class="rounded border border-border-default overflow-hidden bg-surface-page">
              <div class="grid grid-cols-1 md:grid-cols-12 border-b border-border-default bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-secondary">
                <div class="p-3.5 md:col-span-3">Cenário Real</div>
                <div class="p-3.5 md:col-span-4 border-t md:border-t-0 md:border-l border-border-default">
                  Planilhas e Cronogramas Fixos
                </div>
                <div class="p-3.5 md:col-span-5 border-t md:border-t-0 md:border-l border-border-default text-primary">
                  Extrato Auditável StudyTrack
                </div>
              </div>

              <div class="divide-y divide-border-default">
                {COMPARISON_ROWS.map(item => (
                  <div key={item.criterion} class="grid grid-cols-1 md:grid-cols-12 text-sm">
                    <div class="p-4 md:col-span-3 font-semibold text-primary bg-surface-card">
                      {item.criterion}
                    </div>
                    <div class="p-4 md:col-span-4 text-secondary border-t md:border-t-0 md:border-l border-border-default flex items-start gap-2">
                      <Icon name="x" size={16} class="text-red shrink-0 mt-0.5" />
                      <span>{item.spreadsheetWay}</span>
                    </div>
                    <div class="p-4 md:col-span-5 text-primary bg-surface-card border-t md:border-t-0 md:border-l border-border-default flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-green shrink-0 mt-0.5" />
                      <span>{item.studyTrackWay}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Os 4 Motores Analíticos */}
        <section id="motores" class="py-12 sm:py-16 border-b border-border-default">
          <div class="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-8">
            <div class="max-w-[68ch] flex flex-col gap-2">
              <h2 class="font-display font-semibold text-2xl sm:text-3xl text-primary m-0">
                Quatro motores desenhados para fechar lacunas de edital
              </h2>
              <p class="text-sm sm:text-base text-secondary m-0 leading-relaxed">
                Cada sessão cronometrada, bateria de questões ou simulado alimenta um único índice
                explicável, sem fórmulas opacas.
              </p>
            </div>

            <div class="rounded border border-border-default bg-surface-card divide-y divide-border-default">
              {ENGINE_SPECS.map(spec => (
                <div
                  key={spec.code}
                  class="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div class="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 max-w-[75ch]">
                    <span class="font-mono text-xs font-semibold text-secondary shrink-0">
                      {spec.code}
                    </span>
                    <div class="flex flex-col gap-1">
                      <h3 class="font-display font-semibold text-lg text-primary m-0">
                        {spec.title}
                      </h3>
                      <p class="text-sm text-secondary m-0 leading-relaxed">{spec.summary}</p>
                    </div>
                  </div>
                  <div class="shrink-0">
                    <Badge variant="default" icon="check">
                      {spec.metricTag}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabela de Planos Free vs. Pro */}
        <section id="precos" class="py-12 sm:py-16 border-b border-border-default bg-surface-card">
          <div class="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-8">
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div class="max-w-[65ch] flex flex-col gap-2">
                <h2 class="font-display font-semibold text-2xl sm:text-3xl text-primary m-0">
                  Comece grátis no navegador. Evolua para o Pro quando quiser nuvem e escala.
                </h2>
                <p class="text-sm sm:text-base text-secondary m-0 leading-relaxed">
                  Sem pegadinhas: o Plano Free funciona por tempo ilimitado no seu dispositivo para
                  editais enxutos. O Plano Pro libera sincronização entre PC e celular, editais
                  ilimitados e todos os simuladores avançados.
                </p>
              </div>

              {/* Seletor de Ciclo Anual / Mensal */}
              <div
                role="group"
                aria-label="Escolher periodicidade do Plano Pro"
                class="inline-flex rounded border border-border-default bg-surface-subtle p-1 self-start"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCycle('annual')}
                  aria-pressed={selectedCycle === 'annual'}
                  class={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                    selectedCycle === 'annual'
                      ? 'bg-surface-card text-primary shadow-xs'
                      : 'bg-transparent text-secondary hover:text-primary'
                  }`}
                >
                  Anual (R$ 14,90/mês · -25%)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCycle('monthly')}
                  aria-pressed={selectedCycle === 'monthly'}
                  class={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                    selectedCycle === 'monthly'
                      ? 'bg-surface-card text-primary shadow-xs'
                      : 'bg-transparent text-secondary hover:text-primary'
                  }`}
                >
                  Mensal (R$ 19,90/mês)
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Card Plano Free */}
              <article class="rounded border border-border-default bg-surface-page p-6 flex flex-col justify-between gap-6">
                <div class="flex flex-col gap-4">
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="font-display font-semibold text-xl text-primary m-0">
                      Plano Free Local
                    </h3>
                    <Badge variant="default">Sem cadastro obrigatório</Badge>
                  </div>

                  <div class="flex items-baseline gap-1.5">
                    <span class="font-display font-semibold text-3xl text-primary">R$ 0</span>
                    <span class="text-xs font-mono text-secondary">/ para sempre neste navegador</span>
                  </div>

                  <p class="text-xs text-secondary m-0">
                    Ideal para experimentar o método no seu próprio estudo diário ou preparar provas com
                    edital enxuto.
                  </p>

                  <ul class="list-none m-0 p-0 pt-3 border-t border-border-default flex flex-col gap-2.5 text-sm">
                    <li class="flex items-start gap-2">
                      <Icon name="check" size={16} class="text-green shrink-0 mt-0.5" />
                      <span>
                        Até <strong>{FREE_TIER_LIMITS.maxActiveSubjects} disciplinas ativas</strong> e{' '}
                        <strong>{FREE_TIER_LIMITS.maxActiveExams} concurso ativo</strong>
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="check" size={16} class="text-green shrink-0 mt-0.5" />
                      <span>
                        Até <strong>{FREE_TIER_LIMITS.maxErrorFlashcards} flashcards</strong> no Caderno
                        de Erros SM-2
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="check" size={16} class="text-green shrink-0 mt-0.5" />
                      <span>
                        Cronômetro com Picture-in-Picture, Planejamento Semanal e Ciclo Rotativo
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="check" size={16} class="text-green shrink-0 mt-0.5" />
                      <span>
                        Armazenamento local (`IndexedDB`) com exportação e importação de backup JSON
                      </span>
                    </li>
                  </ul>
                </div>

                <Button variant="secondary" size="touch" onClick={onStartFreeApp} className="w-full">
                  Começar no Plano Free agora
                </Button>
              </article>

              {/* Card Plano Pro */}
              <article class="rounded border-2 border-brand bg-surface-page p-6 flex flex-col justify-between gap-6">
                <div class="flex flex-col gap-4">
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="font-display font-semibold text-xl text-primary m-0">
                      {activeOffer.name}
                    </h3>
                    <Badge variant="success" icon="circle-check">
                      {activeOffer.badgeLabel || 'Acesso Total Ilimitado'}
                    </Badge>
                  </div>

                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-baseline gap-1.5">
                      <span class="font-display font-semibold text-3xl text-primary">
                        {activeOffer.monthlyEquivalentFormatted}
                      </span>
                      <span class="text-xs font-mono text-secondary">/mês</span>
                    </div>
                    <span class="text-xs font-mono text-secondary">{activeOffer.billingNotice}</span>
                  </div>

                  <p class="text-xs text-secondary m-0">
                    Para concurseiros que querem edital completo sem limites, sincronização automática
                    entre computador e celular e inteligência preditiva.
                  </p>

                  <ul class="list-none m-0 p-0 pt-3 border-t border-border-default flex flex-col gap-2.5 text-sm">
                    <li class="flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-green shrink-0 mt-0.5" />
                      <span>
                        <strong>Sincronização automática na nuvem</strong> entre PC, notebook e celular
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-green shrink-0 mt-0.5" />
                      <span>
                        <strong>Disciplinas, concursos e flashcards ilimitados</strong> (desbloqueie
                        editais completos com 15+ matérias)
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-green shrink-0 mt-0.5" />
                      <span>
                        <strong>Simulador de Cenários "E se?"</strong> e política automática de Reta
                        Final
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-green shrink-0 mt-0.5" />
                      <span>
                        <strong>Importador de Edital via PDF</strong> e importação em lote de questões{' '}
                        <strong>CSV (QConcursos / Tec)</strong>
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-green shrink-0 mt-0.5" />
                      <span>
                        <strong>Análise Cronobiológica de Energia por Turno</strong>, Detector de Platô
                        e <strong>Relatório Estratégico PDF A4</strong>
                      </span>
                    </li>
                  </ul>
                </div>

                <Button
                  variant="primary"
                  size="touch"
                  iconLeft="bolt"
                  onClick={() => onSelectProPlan(selectedCycle)}
                  className="w-full"
                >
                  Assinar StudyTrack Pro por {activeOffer.priceFormatted} no PIX
                </Button>
              </article>
            </div>
          </div>
        </section>

        {/* Dúvidas Frequentes */}
        <section id="duvidas" class="py-12 sm:py-16">
          <div class="max-w-[900px] mx-auto px-4 sm:px-6 flex flex-col gap-6">
            <h2 class="font-display font-semibold text-2xl sm:text-3xl text-primary m-0">
              Perguntas frequentes
            </h2>

            <div class="rounded border border-border-default bg-surface-card divide-y divide-border-default">
              {FAQ_ITEMS.map(faq => (
                <details key={faq.question} class="p-4 sm:p-5 group">
                  <summary class="font-medium text-sm sm:text-base text-primary cursor-pointer list-none flex items-center justify-between gap-3">
                    <span>{faq.question}</span>
                    <Icon name="chevron-down" size={16} class="text-secondary shrink-0" />
                  </summary>
                  <p class="text-sm text-secondary leading-relaxed mt-3 mb-0">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé Institucional */}
      <footer class="border-t border-border-default bg-surface-card py-8">
        <div class="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <div class="flex items-center gap-2">
            <strong class="font-display text-primary">StudyTrack — Extrato de Estudos</strong>
            <span>· Copyright (c) 2026 Vitória Pac. Todos os direitos reservados.</span>
          </div>
          <div class="flex items-center gap-4">
            <button
              type="button"
              onClick={onStartLiveDemo}
              class="underline text-secondary hover:text-primary bg-transparent border-0 p-0 cursor-pointer"
            >
              Explorar Demonstração (140 dias)
            </button>
            <button
              type="button"
              onClick={onStartFreeApp}
              class="underline text-secondary hover:text-primary bg-transparent border-0 p-0 cursor-pointer"
            >
              Acessar Aplicativo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
