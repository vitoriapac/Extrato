/**
 * Parser de Edital Bruto / PDF (src/application/subjects/raw-syllabus-parser.ts)
 *
 * Processa texto bruto copiado diretamente de editais em PDF (padrões Cebraspe, FGV, FCC, etc.),
 * reconhecendo disciplinas, tópicos numerados, subitens e marcadores hierárquicos.
 */

export interface ParsedSyllabusTopic {
  name: string;
  code?: string;
}

export interface ParsedSyllabusSubject {
  name: string;
  topics: ParsedSyllabusTopic[];
}

export interface RawSyllabusParsedResult {
  subjects: ParsedSyllabusSubject[];
  totalSubjects: number;
  totalTopics: number;
  warnings: string[];
}

const DISCIPLINE_PREFIX_REGEX = /^(?:disciplina|mat[eé]ria|conte[uú]do|m[oó]dulo)\s*:\s*/i;

/** Expressão para detectar números hierárquicos: ex: "1", "1.1", "1.1.2", "12.3" */
const NUMBERED_ITEM_REGEX = /(?:^|\s)(?:(\d+(?:\.\d+)*)\s*[-.)]\s*|\b(\d+(?:\.\d+)+)\s+)/;

/**
 * Avalia se uma linha de texto deve ser interpretada como cabeçalho de disciplina.
 */
function isDisciplineHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Prefixo explícito: "Disciplina: Direito Penal"
  if (DISCIPLINE_PREFIX_REGEX.test(trimmed)) return true;

  // Linha terminada em dois pontos: "DIREITO CONSTITUCIONAL:" ou "Direito Administrativo:"
  if (trimmed.endsWith(':') && !NUMBERED_ITEM_REGEX.test(trimmed)) return true;

  // Linha curta totalmente em maiúsculas sem números iniciais (ex: "LÍNGUA PORTUGUESA")
  const stripped = trimmed.replace(/[^a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]/g, '').trim();
  if (
    stripped.length >= 3 &&
    stripped.length <= 60 &&
    stripped === stripped.toUpperCase() &&
    !/^\d/.test(trimmed)
  ) {
    return true;
  }

  return false;
}

/**
 * Limpa o nome da disciplina retirando pontuação e prefixos.
 */
function cleanDisciplineName(line: string): string {
  return line
    .replace(DISCIPLINE_PREFIX_REGEX, '')
    .replace(/[:.]+$/, '')
    .trim();
}

/**
 * Extrai tópicos de uma linha de texto que pode conter itens múltiplos contínuos.
 * Exemplo: "1 Atos administrativos. 1.1 Conceito e requisitos. 1.2 Anulação. 2 Processo."
 */
function extractTopicsFromText(text: string): ParsedSyllabusTopic[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Se a linha começa com marcador de bullet: "-", "•", "*"
  if (/^[-*•–]\s+/.test(trimmed)) {
    const name = trimmed.replace(/^[-*•–]\s+/, '').trim();
    return name ? [{ name }] : [];
  }

  // Verifica se há padrões com numeração explícita ao longo do texto
  // Ex: "1. Atos. 2. Contratos." ou "1 Atos. 1.1 Elementos."
  const segments: ParsedSyllabusTopic[] = [];

  // Regex global para capturar divisores de tópicos numerados: "(1) ", "1. ", "1.1 ", "1 - ", "1 Atos"
  const splitRegex =
    /(?:^|\.\s+|\s{2,})(?:(\d+(?:\.\d+)*)\s*[-.)]\s*|(\d+(?:\.\d+)*)\s+(?=[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]))/g;
  let lastIndex = 0;
  let lastCode: string | undefined;
  let match: RegExpExecArray | null;

  while ((match = splitRegex.exec(trimmed)) !== null) {
    const matchIndex = match.index;
    const code = match[1] || match[2];

    if (matchIndex > lastIndex && lastCode !== undefined) {
      const topicText = trimmed
        .slice(lastIndex, matchIndex)
        .replace(/^[.\s-]+/, '')
        .trim();
      if (topicText) {
        segments.push({
          name: topicText,
          code: lastCode,
        });
      }
    } else if (matchIndex > 0 && lastCode === undefined) {
      // Texto antes do primeiro número
      const prefixText = trimmed
        .slice(0, matchIndex)
        .replace(/^[.\s-]+/, '')
        .trim();
      if (prefixText) {
        segments.push({ name: prefixText });
      }
    }

    lastCode = code;
    lastIndex = matchIndex + match[0].length;
  }

  // Captura o último segmento remanescente
  if (lastCode !== undefined && lastIndex < trimmed.length) {
    const topicText = trimmed
      .slice(lastIndex)
      .replace(/^[.\s-]+/, '')
      .trim();
    if (topicText) {
      segments.push({
        name: topicText,
        code: lastCode,
      });
    }
  }

  // Se nenhum padrão numérico foi detectado, trata a linha inteira como um único tópico
  if (segments.length === 0) {
    const cleanLine = trimmed.replace(/^[.\s-]+/, '').trim();
    if (cleanLine) {
      segments.push({ name: cleanLine });
    }
  }

  return segments;
}

/**
 * Analisa texto de edital em formato bruto e o transforma em estrutura de disciplinas e tópicos.
 */
export function parseRawSyllabusText(rawText: string): RawSyllabusParsedResult {
  const warnings: string[] = [];
  const normalized = (rawText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      subjects: [],
      totalSubjects: 0,
      totalTopics: 0,
      warnings: ['O texto informado está vazio.'],
    };
  }

  const subjects: ParsedSyllabusSubject[] = [];
  let currentSubject: ParsedSyllabusSubject | null = null;

  for (const line of lines) {
    // 1. Verifica se a linha contém cabeçalho de disciplina (em linha própria ou antes de dois pontos)
    // Ex: "DIREITO ADMINISTRATIVO: 1 Estado..." ou "LÍNGUA PORTUGUESA:"
    const inlineHeaderMatch =
      /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]{3,60}|(?:disciplina|mat[eé]ria)\s*:\s*[^:\n]+):\s*(.*)$/i.exec(line);
    let topicLine = line;

    if (inlineHeaderMatch) {
      const subjectName = cleanDisciplineName(inlineHeaderMatch[1]);
      currentSubject = { name: subjectName, topics: [] };
      subjects.push(currentSubject);
      topicLine = inlineHeaderMatch[2];
      if (!topicLine.trim()) continue;
    } else if (isDisciplineHeader(line)) {
      const name = cleanDisciplineName(line);
      currentSubject = { name, topics: [] };
      subjects.push(currentSubject);
      continue;
    }

    // 2. Linha com possíveis tópicos
    const topics = extractTopicsFromText(topicLine);

    if (topics.length > 0) {
      if (!currentSubject) {
        // Tópicos antes de qualquer cabeçalho: cria disciplina padrão "Conteúdo Programático"
        currentSubject = { name: 'Conteúdo Programático', topics: [] };
        subjects.push(currentSubject);
        warnings.push(
          'Tópicos encontrados antes de uma disciplina explícita foram agrupados em "Conteúdo Programático".'
        );
      }

      currentSubject.topics.push(...topics);
    }
  }

  // Deduplicação leve e contagem total
  const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0);

  return {
    subjects,
    totalSubjects: subjects.length,
    totalTopics,
    warnings,
  };
}
