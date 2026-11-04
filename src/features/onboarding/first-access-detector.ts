/**
 * First Access Detector
 *
 * Avalia de forma pura e determinística se a sessão atual corresponde
 * ao primeiro acesso de um usuário ao Extrato de Estudos (cold start limpo sem dados).
 *
 * Regras:
 * - Sem disciplinas cadastradas
 * - Sem sessões de estudo
 * - Sem planos semanais gerados
 * - Sem questões registradas
 * - Sem data de prova definida
 * - Modo Demo e Modo Teste não disparam o modal automático
 * - Usuário que já dispensou o modal não é interrompido novamente
 *
 * Camada: Feature / Application (Determinístico, sem dependência de DOM).
 */

export interface FirstAccessEvaluationOptions {
  isDemoMode?: boolean;
  isTestMode?: boolean;
  isAutomation?: boolean;
  forceFirstAccess?: boolean;
  storage?: {
    getItem: (key: string) => string | null;
    setItem?: (key: string, val: string) => void;
  } | null;
}

export const FIRST_ACCESS_STORAGE_KEY = 'extrato:first-access-dismissed';
export const LEGACY_FIRST_ACCESS_STORAGE_KEY = 'studytrack:first-access-dismissed';

export function isFirstAccessSession(
  state: any,
  options: FirstAccessEvaluationOptions = {}
): boolean {
  if (options.isDemoMode) {
    return false;
  }

  if (options.isTestMode && !options.forceFirstAccess) {
    return false;
  }

  if (options.isAutomation && !options.forceFirstAccess) {
    return false;
  }

  if (!state || typeof state !== 'object') {
    return false;
  }

  // Se o usuário já dispensou explicitamente o modal de primeiro acesso nesta máquina
  try {
    const storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (
      !options.forceFirstAccess &&
      (storage?.getItem(FIRST_ACCESS_STORAGE_KEY) === 'true' ||
        storage?.getItem(LEGACY_FIRST_ACCESS_STORAGE_KEY) === 'true')
    ) {
      return false;
    }
  } catch {
    // Falha silenciosa caso localStorage não esteja acessível (ex: iframe sandbox restrito)
  }

  const hasSubjects = Array.isArray(state.subjects) && state.subjects.length > 0;
  const hasSessions = Array.isArray(state.studySessions) && state.studySessions.length > 0;
  const hasPlans = Array.isArray(state.studyPlans) && state.studyPlans.length > 0;
  const hasQuestions = Array.isArray(state.questoes) && state.questoes.length > 0;
  const hasExamDate = Boolean(state.examDate);

  return !hasSubjects && !hasSessions && !hasPlans && !hasQuestions && !hasExamDate;
}

export function markFirstAccessDismissed(
  storage?: { setItem: (key: string, val: string) => void } | null
): void {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    s?.setItem(FIRST_ACCESS_STORAGE_KEY, 'true');
  } catch {
    // Falha silenciosa
  }
}
