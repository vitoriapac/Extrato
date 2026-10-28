export interface DelegatedArgumentOptions {
  getTodayDayOfWeek?: () => number;
}

export function createDelegatedArgumentResolver(options?: DelegatedArgumentOptions) {
  return function delegatedArgument(expression: string, element: any): any {
    const value = expression.trim();
    if (value === 'this.value') return element?.value;
    if (value === 'this.value||null') return element?.value || null;
    if (value === 'this.textContent') return element?.textContent;
    if (value === 'this.checked') return Boolean(element?.checked);
    if (value === 'this') return element;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (value === 'parseLocalDate(todayISO()).getDay()') {
      return options?.getTodayDayOfWeek ? options.getTodayDayOfWeek() : new Date().getDay();
    }
    if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      return value.slice(1, -1).replace(/\\(['"\\])/g, '$1');
    }
    throw new Error('Argumento de evento não permitido: ' + value);
  };
}

export interface DelegatedSpecialOptions {
  onSetPerformanceSubject: (value: string) => void;
  renderQuestionAnalytics: () => void;
  getListViewSteps: () => Record<string, number>;
  getListViewState: () => Record<string, number>;
  changeListLimit: (listKey: string, delta: number, renderer: () => void) => void;
  getRenderers: () => Record<string, () => void>;
}

export function createSpecialActionResolver(options: DelegatedSpecialOptions) {
  return function resolveDelegatedSpecial(
    normalized: string,
    _event: Event,
    element: any
  ): boolean {
    if (normalized === 'performanceSubjectId=this.value;renderQuestionAnalytics()') {
      options.onSetPerformanceSubject(element?.value);
      options.renderQuestionAnalytics();
      return true;
    }
    const listMatch = normalized.match(
      /^changeListLimit\('(questions|simulations|sessionDays)',(-?)(?:LIST_VIEW_STEPS\.\1|listViewState\.\1Visible),(renderQuestoes|renderSimulados|renderStudySessionsHistory)\)$/
    );
    if (listMatch) {
      const steps = options.getListViewSteps();
      const state = options.getListViewState();
      const delta = listMatch[2] ? -state[`${listMatch[1]}Visible`] : steps[listMatch[1]];
      const renderers = options.getRenderers();
      const targetRenderer = renderers[listMatch[3]];
      if (typeof targetRenderer === 'function') {
        options.changeListLimit(listMatch[1], delta, targetRenderer);
      }
      return true;
    }
    return false;
  };
}

/**
 * Combina múltiplos mapas de ações delegadas em um único dicionário seguro (sem protótipo).
 * Filtra propriedades que não sejam funções para evitar injeções.
 */
export function composeDelegatedActionHandlers(
  ...handlerGroups: Array<Record<string, any>>
): Record<string, Function> {
  const result: Record<string, Function> = Object.create(null);
  for (const group of handlerGroups) {
    if (!group || typeof group !== 'object') continue;
    for (const [key, fn] of Object.entries(group)) {
      if (typeof fn === 'function') {
        result[key] = fn;
      }
    }
  }
  return result;
}

