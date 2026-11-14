/**
 * Tamanho lógico (viewBox) de um gráfico, escolhido na hora de desenhar.
 *
 * No desktop vale o tamanho de projeto de cada gráfico. Abaixo de 600 px o viewBox acompanha a largura do
 * cartão e a altura tem mínimo de 180 px (regra de tamanho da seção 14.3), em vez de comprimir uma geometria
 * de 640 px numa tela de 320. Sem `window` (testes em Node) devolve o tamanho de projeto.
 */
export const NARROW_CHART_BREAKPOINT = 600;
const MIN_NARROW_HEIGHT = 180;

export function isNarrowViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth > 0 && window.innerWidth < NARROW_CHART_BREAKPOINT;
}

export function chartSize(width: number, height: number): { width: number; height: number } {
  if (!isNarrowViewport()) return { width, height };
  const narrow = Math.min(width, Math.max(260, window.innerWidth - 64));
  return { width: narrow, height: Math.max(MIN_NARROW_HEIGHT, Math.round((height * narrow) / width)) };
}
