/**
 * @fileoverview Gerador determinístico de links diretos para plataformas de questões (TEC Concursos e QConcursos).
 * Normaliza nomes de tópicos de editais (removendo numerações, numerais romanos, alíneas e marcadores)
 * e gera URLs diretas de cadernos de questões ou busca filtrada.
 */

export interface PracticeLinkOptions {
  topicName: string;
  subjectName?: string;
  customUrl?: string | null;
}

export interface PracticeLinks {
  readonly query: string;
  readonly cleanedTopicName: string;
  readonly tecUrl: string;
  readonly qcUrl: string;
  readonly customUrl: string | null;
  readonly primaryUrl: string;
  readonly primaryLabel: string;
  readonly isCustom: boolean;
}

const COMMON_GENERIC_TOPIC_WORDS = new Set([
  'conceito',
  'conceitos',
  'principios',
  'princípios',
  'introducao',
  'introdução',
  'classificacao',
  'classificação',
  'especies',
  'espécies',
  'disposicoes gerais',
  'disposições gerais',
  'teoria geral',
  'competencia',
  'competência',
  'natureza juridica',
  'natureza jurídica',
  'disposicoes finais',
  'disposições finais',
  'regras gerais',
  'disposicoes preliminares',
  'disposições preliminares',
]);

/**
 * Remove prefixos de numeração e marcadores de tópicos de editais de concurso.
 * Exemplos:
 * - "1.1 Atos Administrativos" -> "Atos Administrativos"
 * - "1.1.2 - Poder de Polícia" -> "Poder de Polícia"
 * - "I - Direitos Fundamentais" -> "Direitos Fundamentais"
 * - "a) Teoria Geral" -> "Teoria Geral"
 * - "• Crimes contra a Adm Pública" -> "Crimes contra a Adm Pública"
 * - "[NOVO] 1. Crase" -> "Crase"
 */
export function cleanTopicName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') return '';

  let cleaned = rawName.trim();

  // 1. Remove tags entre colchetes ou parênteses no início (ex.: [NOVO], (ATUALIZADO))
  cleaned = cleaned.replace(/^\s*(?:\[[^\]]+\]|\([^)]+\))\s*/gi, '');

  // 2. Remove numeração hierárquica (ex: 1., 1.1, 1.1.2, 10.4.1.) ou alíneas/romanos (I -, IV., a))
  // Não remove artigos de leis (ex: "Art. 5º") pois "Art" tem mais de 1 caractere alfabético antes do ponto.
  cleaned = cleaned.replace(
    /^\s*(?:(?:\d+[\.\)])+(?:\d+)?|(?:[IVXLCDMivxlcdm]+(?:\.|\s*[-–\)]))|(?:[a-zA-Z][\.\)]))\s*[-–:]?\s*/,
    ''
  );

  // 3. Remove marcadores de lista no início (bullets, hífens, asteriscos)
  cleaned = cleaned.replace(/^\s*[\-\•\*\–\—\>]\s*/, '');

  // 4. Remove pontuações finais desnecessárias (pontos, vírgulas, dois-pontos, ponto-e-vírgula)
  cleaned = cleaned.replace(/[\.\,\;\:\-]+$/, '');

  // 5. Normaliza múltiplos espaços
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Se por algum motivo a limpeza esvaziou a string, retorna a versão original limpa
  return cleaned || rawName.trim();
}

/**
 * Constrói a query de busca otimizada para o sistema de questões.
 * Se o tópico for muito genérico ou curto, anexa a disciplina para evitar resultados dispersos.
 */
export function buildPracticeSearchQuery(topicName: string, subjectName?: string): string {
  const cleanedTopic = cleanTopicName(topicName);
  const cleanedSubject = subjectName ? cleanTopicName(subjectName) : '';

  if (!cleanedSubject) return cleanedTopic;
  if (!cleanedTopic) return cleanedSubject;

  const topicLower = cleanedTopic.toLowerCase();
  const subjectLower = cleanedSubject.toLowerCase();

  // Se o tópico já contém o nome da matéria, não precisa duplicar
  if (topicLower.includes(subjectLower)) {
    return cleanedTopic;
  }

  // Verifica se é um tópico genérico ou muito curto que precisa do contexto da disciplina
  const isGeneric = COMMON_GENERIC_TOPIC_WORDS.has(topicLower);
  const words = cleanedTopic.split(' ');
  const isVeryShort = words.length <= 2 && cleanedTopic.length <= 15;

  if (isGeneric || isVeryShort) {
    return `${cleanedSubject} ${cleanedTopic}`.trim();
  }

  return cleanedTopic;
}

/**
 * Valida se uma URL é segura (http/https).
 */
export function isValidPracticeUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim();
  return /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed);
}

/**
 * Gera URLs e metadados estruturados para resolução de questões no TEC Concursos e QConcursos.
 */
export function buildPracticeLinks(options: PracticeLinkOptions): PracticeLinks {
  const { topicName, subjectName, customUrl } = options;
  const cleanedTopicName = cleanTopicName(topicName);
  const query = buildPracticeSearchQuery(topicName, subjectName);
  const encodedQuery = encodeURIComponent(query);

  const tecUrl = `https://www.tecconcursos.com.br/questoes/cadernos?q=${encodedQuery}`;
  const qcUrl = `https://www.qconcursos.com/questoes-de-concursos/questoes?q=${encodedQuery}`;

  const validCustomUrl = isValidPracticeUrl(customUrl) ? customUrl.trim() : null;
  const isCustom = Boolean(validCustomUrl);

  const primaryUrl = validCustomUrl || tecUrl;
  const primaryLabel = isCustom ? 'Caderno do tópico' : 'Questões no TEC';

  return Object.freeze({
    query,
    cleanedTopicName,
    tecUrl,
    qcUrl,
    customUrl: validCustomUrl,
    primaryUrl,
    primaryLabel,
    isCustom,
  });
}
