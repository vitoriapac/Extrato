import { renderGlobalSearchPanel } from '../renderers/global-search-renderer.js';
import { escapeHtml as defaultEscapeHtml } from '../../core/utils.js';

export interface SearchCommand {
  label: string;
  keywords: string;
  tab?: string;
  action?: string;
}

export const SEARCH_COMMANDS: SearchCommand[] = [
  { label: 'Visão Geral', keywords: 'inicio dashboard resumo prontidao', tab: 'dashboard' },
  {
    label: 'Abrir Desempenho',
    keywords: 'evolucao historico tendencias comparacao progresso',
    tab: 'desempenho',
  },
  { label: 'Ir para Hoje', keywords: 'hoje tarefa recomendacao estudo', tab: 'hoje' },
  {
    label: 'Iniciar recomendação prioritária',
    keywords: 'começar iniciar próxima ação estudar recomendação prioritária',
    action: 'recommendation',
  },
  { label: 'Abrir cronômetro', keywords: 'iniciar sessao timer estudar foco', action: 'timer' },
  { label: 'Abrir Disciplinas', keywords: 'materias edital topicos', tab: 'disciplinas' },
  {
    label: 'Carregar edital do catálogo',
    keywords: 'importar edital concurso bb caixa',
    action: 'exam-import',
  },
  {
    label: 'Importar JSON ou CSV',
    keywords: 'importar arquivo conteudo disciplinas',
    action: 'structured-import',
  },
  { label: 'Abrir Calendário', keywords: 'calendario sessoes datas', tab: 'calendario' },
  { label: 'Abrir Agenda de Revisões', keywords: 'agenda revisao atrasadas', tab: 'agenda' },
  { label: 'Adicionar revisão', keywords: 'criar nova revisão agenda', action: 'add-review' },
  {
    label: 'Abrir Questões e Simulados',
    keywords: 'questoes erros simulados desempenho',
    tab: 'questoes',
  },
  {
    label: 'Registrar questões',
    keywords: 'lancar registrar acertos erros',
    action: 'add-questions',
  },
  {
    label: 'Abrir Planejamento e metas',
    keywords: 'metas capacidade plano planejamento estrategia',
    tab: 'metas',
  },
  { label: 'Ver Diagnóstico', keywords: 'diagnostico lacunas prioridades', action: 'diagnosis' },
  { label: 'Planejar semana', keywords: 'plano semanal distribuir carga', tab: 'metas' },
  { label: 'Abrir Instruções', keywords: 'ajuda guia como usar instrucoes', tab: 'instrucoes' },
  { label: 'Exportar backup', keywords: 'backup salvar dados json', action: 'backup' },
  {
    label: 'Exportar relatório PDF',
    keywords: 'pdf relatorio imprimir exportar',
    action: 'report',
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
  const escapeHtml = options.escapeHtml || defaultEscapeHtml;
  const escapeAttr = options.escapeAttr || escapeHtml;

  function renderResults(): void {
    const input = document.getElementById('globalSearchInput') as HTMLInputElement | null;
    const panel = document.getElementById('globalSearchResults');
    if (!input || !panel) return;

    const q = input.value;
    const normalized = normalizeSearchText(q.trim());
    const commands = (
      normalized
        ? SEARCH_COMMANDS.filter(item =>
            normalizeSearchText(`${item.label} ${item.keywords}`).includes(normalized)
          )
        : SEARCH_COMMANDS
    ).slice(0, 18);
    const results = normalized ? performGlobalSearch(q, getState().subjects || []) : [];

    panel.innerHTML = renderGlobalSearchPanel({
      query: q,
      commands,
      results,
      escapeHtml,
      escapeAttr,
    });
    panel.classList.add('show');
    input.setAttribute('aria-expanded', 'true');

    if (typeof input.getBoundingClientRect === 'function') {
      const inputRect = input.getBoundingClientRect();
      const left = Math.max(8, inputRect.left);
      const width = Math.min(inputRect.width, window.innerWidth - left - 8);
      const top = Math.min(inputRect.bottom + 4, window.innerHeight - 80);
      panel.style.left = `${left}px`;
      panel.style.width = `${Math.max(180, width)}px`;
      panel.style.top = `${Math.max(8, top)}px`;
    }
  }

  function handleActionClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('.search-result-item') as HTMLElement | null;
    if (!button) return;

    if (button.dataset.searchTopic) {
      jumpToTopic(button.dataset.searchSubject || '', button.dataset.searchTopic);
      return;
    }

    const action = button.dataset.searchAction;
    const input = document.getElementById('globalSearchInput');
    const panel = document.getElementById('globalSearchResults');

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
    } else if (action === 'timer') {
      activateTab('dashboard');
      document.getElementById('timerSubjectSelect')?.focus();
    } else if (action === 'diagnosis') {
      activateTab('dashboard');
      document
        .getElementById('diagnosisCenter')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else if (action === 'recommendation') {
      const recommendations = options.getRecommendations ? options.getRecommendations() : [];
      const recommendation = recommendations[0];
      if (recommendation && options.onExecuteRecommendation) {
        options.onExecuteRecommendation(recommendation.id);
      } else {
        activateTab('hoje');
        showToast(
          'Ainda não há uma recomendação elegível. Revise o planejamento e as evidências disponíveis.'
        );
      }
    } else if (button.dataset.searchTab) {
      activateTab(button.dataset.searchTab);
    }

    panel?.classList.remove('show');
    input?.setAttribute('aria-expanded', 'false');
    input?.blur();
  }

  function mount(): void {
    const input = document.getElementById('globalSearchInput') as HTMLInputElement | null;
    const panel = document.getElementById('globalSearchResults');
    if (!input || !panel) return;

    input.addEventListener('input', renderResults);
    input.addEventListener('focus', renderResults);
    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (panel.contains(document.activeElement)) return;
        panel.classList.remove('show');
        input.setAttribute('aria-expanded', 'false');
      }, 150);
    });

    panel.addEventListener('click', handleActionClick);

    input.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
      const items = [...panel.querySelectorAll<HTMLElement>('.search-result-item')];
      const selected = event.key === 'ArrowUp' ? items.at(-1) : items[0];
      if (selected) {
        event.preventDefault();
        if (event.key === 'Enter') selected.click();
        else selected.focus();
      }
    });

    panel.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const items = [...panel.querySelectorAll<HTMLElement>('.search-result-item')];
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (!items.length) return;
      event.preventDefault();
      if (event.key === 'ArrowUp' && index === 0) {
        input.focus();
        return;
      }
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : event.key === 'ArrowDown'
              ? Math.min(items.length - 1, index + 1)
              : Math.max(0, index - 1);
      items[next]?.focus();
    });
  }

  return {
    mount,
    renderResults,
    performSearch: (q: string) => performGlobalSearch(q, getState().subjects || []),
  };
}
