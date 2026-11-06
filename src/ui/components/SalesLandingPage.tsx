import { useState } from 'preact/hooks';
import {
  FREE_TIER_LIMITS,
  PRICING_PLANS,
  type BillingCycle,
} from '../../domain/billing/entitlements.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { RingGauge, Sparkline } from '../primitives/charts/charts.js';
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
  readinessTarget: number;
  readinessDelta: string;
  adherencePercent: string;
  weeklyHours: string;
  nextActionSubject: string;
  nextActionTopic: string;
  nextActionReason: string;
  rows: ReadonlyArray<{
    id: string;
    swatchVar: string;
    subject: string;
    hours: string;
    accuracy: string;
    trend: ReadonlyArray<number>;
    status: string;
    statusVariant: 'success' | 'warning' | 'danger' | 'info';
  }>;
}

const STATEMENT_SNAPSHOTS: Record<'week1' | 'week14', StatementPreviewState> = {
  week1: {
    periodLabel: 'FECHAMENTO · SEMANA 01 · BASE INICIAL',
    readinessScore: 46,
    readinessTarget: 80,
    readinessDelta: '+4 pts vs. diagnóstico inicial',
    adherencePercent: '84%',
    weeklyHours: '14h 20m',
    nextActionSubject: 'Direito Constitucional',
    nextActionTopic: 'Controle de Constitucionalidade',
    nextActionReason: 'Peso máximo na prova (92/100) · Domínio atual em 48% · 45 min prescritos',
    rows: [
      {
        id: 'subj-1',
        swatchVar: 'var(--subject-1)',
        subject: 'Direito Constitucional',
        hours: '04h 10m',
        accuracy: '58%',
        trend: [50, 52, 55, 58],
        status: 'Prioridade de lacuna',
        statusVariant: 'warning',
      },
      {
        id: 'subj-2',
        swatchVar: 'var(--subject-2)',
        subject: 'Língua Portuguesa',
        hours: '03h 40m',
        accuracy: '76%',
        trend: [70, 72, 74, 76],
        status: 'No ritmo',
        statusVariant: 'success',
      },
      {
        id: 'subj-3',
        swatchVar: 'var(--subject-3)',
        subject: 'Direito Administrativo',
        hours: '03h 15m',
        accuracy: '51%',
        trend: [48, 49, 50, 51],
        status: 'Revisão pendente',
        statusVariant: 'danger',
      },
      {
        id: 'subj-4',
        swatchVar: 'var(--subject-4)',
        subject: 'Raciocínio Lógico-Quantitativo',
        hours: '03h 15m',
        accuracy: '69%',
        trend: [64, 65, 67, 69],
        status: 'Estável',
        statusVariant: 'info',
      },
    ],
  },
  week14: {
    periodLabel: 'FECHAMENTO · SEMANA 14 · CONSOLIDAÇÃO AVANÇADA',
    readinessScore: 82,
    readinessTarget: 80,
    readinessDelta: '+36 pts acumulados em 14 semanas',
    adherencePercent: '94%',
    weeklyHours: '21h 45m',
    nextActionSubject: 'Direito Administrativo',
    nextActionTopic: 'Licitações e Contratos (Lei 14.133/21)',
    nextActionReason: 'Bateria de manutenção (30 min) · Retenção estabilizada acima de 85%',
    rows: [
      {
        id: 'subj-1',
        swatchVar: 'var(--subject-1)',
        subject: 'Direito Constitucional',
        hours: '05h 30m',
        accuracy: '88%',
        trend: [58, 69, 79, 88],
        status: 'Dominado',
        statusVariant: 'success',
      },
      {
        id: 'subj-2',
        swatchVar: 'var(--subject-2)',
        subject: 'Língua Portuguesa',
        hours: '04h 50m',
        accuracy: '91%',
        trend: [76, 82, 87, 91],
        status: 'Dominado',
        statusVariant: 'success',
      },
      {
        id: 'subj-3',
        swatchVar: 'var(--subject-3)',
        subject: 'Direito Administrativo',
        hours: '06h 15m',
        accuracy: '81%',
        trend: [51, 63, 74, 81],
        status: 'No ritmo',
        statusVariant: 'success',
      },
      {
        id: 'subj-4',
        swatchVar: 'var(--subject-4)',
        subject: 'Raciocínio Lógico-Quantitativo',
        hours: '05h 10m',
        accuracy: '84%',
        trend: [69, 75, 80, 84],
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
      'Caderno de Erros Ativo com flashcards de repetição espaçada integrados à agenda diária até você acertar 3 vezes seguidas.',
  },
];

const ENGINE_SPECS: ReadonlyArray<{
  title: string;
  summary: string;
  metricTag: string;
}> = [
  {
    title: 'Acompanhe cada tópico do edital',
    summary:
      'Escolha um edital do catálogo ou importe um arquivo. Acompanhe teoria, resumo, lei seca e questões em cada tópico.',
    metricTag: '4 etapas por tópico',
  },
  {
    title: 'Retome o plano sem acumular atrasos',
    summary:
      'Use uma agenda semanal ou um ciclo flexível proporcional ao peso das disciplinas. Quando um dia atrasa, o ciclo continua do ponto em que parou.',
    metricTag: 'Ciclo flexível',
  },
  {
    title: 'Teste mudanças sem mexer no seu plano',
    summary:
      'Simule mais tempo de estudo ou uma prova antecipada. A prévia mostra o impacto sem alterar seus dados salvos.',
    metricTag: 'Prévia sem salvar',
  },
  {
    title: 'Revise seus erros e entenda seus horários',
    summary:
      'Transforme questões erradas em cartões de revisão e compare seu rendimento de manhã, à tarde e à noite.',
    metricTag: 'Erros que viram revisão',
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
    <div class="min-h-screen bg-surface-page text-text font-body flex flex-col">
      {/* Barra de Navegação Comercial */}
      <header
        style={{
          boxShadow:
            '0 1px 0 var(--accent), 0 4px 12px color-mix(in srgb, var(--shadow-color) 25%, transparent)',
        }}
        class="sticky top-0 z-30 border-b border-border-default bg-surface-card"
      >
        <div class="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="font-display font-semibold text-lg tracking-tight text-text">
              StudyTrack
            </span>
            <span class="hidden sm:inline-block text-xs font-data text-secondary border-l border-border-default pl-3">
              EXTRATO DE ESTUDOS
            </span>
          </div>

          <nav
            aria-label="Navegação da página de apresentação"
            class="hidden md:flex items-center gap-6 text-sm text-secondary"
          >
            <a
              href="#comparativo"
              class="hover:text-text no-underline rounded px-1 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Por que funciona
            </a>
            <a
              href="#motores"
              class="hover:text-text no-underline rounded px-1 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Motores analíticos
            </a>
            <a
              href="#precos"
              class="hover:text-text no-underline rounded px-1 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Planos Free & Pro
            </a>
            <a
              href="#duvidas"
              class="hover:text-text no-underline rounded px-1 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
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
              <span class="hidden sm:inline">Abrir Aplicativo</span>
              <span class="sm:hidden">Abrir app</span>
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
              <h1 class="font-display font-semibold text-3xl sm:text-4xl leading-tight tracking-tight text-text m-0">
                Saiba o que estudar hoje e por quê.
              </h1>

              <p class="text-base text-secondary leading-relaxed m-0 max-w-[65ch]">
                O StudyTrack combina o peso do seu edital com o que você já estudou para sugerir a
                próxima ação e explicar quais dados levaram à recomendação.
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
                  Explorar demonstração
                </Button>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-border-default">
                <div>
                  <div class="font-display font-semibold text-lg text-text">Sem cadastro</div>
                  <div class="text-xs text-secondary">No plano grátis</div>
                </div>
                <div>
                  <div class="font-display font-semibold text-lg text-text">Até 8 disciplinas</div>
                  <div class="text-xs text-secondary">No plano grátis</div>
                </div>
                <div class="col-span-2 sm:col-span-1">
                  <div class="font-display font-semibold text-lg text-text">R$ 178,80/ano</div>
                  <div class="text-xs text-secondary">Plano Pro anual via PIX</div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: O Extrato Bancário Interativo */}
            <div class="lg:col-span-6">
              <article
                aria-label="Demonstração interativa do Extrato de Prontidão"
                class="rounded-default border border-border-default bg-surface-card overflow-hidden"
              >
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 border-b border-border-default bg-surface-subtle text-xs">
                  <strong class="text-text">Exemplo ilustrativo.</strong>
                  <span class="text-secondary">Dados fictícios, sem relação com resultados de usuários.</span>
                </div>
                {/* Cabeçalho Musgo Oficial do Extrato */}
                <div
                  style={{
                    backgroundColor: 'var(--brand)',
                    backgroundImage:
                      'repeating-linear-gradient(90deg, color-mix(in srgb, var(--brand-on-header) 5%, transparent) 0 1px, transparent 1px 40px)',
                    boxShadow: '0 1px 0 var(--accent)',
                    color: 'var(--on-brand)',
                  }}
                  class="p-5 flex flex-col gap-4"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span
                      style={{ color: 'var(--brand-on-header)' }}
                      class="font-data text-xs tracking-wider uppercase font-medium"
                    >
                      {snapshot.periodLabel}
                    </span>
                    <div
                      role="group"
                      aria-label="Alternar estágio de evolução do aluno"
                      style={{
                        borderColor: 'color-mix(in srgb, var(--on-brand) 22%, transparent)',
                      }}
                      class="inline-flex rounded border p-0.5 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewStage('week1')}
                        aria-pressed={previewStage === 'week1'}
                        style={
                          previewStage === 'week1'
                            ? {
                                backgroundColor: 'var(--brand-on-header)',
                                color: 'var(--brand)',
                              }
                            : {
                                backgroundColor: 'transparent',
                                color: 'var(--on-brand)',
                              }
                        }
                        class="min-h-[44px] sm:min-h-[34px] px-3 py-1 rounded cursor-pointer font-data font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        Semana 01
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewStage('week14')}
                        aria-pressed={previewStage === 'week14'}
                        style={
                          previewStage === 'week14'
                            ? {
                                backgroundColor: 'var(--brand-on-header)',
                                color: 'var(--brand)',
                              }
                            : {
                                backgroundColor: 'transparent',
                                color: 'var(--on-brand)',
                              }
                        }
                        class="min-h-[44px] sm:min-h-[34px] px-3 py-1 rounded cursor-pointer font-data font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        Semana 14
                      </button>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <div class="flex items-center gap-3.5">
                      <div class="balance-ring shrink-0">
                        <RingGauge
                          value={snapshot.readinessScore}
                          max={100}
                          target={snapshot.readinessTarget}
                          label="Saldo de Prontidão para a Prova"
                          size={56}
                          stroke={6}
                          showValue={false}
                        />
                      </div>
                      <div>
                        <div class="text-xs opacity-85">Saldo de Prontidão para a Prova</div>
                        <div class="flex flex-wrap items-baseline gap-2 mt-1">
                          <span
                            style={{
                              color:
                                snapshot.readinessScore >= snapshot.readinessTarget
                                  ? 'var(--brand-on-header)'
                                  : 'var(--attention)',
                            }}
                            class="font-display font-semibold text-4xl leading-none"
                          >
                            {snapshot.readinessScore}
                          </span>
                          <span class="font-data text-sm opacity-80">/100</span>
                          <span
                            style={{
                              backgroundColor:
                                'color-mix(in srgb, var(--on-brand) 14%, transparent)',
                              color: 'var(--on-brand)',
                            }}
                            class="font-data text-xs px-2 py-0.5 rounded"
                          >
                            {snapshot.readinessDelta}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="text-left sm:text-right font-data">
                      <div class="text-xs opacity-80">Aderência · Carga</div>
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
                    <strong class="text-sm font-semibold text-text">
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
                      key={row.id}
                      class="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span
                          aria-hidden="true"
                          style={{ backgroundColor: row.swatchVar }}
                          class="w-2.5 h-2.5 rounded-full shrink-0"
                        />
                        <span class="font-medium text-text truncate">{row.subject}</span>
                      </div>
                      <div class="flex items-center gap-3 shrink-0">
                        <div class="hidden sm:block">
                          <Sparkline
                            values={[...row.trend]}
                            label={`Evolução de acerto em ${row.subject}`}
                            unit="%"
                            width={68}
                            height={22}
                          />
                        </div>
                        <span class="font-data text-secondary">{row.hours}</span>
                        <span class="font-data font-semibold text-text w-10 text-right">
                          {row.accuracy}
                        </span>
                        <Badge variant={row.statusVariant}>{row.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div class="px-4 py-3 bg-surface-subtle border-t border-border-default flex items-center justify-between gap-2 text-xs">
                  <span class="text-secondary">
                    Quer explorar a demonstração com 140 dias de dados fictícios?
                  </span>
                  <button
                    type="button"
                    onClick={onStartLiveDemo}
                    class="font-medium text-text underline cursor-pointer bg-transparent border-0 p-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
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
              <h2 class="font-display font-semibold text-2xl sm:text-3xl text-text m-0">
                Por que cronogramas de planilha falham na vida real?
              </h2>
              <p class="text-sm sm:text-base text-secondary m-0 leading-relaxed">
                Estudar para concursos de alto nível não é preencher células coloridas. É alocar horas
                escassas onde há maior retorno de pontos na prova.
              </p>
            </div>

            <div class="rounded-default border border-border-default overflow-hidden bg-surface-page">
              <div class="grid grid-cols-1 md:grid-cols-12 border-b border-border-default bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-secondary">
                <div class="p-3.5 md:col-span-3">Cenário Real</div>
                <div class="p-3.5 md:col-span-4 border-t md:border-t-0 md:border-l border-border-default">
                  Planilhas e Cronogramas Fixos
                </div>
                <div class="p-3.5 md:col-span-5 border-t md:border-t-0 md:border-l border-border-default text-text">
                  Extrato Auditável StudyTrack
                </div>
              </div>

              <div class="divide-y divide-border-default">
                {COMPARISON_ROWS.map(item => (
                  <div key={item.criterion} class="grid grid-cols-1 md:grid-cols-12 text-sm">
                    <div class="p-4 md:col-span-3 font-semibold text-text bg-surface-card">
                      {item.criterion}
                    </div>
                    <div class="p-4 md:col-span-4 text-secondary border-t md:border-t-0 md:border-l border-border-default flex items-start gap-2">
                      <Icon name="x" size={16} class="text-secondary shrink-0 mt-0.5" />
                      <span>{item.spreadsheetWay}</span>
                    </div>
                    <div class="p-4 md:col-span-5 text-text bg-surface-card border-t md:border-t-0 md:border-l border-border-default flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-accent shrink-0 mt-0.5" />
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
              <h2 class="font-display font-semibold text-2xl sm:text-3xl text-text m-0">
                Mais clareza para escolher a próxima ação
              </h2>
              <p class="text-sm sm:text-base text-secondary m-0 leading-relaxed">
                O app usa o edital e seu histórico de estudo para explicar o próximo passo e os sinais
                que sustentam cada sugestão.
              </p>
            </div>

            <div class="rounded-default border border-border-default bg-surface-card divide-y divide-border-default">
              {ENGINE_SPECS.map(spec => (
                <div
                  key={spec.title}
                  class="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div class="flex flex-col gap-1 max-w-[75ch]">
                    <h3 class="font-display font-semibold text-lg text-text m-0">
                      {spec.title}
                    </h3>
                    <p class="text-sm text-secondary m-0 leading-relaxed">{spec.summary}</p>
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
                <h2 class="font-display font-semibold text-2xl sm:text-3xl text-text m-0">
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
                  class={`min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                    selectedCycle === 'annual'
                      ? 'bg-surface-card text-text border border-border-default'
                      : 'bg-transparent text-secondary hover:text-text border border-transparent'
                  }`}
                >
                  Anual (R$ 14,90/mês · -25%)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCycle('monthly')}
                  aria-pressed={selectedCycle === 'monthly'}
                  class={`min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                    selectedCycle === 'monthly'
                      ? 'bg-surface-card text-text border border-border-default'
                      : 'bg-transparent text-secondary hover:text-text border border-transparent'
                  }`}
                >
                  Mensal (R$ 19,90/mês)
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Card Plano Free */}
              <article class="rounded-default border border-border-default bg-surface-page p-6 flex flex-col justify-between gap-6">
                <div class="flex flex-col gap-4">
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="font-display font-semibold text-xl text-text m-0">
                      Plano Free Local
                    </h3>
                    <Badge variant="default">Sem cadastro obrigatório</Badge>
                  </div>

                  <div class="flex items-baseline gap-1.5">
                    <span class="font-display font-semibold text-3xl text-text">R$ 0</span>
                    <span class="text-xs font-data text-secondary">/ para sempre neste navegador</span>
                  </div>

                  <p class="text-xs text-secondary m-0">
                    Ideal para experimentar o método no seu próprio estudo diário ou preparar provas com
                    edital enxuto.
                  </p>

                  <ul class="list-none m-0 p-0 pt-3 border-t border-border-default flex flex-col gap-2.5 text-sm">
                    <li class="flex items-start gap-2">
                      <Icon name="check" size={16} class="text-accent shrink-0 mt-0.5" />
                      <span>
                        Até <strong>{FREE_TIER_LIMITS.maxActiveSubjects} disciplinas ativas</strong> e{' '}
                        <strong>{FREE_TIER_LIMITS.maxActiveExams} concurso ativo</strong>
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="check" size={16} class="text-accent shrink-0 mt-0.5" />
                      <span>
                        Até <strong>{FREE_TIER_LIMITS.maxErrorFlashcards} flashcards</strong> no Caderno
                        de Erros com repetição espaçada
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="check" size={16} class="text-accent shrink-0 mt-0.5" />
                      <span>
                        Cronômetro com Picture-in-Picture, Planejamento Semanal e Ciclo Rotativo
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="check" size={16} class="text-accent shrink-0 mt-0.5" />
                      <span>
                        Armazenamento local seguro no navegador com exportação e importação de backup JSON
                      </span>
                    </li>
                  </ul>
                </div>

                <Button variant="secondary" size="touch" onClick={onStartFreeApp} className="w-full">
                  Começar no Plano Free agora
                </Button>
              </article>

              {/* Card Plano Pro */}
              <article class="rounded-default border border-border-default border-t-[3px] border-t-accent bg-surface-page p-6 flex flex-col justify-between gap-6">
                <div class="flex flex-col gap-4">
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="font-display font-semibold text-xl text-text m-0">
                      {activeOffer.name}
                    </h3>
                    <Badge variant="info" icon="circle-check">
                      {activeOffer.badgeLabel || 'Acesso Total Ilimitado'}
                    </Badge>
                  </div>

                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-baseline gap-1.5">
                      <span class="font-display font-semibold text-3xl text-text">
                        {activeOffer.monthlyEquivalentFormatted}
                      </span>
                      <span class="text-xs font-data text-secondary">/mês</span>
                    </div>
                    <span class="text-xs font-data text-secondary">{activeOffer.billingNotice}</span>
                  </div>

                  <p class="text-xs text-secondary m-0">
                    Para concurseiros que querem edital completo sem limites, sincronização automática
                    entre computador e celular e inteligência preditiva.
                  </p>

                  <ul class="list-none m-0 p-0 pt-3 border-t border-border-default flex flex-col gap-2.5 text-sm">
                    <li class="flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-accent shrink-0 mt-0.5" />
                      <span>
                        <strong>Sincronização automática na nuvem</strong> entre PC, notebook e celular
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-accent shrink-0 mt-0.5" />
                      <span>
                        <strong>Disciplinas, concursos e flashcards ilimitados</strong> (desbloqueie
                        editais completos com 15+ matérias)
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-accent shrink-0 mt-0.5" />
                      <span>
                        <strong>Simulador de Cenários "E se?"</strong> e política automática de Reta
                        Final
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-accent shrink-0 mt-0.5" />
                      <span>
                        <strong>Importador de Edital via PDF</strong> e importação em lote de questões{' '}
                        <strong>CSV (QConcursos / Tec)</strong>
                      </span>
                    </li>
                    <li class="flex items-start gap-2">
                      <Icon name="circle-check" size={16} class="text-accent shrink-0 mt-0.5" />
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
            <h2 class="font-display font-semibold text-2xl sm:text-3xl text-text m-0">
              Perguntas frequentes
            </h2>

            <div class="rounded-default border border-border-default bg-surface-card divide-y divide-border-default">
              {FAQ_ITEMS.map(faq => (
                <details key={faq.question} class="p-4 sm:p-5 group">
                  <summary class="font-medium text-sm sm:text-base text-text cursor-pointer list-none flex items-center justify-between gap-3 rounded p-1 -m-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                    <span>{faq.question}</span>
                    <Icon
                      name="chevron-down"
                      size={16}
                      class="text-secondary shrink-0 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p class="text-sm text-secondary leading-relaxed mt-3 mb-0">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Barra Fixa Mobile (Zona do Polegar) */}
      <div class="sm:hidden sticky bottom-0 z-30 border-t border-border-default bg-surface-card px-4 py-2.5 flex items-center gap-2">
        <Button
          variant="secondary"
          size="touch"
          iconLeft="player-play"
          onClick={onStartLiveDemo}
          className="flex-1"
        >
          Ver demonstração
        </Button>
        <Button
          variant="primary"
          size="touch"
          iconRight="arrow-right"
          onClick={onStartFreeApp}
          className="flex-1"
        >
          Começar Grátis
        </Button>
      </div>

      {/* Rodapé Institucional */}
      <footer class="border-t border-border-default bg-surface-card py-8">
        <div class="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <div class="flex items-center gap-2">
            <strong class="font-display text-text">StudyTrack — Extrato de Estudos</strong>
            <span>· Copyright (c) 2026 Vitória Pac. Todos os direitos reservados.</span>
          </div>
          <div class="flex items-center gap-4">
            <button
              type="button"
              onClick={onStartLiveDemo}
              class="underline text-secondary hover:text-text bg-transparent border-0 p-1 rounded cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Explorar Demonstração (140 dias)
            </button>
            <button
              type="button"
              onClick={onStartFreeApp}
              class="underline text-secondary hover:text-text bg-transparent border-0 p-1 rounded cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Acessar Aplicativo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
