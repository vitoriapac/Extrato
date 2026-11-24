// Sem importar o normalizador de CSV: ele depende deste módulo.
const normalizeKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

/** Bancas mais comuns, na grafia exibida. Outras são aceitas como digitadas. */
export const KNOWN_BANCAS = Object.freeze([
  'Cebraspe',
  'FGV',
  'FCC',
  'Cesgranrio',
  'Vunesp',
  'Quadrix',
  'IBFC',
  'Instituto AOCP',
  'Idecan',
  'Consulplan',
  'Iades',
  'Fundatec',
  'Selecon',
]);

const ALIASES: Record<string, string> = {
  cespe: 'Cebraspe',
  'cespe cebraspe': 'Cebraspe',
  'cebraspe cespe': 'Cebraspe',
  unb: 'Cebraspe',
  'fundacao getulio vargas': 'FGV',
  'fundacao carlos chagas': 'FCC',
  aocp: 'Instituto AOCP',
};

const CANONICAL = new Map<string, string>([
  ...KNOWN_BANCAS.map(name => [normalizeKey(name), name] as [string, string]),
  ...Object.entries(ALIASES),
]);

/** Grafia padrão da banca; texto vazio vira null e banca desconhecida mantém o que foi digitado. */
export function normalizeBanca(value: unknown): string | null {
  const text = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!text) return null;
  return CANONICAL.get(normalizeKey(text)) || text.slice(0, 60);
}

/** Duração em minutos (fracionária), a partir de "25", "2,5", "mm:ss" ou "hh:mm:ss"; inválida vira null. */
export function parseDurationMinutes(value: unknown): number | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (text.includes(':')) {
    const parts = text.split(':').map(Number);
    if (parts.length > 3 || parts.some(part => !Number.isFinite(part) || part < 0)) return null;
    const [h, m, s] = parts.length === 3 ? parts : [0, ...parts];
    return h * 60 + m + s / 60;
  }
  const minutes = Number(text.replace(',', '.'));
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
}

/** Minutos inteiros positivos; qualquer outro valor vira null (tempo não informado). */
export function normalizeQuestionMinutes(value: unknown): number | null {
  const minutes = Math.round(parseDurationMinutes(value) ?? 0);
  return minutes > 0 ? minutes : null;
}
