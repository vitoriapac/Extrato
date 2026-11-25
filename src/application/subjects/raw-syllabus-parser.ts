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

const PDF_NOISE_LINE_REGEX =
  /^(?:p[áa]g(?:ina)?\.?\s*\d+(?:\s*(?:de|\/)\s*\d+)?|\d+\s*\/\s*\d+|edital\s*(?:n[ºo°.]*\s*)?\d+.*)$/i;

const SECTION_BANNER_REGEX =
  /^(?:anexo\s+[ivxlcdm\d]+.*|conte[úu]do\s+program[áa]tico|conhecimentos\s+(?:b[áa]sicos|gerais|espec[íi]ficos)|(?:parte|bloco)\s+[ivxlcdm\d]+)$/i;

/** Expressão para detectar números hierárquicos: ex: "1", "1.1", "1.1.2", "12.3" */
const NUMBERED_ITEM_REGEX = /(?:^|\s)(?:(\d+(?:\.\d+)*)\s*[-.)]\s*|\b(\d+(?:\.\d+)+)\s+)/;

const LEGAL_TOKEN_REGEX =
  /\b(?:Lei(?:\s+Complementar)?|LC|Decreto(?:-Lei)?|Emenda\s+Constitucional|EC|Resolu[çc][aã]o|Portaria|Instru[çc][aã]o\s+Normativa|IN|Medida\s+Provis[óo]ria|MP|Art(?:igo)?s?\.?|Par[áa]grafo|§|S[úu]mula(?:\s+Vinculante)?|SV|Tema(?:\s+Repetitivo)?|CF)\s*(?:n[ºo°.]*\s*)?\d+(?:[./\-º°]\d+)*(?:\/\d{2,4})?|\b\d{1,3}\.\d{3}(?!\.\d)/gi;

function protectLegalTokens(text: string): { masked: string; tokens: string[] } {
  const tokens: string[] = [];
  const masked = text.replace(LEGAL_TOKEN_REGEX, match => {
    const idx = tokens.length;
    tokens.push(match);
    return `\uE000L${idx}\uE001`;
  });
  return { masked, tokens };
}

function restoreLegalTokens(text: string, tokens: string[]): string {
  return text.replace(/\uE000L(\d+)\uE001/g, (_, idx) => tokens[Number(idx)] ?? '');
}

/**
 * Quebra linhas longas no padrão FGV em prosa (separadas por ";" ou "Subtema: item a, item b")
 * mantendo tokens jurídicos e referências de lei protegidos.
 */
