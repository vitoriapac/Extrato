import { performanceGroupOf } from './performance-page.js';

// Abre uma subaba de Desempenho por código. Se ela está num grupo inativo, o botão da seção
// ainda não existe: clica no grupo primeiro (o clique renderiza na hora) e depois na seção.
export function openPerformanceSection(doc: Document, section: string) {
  const find = () => doc.querySelector<HTMLElement>(`[data-performance-section="${section}"]`);
  if (!find()) {
    const group = performanceGroupOf(section);
    doc.querySelector<HTMLElement>(`[data-performance-group="${group}"]`)?.click();
  }
  find()?.click();
}
