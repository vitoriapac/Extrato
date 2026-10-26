const clean = (value: unknown) => String(value ?? '').trim();

export const normalizeKey = (value: unknown) =>
  clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR');

const finite = (value: unknown) => {
  if (value === '' || value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const HEADER_ALIASES: Record<string, string> = {
  disciplina: 'subject',
  materia: 'subject',
  subject: 'subject',
  topico: 'topic',
  assunto: 'topic',
  conteudo: 'topic',
  topic: 'topic',
  caderno: 'topic',
  data: 'date',
  'data da resolucao': 'date',
  'data resolucao': 'date',
  'data e hora': 'date',
  datahora: 'date',
  date: 'date',
  resolvidas: 'resolved',
  total: 'resolved',
  questoes: 'resolved',
  resolved: 'resolved',
  quantidade: 'resolved',
  'questoes resolvidas': 'resolved',
  'total de questoes': 'resolved',
  acertos: 'correct',
  corretas: 'correct',
  acertou: 'correct',
  correct: 'correct',
  'questoes certas': 'correct',
  erros: 'errors',
  incorretas: 'errors',
  errou: 'errors',
  incorrect: 'errors',
  errors: 'errors',
  'questoes erradas': 'errors',
  resultado: 'result',
  status: 'result',
  situacao: 'result',
  erro: 'errorCategory',
  motivo: 'errorCategory',
  categoria: 'errorCategory',
  'categoria do erro': 'errorCategory',
  'tipo de erro': 'errorCategory',
  errorcategory: 'errorCategory',
};

const RESULT_CORRECT = new Set([
  'acertou',
  'certo',
  'certa',
  'correta',
  'correto',
  '1',
  'sim',
  's',
  'true',
  'ok',
]);
const RESULT_WRONG = new Set([
  'errou',
  'errado',
  'errada',
  'incorreta',
  'incorreto',
  '0',
  'nao',
  'n',
  'false',
]);

// Valores do CSV (já normalizados por normalizeKey) → chaves de ERROR_CATEGORIES do app.
const ERROR_CATEGORY_MAP: Record<string, string> = {
  lacuna: 'naoSabia',
  conteudo: 'naoSabia',
  'nao sabia': 'naoSabia',
  naosabia: 'naoSabia',
  atencao: 'desatencao',
  distracao: 'desatencao',
  desatencao: 'desatencao',
  interpretacao: 'interpretacao',
  leitura: 'interpretacao',
  pegadinha: 'interpretacao',
  tempo: 'chute',
  chute: 'chute',
  esqueci: 'esqueci',
  calculo: 'calculo',
};

export class QuestionImportError extends TypeError {
  issues: any[];
  constructor(issues: any[] = []) {
    super('Não foi possível importar as questões.');
    this.name = 'QuestionImportError';
    this.issues = issues;
  }
}

const problem = (line: number | null, field: string, code: string, message: string) => ({
  line,
  field,
  code,
  message,
});

// Delimitador mais frequente na linha de cabeçalho (fora de aspas); empate → vírgula.
function detectDelimiter(text: string) {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  let quoted = false;
  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && (char === '\n' || char === '\r')) break;
    else if (!quoted && char in counts) counts[char]++;
  }
  return [';', '\t'].reduce(
    (best, candidate) => (counts[candidate] > counts[best] ? candidate : best),
    ','
  );
}

export function parseCsvRows(text: string) {
  const rows = [];
  const delimiter = detectDelimiter(text);
  let row = [],
    field = '',
    quoted = false,
    line = 1,
    rowLine = 1;
  for (let index = 0; index < text.length; index++) {
    const char = text[index],
      next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index++;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      row.push(field);
      field = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index++;
      row.push(field);
      if (row.some(val => clean(val))) rows.push({ values: row, line: rowLine });
      row = [];
      field = '';
      line++;
      rowLine = line;
      continue;
    }
    field += char;
  }
  row.push(field);
  if (row.some(val => clean(val))) rows.push({ values: row, line: rowLine });
  if (quoted)
    throw new QuestionImportError([
      problem(line, 'arquivo', 'unclosed_quote', 'Há aspas sem fechamento no CSV.'),
    ]);
  return rows;
}

// Date.parse aceita 31/02 (vira 03/03); o ida-e-volta só confirma datas reais do calendário.
const calendarDate = (iso: string) => {
  const parsed = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : null;
};

export function parseDate(rawDate: unknown, defaultDate = '') {
  const value = clean(rawDate);
  if (!value) return defaultDate || null;

  // DD/MM/YYYY or DD-MM-YYYY (with optional time)
  const brMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[\sT].*)?$/);
  if (brMatch)
    return calendarDate(
      `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`
    );

  // YYYY-MM-DD (with optional time)
  const isoMatch = value.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[\sT].*)?$/);
  if (isoMatch)
    return calendarDate(
      `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`
    );

  return null;
}

/**
 *   errorCategoryKeys: chaves de ERROR_CATEGORIES do app; obrigatório para que o domínio não tenha cópia da taxonomia.
 *   defaultDate: data local (AAAA-MM-DD) usada quando a linha não traz data; obrigatória, o domínio não lê o relógio.
 */