export function splitFgvProseTopics(line: string): string[] {
  const trimmed = String(line ?? '').trim();
  if (!trimmed) return [];
  const { masked, tokens } = protectLegalTokens(trimmed);

  // Separa apenas em ";" fora de parênteses quando há múltiplos segmentos ou linha > 110 caracteres.
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < masked.length; i++) {
    const ch = masked[i];
    if (ch === '(') depth++;
    else if (ch === ')' && depth > 0) depth--;
    else if (ch === ';' && depth === 0) {
      parts.push(masked.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(masked.slice(start));

  const cleanParts = parts
    .map(part =>
      restoreLegalTokens(part, tokens)
        .replace(/^[.\s;]+|[.\s;]+$/g, '')
        .trim()
    )
    .filter(Boolean);

  if (cleanParts.length <= 1 && trimmed.length <= 110) {
    return [trimmed];
  }

  const expanded: string[] = [];
  for (const seg of cleanParts) {
    const colonIdx = seg.indexOf(':');
    if (colonIdx > 2 && colonIdx <= 55 && seg.length > 110) {
      const prefix = seg.slice(0, colonIdx).trim();
      const body = seg.slice(colonIdx + 1).trim();
      const subItems = body
        .split(/\s*,\s*(?=[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]|[a-záéíóúâêîôûãõç]{4,})/)
        .map(s => s.replace(/\.$/, '').trim())
        .filter(Boolean);
      if (subItems.length >= 3 && subItems.every(s => s.length >= 12)) {
        for (const sub of subItems) {
          expanded.push(`${prefix}: ${sub}`);
        }
        continue;
      }
    }
    expanded.push(seg);
  }

  return expanded.length ? expanded : [trimmed];
}

function mergeWrappedPdfLines(rawLines: string[]): string[] {
  const merged: string[] = [];
  const endsWithSentenceStop = /[.:;?!]$/;
  const startsWithBulletOrCode = /^(?:[-*•–]\s+|\d+(?:\.\d+)*[-.)]?\s+|\([a-z0-9]+\)\s+)/i;
  const endsWithConnector = /\b(?:de|da|do|das|dos|e|ou|em|no|na|nos|nas|para|por|com|a|o|as|os|,)$/i;

  for (const current of rawLines) {
    if (!merged.length) {
      merged.push(current);
      continue;
    }
    const prev = merged[merged.length - 1];
    const shouldMerge =
      !isDisciplineHeader(prev) &&
      !isDisciplineHeader(current) &&
      !endsWithSentenceStop.test(prev) &&
      !startsWithBulletOrCode.test(current) &&
      (/^[a-záéíóúâêîôûãõç(]/.test(current) || endsWithConnector.test(prev));

    if (shouldMerge) {
      if (/[a-záéíóúâêîôûãõç]-$/i.test(prev) && /^[a-záéíóúâêîôûãõç]/i.test(current)) {
        merged[merged.length - 1] = `${prev.slice(0, -1)}${current}`.replace(/\s+/g, ' ');
      } else {
        merged[merged.length - 1] = `${prev} ${current}`.replace(/\s+/g, ' ');
      }
    } else {
      merged.push(current);
    }
  }
  return merged;
}

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
  const { masked, tokens } = protectLegalTokens(trimmed);
  const splitRegex =
    /(?:^|\.\s+|\s{2,})(?:(\d+(?:\.\d+)*)\s*[-.)]\s*|(\d+(?:\.\d+)*)\s+(?=[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]))/g;
  let lastIndex = 0;
  let lastCode: string | undefined;
  let match: RegExpExecArray | null;

  while ((match = splitRegex.exec(masked)) !== null) {
    const matchIndex = match.index;
    const code = match[1] || match[2];

    if (matchIndex > lastIndex && lastCode !== undefined) {
      const topicText = restoreLegalTokens(masked.slice(lastIndex, matchIndex), tokens)
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
      const prefixText = restoreLegalTokens(masked.slice(0, matchIndex), tokens)
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
  if (lastCode !== undefined && lastIndex < masked.length) {
    const topicText = restoreLegalTokens(masked.slice(lastIndex), tokens)
      .replace(/^[.\s-]+/, '')
      .trim();
    if (topicText) {
      segments.push({
        name: topicText,
        code: lastCode,
      });
    }
  }

  // Se nenhum padrão numérico foi detectado, verifica prosa FGV separada por ";" / subtema
  if (segments.length === 0) {
    const cleanLine = trimmed.replace(/^[.\s-]+/, '').trim();
    if (cleanLine) {
      const proseTopics = splitFgvProseTopics(cleanLine);
      for (const name of proseTopics) {
        if (name) segments.push({ name });
      }
    }
  } else {
    // Expande segmentos longos sem código adicional caso contenham prosa FGV separada por ";"
    const refined: ParsedSyllabusTopic[] = [];
    for (const seg of segments) {
      if (seg.name.includes(';') && (seg.name.length > 110 || !seg.code)) {
        const subTopics = splitFgvProseTopics(seg.name);
        if (subTopics.length > 1) {
          subTopics.forEach((name, idx) =>
            refined.push({
              name,
              ...(seg.code ? { code: idx === 0 ? seg.code : `${seg.code}.${idx + 1}` } : {}),
            })
          );
          continue;
        }
      }
      refined.push(seg);
    }
    return refined;
  }

  return segments;
}

/**
 * Analisa texto de edital em formato bruto e o transforma em estrutura de disciplinas e tópicos.
 */
export function parseRawSyllabusText(rawText: string): RawSyllabusParsedResult {
  const warnings: string[] = [];
  const normalized = (rawText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = mergeWrappedPdfLines(
    normalized
      .split('\n')
      .map(l => l.trim())
      .filter(l => Boolean(l) && !PDF_NOISE_LINE_REGEX.test(l) && !SECTION_BANNER_REGEX.test(l))
  );

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
    // Ex: "DIREITO ADMINISTRATIVO: 1 Estado...", "RACIOCÍNIO LÓGICO-MATEMÁTICO: 1 ...", "LÍNGUA PORTUGUESA:"
    const inlineHeaderMatch =
      /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ0-9\s\-/()&,]{2,70}|(?:disciplina|mat[eé]ria)\s*:\s*[^:\n]+):\s*(.*)$/.exec(
        line
      );
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

  // Remove disciplinas vazias caso algum cabeçalho de seção tenha ficado sem tópicos
  const nonEmptySubjects = subjects.filter(s => s.topics.length > 0);
  const totalTopics = nonEmptySubjects.reduce((sum, s) => sum + s.topics.length, 0);

  return {
    subjects: nonEmptySubjects,
    totalSubjects: nonEmptySubjects.length,
    totalTopics,
    warnings,
  };
}

/**
 * Junta um tópico quebrado pelo PDF ao tópico imediatamente anterior na mesma disciplina.
 */
export function mergeParsedSyllabusTopics(
  subjects: ParsedSyllabusSubject[],
  subjectIndex: number,
  topicIndex: number
): ParsedSyllabusSubject[] {
  const target = subjects[subjectIndex];
  if (!target || topicIndex <= 0 || topicIndex >= target.topics.length) return subjects;
  const nextTopics = target.topics.map(t => ({ ...t }));
  const current = nextTopics[topicIndex];
  const prev = nextTopics[topicIndex - 1];
  prev.name = `${prev.name.replace(/[-]+$/, '')} ${current.name}`.replace(/\s+/g, ' ').trim();
  nextTopics.splice(topicIndex, 1);
  return subjects.map((s, idx) => (idx === subjectIndex ? { ...s, topics: nextTopics } : s));
}

/**
 * Divide um tópico longo em múltiplos tópicos usando um separador (padrão ";").
 */
export function splitParsedSyllabusTopic(
  subjects: ParsedSyllabusSubject[],
  subjectIndex: number,
  topicIndex: number,
  delimiter = ';'
): ParsedSyllabusSubject[] {
  const target = subjects[subjectIndex];
  const topic = target?.topics[topicIndex];
  if (!target || !topic || !topic.name.includes(delimiter)) return subjects;
  const parts = topic.name
    .split(delimiter)
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return subjects;
  const nextTopics = [...target.topics];
  nextTopics.splice(
    topicIndex,
    1,
    ...parts.map((name, idx) => ({
      name,
      ...(topic.code ? { code: idx === 0 ? topic.code : `${topic.code}.${idx + 1}` } : {}),
    }))
  );
  return subjects.map((s, idx) => (idx === subjectIndex ? { ...s, topics: nextTopics } : s));
}

/**
 * Exporta o edital estruturado no formato JSON padrão do Extrato de Estudos.
 */
export function serializeParsedSyllabusJson(
  result: Pick<RawSyllabusParsedResult, 'subjects'>,
  examMeta: { name?: string; banca?: string; year?: number } = {}
): string {
  return JSON.stringify(
    {
      ...(examMeta.name ? { name: examMeta.name } : {}),
      ...(examMeta.banca ? { banca: examMeta.banca } : {}),
      ...(examMeta.year ? { year: examMeta.year } : {}),
      subjects: (result.subjects || []).map(s => ({
        name: s.name,
        topics: (s.topics || []).map(t => ({
          name: t.name,
          ...(t.code ? { code: t.code } : {}),
        })),
      })),
    },
    null,
    2
  );
}
