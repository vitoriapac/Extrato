import { h } from 'preact';
import { openPerformanceSection } from '../performance/open-performance-section.js';
import { scrollBehavior } from '../accessibility.js';
import { subjectColorOf } from '../../domain/subjects/subject-color.js';
import { revealAdvanced } from '../essential-mode.js';
import { hydrateLazy } from '../lazy-details.js';
import { mountPreact } from '../preact-mount.js';
import { GlobalCommandPalette } from '../components/GlobalCommandPalette.js';

export interface SearchCommand {
  label: string;
  keywords: string;
  tab?: string;
  action?: string;
  icon?: string;
}

export const SEARCH_COMMANDS: SearchCommand[] = [
  {
    label: 'Visão Geral',
    keywords: 'inicio dashboard resumo prontidao saldo',
    tab: 'dashboard',
    icon: 'layout-dashboard',
  },
  {
    label: 'Abrir Desempenho',
    keywords:
      'evolucao historico tendencias comparacao progresso prontidao trajetoria consistencia inteligencia da prova incidencia dominio retencao',
    tab: 'desempenho',
    icon: 'chart-line',
  },
  {
    label: 'Ir para Hoje',
    keywords: 'hoje tarefa recomendacao estudo proxima melhor acao plano do dia',
    tab: 'hoje',
    icon: 'sun',
  },
  {
    label: 'Ver conquistas',
    keywords: 'conquistas emblemas medalhas desbloqueadas progresso metas de constancia',
    action: 'achievements',
    icon: 'award',
  },
  {
    label: 'Ir para a recomendação prioritária',
    keywords:
      'começar iniciar estudo primeiro item do plano próxima ação estudar recomendação prioritária',
    action: 'recommendation',
    icon: 'player-play',
  },
  {
    label: 'Abrir cronômetro',
    keywords: 'iniciar sessao timer estudar foco',
    action: 'timer',
    icon: 'clock',
  },
  {
    label: 'Abrir Disciplinas',
    keywords: 'materias edital topicos',
    tab: 'disciplinas',
    icon: 'books',
  },
  {
    label: 'Carregar edital do catálogo',
    keywords: 'importar edital concurso bb caixa',
    action: 'exam-import',
    icon: 'file-import',
  },
  {
    label: 'Importar JSON ou CSV',
    keywords: 'importar arquivo conteudo disciplinas',
    action: 'structured-import',
    icon: 'upload',
  },
  {
    label: 'Abrir Calendário (visão Mês da Agenda)',
    keywords: 'calendario sessoes datas mes',
    tab: 'agenda',
    icon: 'calendar-month',
  },
  {
    label: 'Abrir Agenda de Revisões',
    keywords: 'agenda revisao atrasadas',
    tab: 'agenda',
    icon: 'repeat',
  },
  {
    label: 'Adicionar revisão',
    keywords: 'criar nova revisão agenda',
    action: 'add-review',
    icon: 'calendar-event',
  },
  {
    label: 'Abrir Questões e Simulados',
    keywords: 'questoes erros simulados desempenho',
    tab: 'questoes',
    icon: 'clipboard-text',
  },
  {
    label: 'Registrar questões',
    keywords: 'lancar registrar acertos erros',
    action: 'add-questions',
    icon: 'list-check',
  },
  {
    label: 'Abrir Planejamento e metas',
    keywords:
      'metas capacidade plano planejamento estrategia aderencia adaptacao semanal recuperacao',
    tab: 'metas',
    icon: 'target',
  },
  {
    label: 'Abrir fechamento semanal',
    keywords: 'fechamento semana retrato linha do tempo historico de decisoes',
    action: 'weekly-close',
    icon: 'circle-check',
  },
  {
    label: 'Ver Diagnóstico',
    keywords: 'diagnostico lacunas prioridades',
    action: 'diagnosis',
    icon: 'sparkles',
  },
  {
    label: 'Planejar semana',
    keywords: 'plano semanal distribuir carga',
    tab: 'metas',
    icon: 'calendar-event',
  },
  {
    label: 'Abrir Instruções',
    keywords: 'ajuda guia como usar instrucoes',
    tab: 'instrucoes',
    icon: 'help-circle',
  },
  {
    label: 'Exportar backup',
    keywords: 'backup salvar dados json',
    action: 'backup',
    icon: 'database',
  },
  {
    label: 'Exportar relatório PDF',
    keywords: 'pdf relatorio imprimir exportar',
    action: 'report',
    icon: 'file-type-pdf',
  },
];