export function normalizeQuestionImportRows(
  text: string,
  {
    defaultDate = '',
    errorCategoryKeys,
  }: { defaultDate?: string; errorCategoryKeys?: string[] } = {}
) {
  if (!Array.isArray(errorCategoryKeys) || !errorCategoryKeys.length) {
    throw new TypeError('normalizeQuestionImportRows requer errorCategoryKeys.');
  }
  if (!calendarDate(String(defaultDate))) {
    throw new TypeError('normalizeQuestionImportRows requer defaultDate (AAAA-MM-DD).');
  }
  if (typeof text !== 'string' || !text.trim()) {
    throw new QuestionImportError([problem(null, 'arquivo', 'empty', 'O arquivo está vazio.')]);
  }

  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    throw new QuestionImportError([
      problem(
        null,
        'arquivo',
        'empty_csv',
        'O CSV precisa de cabeçalho e ao menos uma linha de dados.'
      ),
    ]);
  }

  const rawHeaders = rows.shift().values;
  const headers = rawHeaders.map(val => HEADER_ALIASES[normalizeKey(val)] || null);

  if (!headers.includes('subject')) {
    throw new QuestionImportError([
      problem(
        1,
        'disciplina',
        'missing_column',
        'A coluna "Disciplina" ou "Matéria" não foi encontrada.'
      ),
    ]);
  }

  const hasMetrics = headers.some(h => ['resolved', 'correct', 'errors', 'result'].includes(h));
  if (!hasMetrics) {
    throw new QuestionImportError([
      problem(
        1,
        'metricas',
        'missing_column',
        'O arquivo deve conter colunas de quantidade ("Resolvidas", "Acertos", "Erros") ou de "Resultado".'
      ),
    ]);
  }

  const issues: ReturnType<typeof problem>[] = [];
  const parsedRecords: Array<{
    line: number;
    subjectName: string;
    topicName: string | null;
    date: string | null;
    resolved: number;
    correct: number;
    errorCategory: string | null;
    unknownErrorCategory: boolean;
  }> = [];

  rows.forEach(({ values, line }) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) record[header] = clean(values[index]);
    });

    const subjectName = clean(record.subject);
    if (!subjectName) {
      issues.push(problem(line, 'disciplina', 'required', 'A disciplina não foi informada.'));
      return;
    }

    const topicName = clean(record.topic) || null;
    const rawDate = clean(record.date);
    const date = parseDate(rawDate, defaultDate);
    if (rawDate && !date) {
      issues.push(
        problem(
          line,
          'data',
          'invalid_date',
          `Data inválida "${rawDate}". Use o formato DD/MM/AAAA ou AAAA-MM-DD.`
        )
      );
      return;
    }

    let resolved = finite(record.resolved);
    let correct = finite(record.correct);
    let errors = finite(record.errors);
    const resultRaw = normalizeKey(record.result);

    if (resultRaw) {
      if (RESULT_CORRECT.has(resultRaw)) {
        resolved = 1;
        correct = 1;
        errors = 0;
      } else if (RESULT_WRONG.has(resultRaw)) {
        resolved = 1;
        correct = 0;
        errors = 1;
      }
    }

    if (resolved == null) {
      if (correct != null && errors != null) {
        resolved = correct + errors;
      } else if (correct != null) {
        resolved = correct;
      } else if (errors != null) {
        resolved = errors;
        correct = 0;
      }
    }

    if (correct == null && resolved != null && errors != null) {
      correct = Math.max(0, resolved - errors);
    }

    resolved = resolved == null ? null : Math.max(0, Math.floor(resolved));
    correct = correct == null ? null : Math.max(0, Math.floor(correct));

    if (resolved == null || resolved <= 0) {
      issues.push(
        problem(
          line,
          'resolvidas',
          'invalid_value',
          'A quantidade de questões resolvidas deve ser maior que zero.'
        )
      );
      return;
    }

    if (correct == null) {
      issues.push(
        problem(
          line,
          'acertos',
          'invalid_value',
          'Informe a quantidade de acertos ou o resultado da questão.'
        )
      );
      return;
    }

    if (correct > resolved) {
      issues.push(
        problem(
          line,
          'acertos',
          'range',
          'Os acertos não podem ser superiores ao total de questões resolvidas.'
        )
      );
      return;
    }

    const rawCategory = normalizeKey(record.errorCategory);
    const mappedCategory = ERROR_CATEGORY_MAP[rawCategory];
    const errorCategory =
      mappedCategory && errorCategoryKeys.includes(mappedCategory) ? mappedCategory : null;

    parsedRecords.push({
      line,
      subjectName,
      topicName,
      date,
      resolved,
      correct,
      errorCategory,
      unknownErrorCategory: Boolean(rawCategory) && !errorCategory,
    });
  });

  if (issues.length) {
    throw new QuestionImportError(issues);
  }

  // Aggregate by (date, subjectName, topicName)
  const grouped = new Map();
  for (const item of parsedRecords) {
    const key = `${item.date}|${normalizeKey(item.subjectName)}|${normalizeKey(item.topicName || '')}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        date: item.date,
        subjectName: item.subjectName,
        topicName: item.topicName,
        resolved: 0,
        correct: 0,
        errorBreakdown: Object.fromEntries(errorCategoryKeys.map(categoryKey => [categoryKey, 0])),
        unknownErrorCategoryCount: 0,
        lines: [],
      });
    }
    const current = grouped.get(key);
    current.resolved += item.resolved;
    current.correct += item.correct;
    current.lines.push(item.line);
    if (item.errorCategory) {
      current.errorBreakdown[item.errorCategory] += item.resolved - item.correct;
    }
    if (item.unknownErrorCategory) current.unknownErrorCategoryCount++;
  }

  return Array.from(grouped.values()).map(entry => ({
    date: entry.date,
    subjectName: entry.subjectName,
    topicName: entry.topicName,
    resolved: entry.resolved,
    correct: entry.correct,
    errorBreakdown: entry.errorBreakdown,
    unknownErrorCategoryCount: entry.unknownErrorCategoryCount,
    sourceLinesCount: entry.lines.length,
  }));
}
