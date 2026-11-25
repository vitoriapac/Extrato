import { KNOWN_BANCAS, normalizeBanca } from './bancas.js';

export interface QuickQuestionParseResult {
  ok: boolean;
  resolved: number;
  correct: number;
  blank: number | null;
  minutes: number | null;
  banca: string | null;
  retry: boolean;
  error?: string;
}

const KNOWN_BANCA_TOKENS = new Set([
  ...KNOWN_BANCAS.map(b =>
    b
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
  ),
  'cespe',
  'unb',
  'aocp',
  'instituto',
  'fundacao',
  'getulio',
  'vargas',
  'carlos',
  'chagas',
]);

const FILLER_WORDS = new Set(['da', 'de', 'do', 'na', 'no', 'em', 'banca', 'para']);

function stripAccentsLower(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/**
 * Interpreta entrada rápida em linha única no vocabulário do concurseiro:
 * Ex.: "30q 26c 2b fgv 35m ref", "25/21 cebraspe 28min", "40q 32c fcc".
 */
export function parseQuickQuestionShorthand(input: string): QuickQuestionParseResult {
  const empty: QuickQuestionParseResult = {
    ok: false,
    resolved: 0,
    correct: 0,
    blank: null,
    minutes: null,
    banca: null,
    retry: false,
  };

  const trimmed = String(input ?? '').trim();
  if (!trimmed) {
    return { ...empty, error: 'Digite algo como "30q 25c 2b fgv 30m" ou "25/21 cebraspe".' };
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  let resolved: number | null = null;
  let correct: number | null = null;
  let errors: number | null = null;
  let blank: number | null = null;
  let minutes: number | null = null;
  let retry = false;
  const bareNumbers: number[] = [];
  const bancaWords: string[] = [];

  for (const rawToken of tokens) {
    const clean = stripAccentsLower(rawToken).replace(/[,;]+$/g, '');
    if (!clean) continue;

    // Formato razão "resolvidas/acertos", ex.: 25/21
    const slashIdx = clean.indexOf('/');
    if (slashIdx > 0 && slashIdx < clean.length - 1) {
      const left = clean.slice(0, slashIdx);
      const right = clean.slice(slashIdx + 1);
      if (/^\d{1,5}$/.test(left) && /^\d{1,5}$/.test(right)) {
        resolved = Number(left);
        correct = Number(right);
        continue;
      }
    }

    if (/^\d{1,5}$/.test(clean)) {
      bareNumbers.push(Number(clean));
      continue;
    }

    const qMatch = clean.match(/^(\d{1,5})(q|qs|questao|questoes)$/);
    if (qMatch) {
      resolved = Number(qMatch[1]);
      continue;
    }

    const cMatch = clean.match(/^(\d{1,5})(c|ac|acerto|acertos)$/);
    if (cMatch) {
      correct = Number(cMatch[1]);
      continue;
    }

    const bMatch = clean.match(/^(\d{1,5})(b|br|branco|branca|brancos|brancas)$/);
    if (bMatch) {
      blank = Number(bMatch[1]);
      continue;
    }

    const eMatch = clean.match(/^(\d{1,5})(e|err|erro|erros|errada|erradas)$/);
    if (eMatch) {
      errors = Number(eMatch[1]);
      continue;
    }

    const mMatch = clean.match(/^(\d{1,4})(m|min|mins|minuto|minutos)$/);
    if (mMatch) {
      minutes = Math.max(1, Number(mMatch[1]));
      continue;
    }

    if (clean === 'ref' || clean === 'refeita' || clean === 'refeitas' || clean === 'retry') {
      retry = true;
      continue;
    }

    if (!FILLER_WORDS.has(clean)) {
      bancaWords.push(rawToken.replace(/[,;]+$/g, ''));
    }
  }

  if (resolved === null && correct === null && bareNumbers.length >= 2) {
    resolved = bareNumbers[0];
    correct = bareNumbers[1];
  }

  if (resolved === null && correct !== null && errors !== null) {
    resolved = correct + errors + (blank ?? 0);
  }
  if (correct === null && resolved !== null && errors !== null) {
    correct = resolved - errors - (blank ?? 0);
  }

  if (resolved === null || resolved <= 0) {
    return {
      ...empty,
      error: 'Informe o total de questões (ex.: "30q 25c" ou "30/25").',
    };
  }

  if (correct === null || correct < 0) {
    return {
      ...empty,
      resolved,
      error: 'Informe os acertos (ex.: "30q 25c" ou "30/25").',
    };
  }

  if (correct > resolved) {
    return {
      ...empty,
      resolved,
      correct,
      error: `Acertos (${correct}) não podem superar resolvidas (${resolved}).`,
    };
  }

  if (blank !== null && correct + blank > resolved) {
    return {
      ...empty,
      resolved,
      correct,
      blank,
      error: 'Acertos + em branco superam o total de questões resolvidas.',
    };
  }

  const rawBanca = bancaWords.join(' ').trim();
  const banca = rawBanca ? normalizeBanca(rawBanca) : null;

  return {
    ok: true,
    resolved,
    correct,
    blank,
    minutes,
    banca,
    retry,
  };
}

export interface CopiedPlatformStatsResult {
  ok: boolean;
  resolved: number;
  correct: number;
  errors: number | null;
  blank: number | null;
  minutes: number | null;
  banca: string | null;
  error?: string;
}

function extractLabeledNumber(lines: string[], labels: string[]): number | null {
  for (const line of lines) {
    for (const label of labels) {
      const idx = line.indexOf(label);
      if (idx === -1) continue;
      // Número logo após o rótulo ("Acertos: 32" ou "Certas 32")
      const after = line.slice(idx + label.length).trim();
      const afterMatch = after.match(/^[:=\-\s]*(\d{1,5})\b/);
      if (afterMatch) return Number(afterMatch[1]);
      // Número logo antes do rótulo ("32 acertos" ou "40 questões resolvidas")
      const before = line.slice(0, idx).trim();
      const beforeMatch = before.match(/\b(\d{1,5})$/);
      if (beforeMatch) return Number(beforeMatch[1]);
    }
  }
  return null;
}

function extractDurationMinutes(lines: string[]): number | null {
  for (const line of lines) {
    const hms = line.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);
    if (hms && (line.includes('tempo') || line.includes('durac'))) {
      const first = Number(hms[1]);
      const second = Number(hms[2]);
      return hms[3] ? first * 60 + second : first + Math.round(second / 60);
    }
    const hm = line.match(/\b(\d{1,2})\s*h(?:\s*(\d{1,2})\s*m)?\b/);
    if (hm) {
      const total = Number(hm[1]) * 60 + Number(hm[2] || 0);
      if (total > 0) return total;
    }
    const min = line.match(/\b(\d{1,4})\s*(?:min|minutos)\b/);
    if (min) return Math.max(1, Number(min[1]));
  }
  return null;
}

function extractPlatformBanca(rawLines: string[], normalizedLines: string[]): string | null {
  for (let i = 0; i < normalizedLines.length; i++) {
    const norm = normalizedLines[i];
    if (norm.includes('banca')) {
      const colonIdx = rawLines[i].indexOf(':');
      const candidate = (colonIdx >= 0 ? rawLines[i].slice(colonIdx + 1) : rawLines[i])
        .replace(/banca/i, '')
        .trim();
      if (candidate) return normalizeBanca(candidate);
    }
  }
  for (const norm of normalizedLines) {
    const words = norm.split(/[^a-z0-9]+/).filter(Boolean);
    for (const word of words) {
      if (KNOWN_BANCA_TOKENS.has(word)) {
        const hit = normalizeBanca(word);
        if (hit && word !== 'instituto' && word !== 'fundacao') return hit;
      }
    }
  }
  return null;
}

/**
 * Extrai métricas agregadas de texto colado da tela de estatísticas do TEC Concursos ou QConcursos.
 */
export function parseCopiedPlatformStats(rawText: string): CopiedPlatformStatsResult {
  const empty: CopiedPlatformStatsResult = {
    ok: false,
    resolved: 0,
    correct: 0,
    errors: null,
    blank: null,
    minutes: null,
    banca: null,
  };

  const text = String(rawText ?? '').trim();
  if (!text) {
    return { ...empty, error: 'Cole o resumo copiado do TEC Concursos ou QConcursos.' };
  }

  const rawLines = text
    .split(/\r?\n|•|\|/)
    .map(l => l.trim())
    .filter(Boolean);
  const normalizedLines = rawLines.map(l => stripAccentsLower(l));

  let resolved = extractLabeledNumber(normalizedLines, [
    'questoes resolvidas',
    'total de questoes',
    'resolvidas',
    'respondidas',
    'questoes',
  ]);
  let correct = extractLabeledNumber(normalizedLines, [
    'questoes certas',
    'acertos',
    'acertou',
    'certas',
  ]);
  const errors = extractLabeledNumber(normalizedLines, [
    'questoes erradas',
    'erros',
    'errou',
    'erradas',
  ]);
  const blank = extractLabeledNumber(normalizedLines, [
    'deixadas em branco',
    'sem resposta',
    'em branco',
    'brancas',
    'puladas',
  ]);

  if (resolved === null && correct !== null && (errors !== null || blank !== null)) {
    resolved = correct + (errors ?? 0) + (blank ?? 0);
  }
  if (correct === null && resolved !== null && errors !== null) {
    correct = Math.max(0, resolved - errors - (blank ?? 0));
  }

  if (resolved === null || resolved <= 0 || correct === null || correct < 0) {
    return {
      ...empty,
      error:
        'Não foi possível identificar Resolvidas e Acertos no texto colado. Confira se copiou os números.',
    };
  }

  if (correct + (blank ?? 0) > resolved) {
    return {
      ...empty,
      resolved,
      correct,
      errors,
      blank,
      error: 'A soma de acertos e em branco supera o total de questões resolvidas.',
    };
  }

  return {
    ok: true,
    resolved,
    correct,
    errors,
    blank,
    minutes: extractDurationMinutes(normalizedLines),
    banca: extractPlatformBanca(rawLines, normalizedLines),
  };
}