export const normalizeSearchText = (value: string | null | undefined): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

export interface SearchResultItem {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  colorSlot?: number;
}

export function performGlobalSearch(query: string, subjects: any[]): SearchResultItem[] {
  const q = normalizeSearchText(query.trim());
  if (!q) return [];
  const results: SearchResultItem[] = [];
  subjects.forEach(s => {
    (s.topics || []).forEach((t: any) => {
      const hay = normalizeSearchText([t.name || '', t.notes || '', ...(t.tags || [])].join(' '));
      if (hay.includes(q)) {
        results.push({
          subjectId: s.id,
          subjectName: s.name,
          topicId: t.id,
          topicName: t.name || '(sem nome)',
          colorSlot: subjectColorOf(s, subjects),
        });
      }
    });
  });
  return results.slice(0, 8);
}

export interface SearchControllerOptions {
  document: Document;
  window: Window;
  getState: () => any;
  activateTab: (tab: string) => boolean | void;
  showToast: (msg: string) => void;
  openExamImport?: () => void;
  getRecommendations?: () => any[];
  onExecuteRecommendation?: (id: string) => void;
  jumpToTopic: (subjectId: string, topicId: string) => void;
  escapeHtml?: (str: string) => string;
  escapeAttr?: (str: string) => string;
}

