/**
 * Utilitários de Acessibilidade (A11y)
 * Gerencia anúncios para tecnologias assistivas (leitores de tela) via regiões aria-live.
 */

export type TimerEvent = 'start' | 'pause' | 'reset' | 'finish';

const TIMER_MESSAGES: Record<TimerEvent, string> = {
  start: 'Cronômetro iniciado.',
  pause: 'Cronômetro pausado.',
  reset: 'Cronômetro zerado.',
  finish: 'Cronômetro finalizado. Abrindo registro de sessão.',
};

/**
 * Atualiza o conteúdo textual de uma região aria-live de forma assíncrona
 * para garantir que leitores de tela (NVDA, VoiceOver, JAWS) registrem e anunciem a alteração.
 */
export function announceAriaLive(elementId: string, message: string): void {
  if (typeof document === 'undefined') return;
  const container = document.getElementById(elementId);
  if (!container) return;
  container.textContent = '';
  setTimeout(() => {
    container.textContent = message;
  }, 30);
}

/**
 * Anuncia eventos de estado do cronômetro para leitores de tela na região #timerAriaLive.
 */
export function announceTimerEvent(event: TimerEvent): void {
  const message = TIMER_MESSAGES[event];
  if (message) {
    announceAriaLive('timerAriaLive', message);
  }
}
