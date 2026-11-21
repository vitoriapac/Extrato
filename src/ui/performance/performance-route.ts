/**
 * Endereço das subabas de Desempenho. O estado interno usa chaves em inglês (`questions`, `simulations`, `exam`);
 * o endereço público das três seções de "Análise de resultados" é em português. Os endereços antigos continuam valendo.
 */
const PUBLIC_ROUTE: Record<string, string> = {
  questions: 'resultados',
  simulations: 'simulados',
  exam: 'inteligencia',
};
const ROUTE_ALIAS: Record<string, string> = {
  resultados: 'questions',
  simulados: 'simulations',
  inteligencia: 'exam',
  // Endereços antigos e variações comuns.
  provas: 'questions',
  exams: 'exam',
};

export const sectionFromRoute = (name: string): string => ROUTE_ALIAS[name] ?? name;
export const routeOfSection = (section: string): string => PUBLIC_ROUTE[section] ?? section;