export function createSearchController(options: SearchControllerOptions) {
  const { document, window, getState, activateTab, showToast, jumpToTopic } = options;

  let paletteOpen = false;
  let paletteQuery = '';

  function filterCommandsForQuery(q: string) {
    const normalized = normalizeSearchText(q.trim());
    const commands = (
      normalized
        ? SEARCH_COMMANDS.filter(item =>
            normalizeSearchText(`${item.label} ${item.keywords}`).includes(normalized)
          )
        : SEARCH_COMMANDS
    ).slice(0, 20);
    const topics = normalized ? performGlobalSearch(q, getState().subjects || []) : [];
    return {
      normalized,
      commands,
      actionCommands: commands.filter(item => Boolean(item.action)),
      navCommands: commands.filter(item => Boolean(item.tab)),
      topics,
    };
  }

  function executeCommandSpec(command: { action?: string | null; tab?: string | null }): void {
    const action = command.action || '';
    if (action === 'report') {
      (document.getElementById('exportReportBtn') as HTMLElement | null)?.click();
    } else if (action === 'backup') {
      (document.getElementById('exportBackupBtn') as HTMLElement | null)?.click();
    } else if (action === 'exam-import') {
      activateTab('disciplinas');
      if (options.openExamImport) options.openExamImport();
    } else if (action === 'structured-import') {
      activateTab('disciplinas');
      (document.getElementById('structuredContentImportBtn') as HTMLElement | null)?.click();
    } else if (action === 'add-review') {
      activateTab('agenda');
      (document.getElementById('addAgendaRowBtn') as HTMLElement | null)?.click();
    } else if (action === 'add-questions') {
      activateTab('questoes');
      (document.getElementById('addQuestaoRowBtn') as HTMLElement | null)?.click();
    } else if (action === 'achievements') {
      activateTab('hoje');
      (document.getElementById('todayTab-conquistas') as HTMLElement | null)?.click();
    } else if (action === 'timer') {
      activateTab('dashboard');
      document.getElementById('timerSubjectSelect')?.focus();
    } else if (action === 'weekly-close') {
      activateTab('metas');
      (
        document.querySelector('[data-delegated-click="openWeeklyClose()"]') as HTMLElement | null
      )?.click();
    } else if (action === 'diagnosis') {
      // A central fica num <details> fechado em Desempenho, que o modo Essencial também esconde: abrir, liberar, rolar e focar.
      activateTab('desempenho');
      openPerformanceSection(document, 'diagnosis');
      const center = document.getElementById('diagnosisCenter');
      const details = center?.closest('details') as HTMLDetailsElement | null;
      if (details) {
        details.open = true;
        revealAdvanced(details, false);
      }
      if (center) hydrateLazy(center);
      const heading = center?.closest('section')?.querySelector('h3') as HTMLElement | null;
      const target = heading || details;
      if (target) {
        target.tabIndex = -1;
        target.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
        target.focus({ preventScroll: true });
      }
    } else if (action === 'recommendation') {
      // Só leva ao botão de iniciar em Hoje: começar um estudo muda o dia e não deve acontecer num clique da paleta.
      const recommendations = options.getRecommendations ? options.getRecommendations() : [];
      if (recommendations[0]) {
        activateTab('hoje');
        const start = document.querySelector<HTMLElement>(
          '#panel-hoje [data-delegated-click^="executeStudyRecommendation"]'
        );
        (start || document.getElementById('timerSubjectSelect'))?.focus();
      } else {
        activateTab('hoje');
        document.getElementById('timerSubjectSelect')?.focus();
        showToast(
          'Ainda não há uma recomendação elegível. Você pode iniciar uma sessão livre ou revisar o planejamento.'
        );
      }
    } else if (command.tab) {
      activateTab(command.tab);
    }
  }

  function mount(): void {
    const paletteMount =
      typeof globalThis.document !== 'undefined' &&
      document === (globalThis.document as unknown) &&
      typeof document.getElementById === 'function'
        ? document.getElementById('globalCommandPaletteMount')
        : null;
    if (!paletteMount) return;

    const openButton =
      typeof document.getElementById === 'function'
        ? document.getElementById('globalSearchOpenBtn')
        : null;

    const syncTriggerAria = (open: boolean) => {
      openButton?.setAttribute('aria-expanded', String(open));
    };

    const isMac = Boolean(window?.navigator?.platform?.toUpperCase().includes('MAC'));
    if (openButton && isMac) {
      const kbdEl = openButton.querySelector('.global-search-trigger__kbd');
      if (kbdEl) kbdEl.textContent = '⌘K';
      openButton.setAttribute('aria-keyshortcuts', 'Meta+K');
    }

    const renderPalette = () => {
      const { actionCommands, navCommands, topics } = filterCommandsForQuery(paletteQuery);
      syncTriggerAria(paletteOpen);
      mountPreact(
        h(GlobalCommandPalette, {
          open: paletteOpen,
          query: paletteQuery,
          actionCommands,
          navCommands,
          topics,
          onOpenChange: nextOpen => {
            paletteOpen = nextOpen;
            renderPalette();
          },
          onQueryChange: nextQuery => {
            paletteQuery = nextQuery;
            renderPalette();
          },
          onExecuteCommand: command => {
            executeCommandSpec(command);
          },
          onSelectTopic: (subjectId, topicId) => {
            jumpToTopic(subjectId, topicId);
          },
        }),
        paletteMount
      );
    };

    openButton?.addEventListener('click', () => {
      if (
        typeof document.querySelector === 'function' &&
        document.querySelector('dialog[open], .modal-overlay.show, .overlay.show')
      ) {
        return;
      }
      paletteOpen = true;
      renderPalette();
    });

    renderPalette();
  }

  return {
    mount,
    performSearch: (q: string) => performGlobalSearch(q, getState().subjects || []),
  };
}
