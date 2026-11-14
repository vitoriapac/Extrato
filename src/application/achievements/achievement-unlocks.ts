/**
 * Registro de quando cada conquista foi desbloqueada.
 *
 * O registro é gravado uma vez e não é recalculado (o passado não é reescrito). `migrated` marca o
 * que já estava cumprido antes de o app passar a registrar; só `live` gera aviso.
 */

export interface AchievementUnlock {
  /** Data local (YYYY-MM-DD). `null` quando não dá para inferir. */
  unlockedAt: string | null;
  source: 'live' | 'migrated';
  /** Dia em que o registro viu a conquista pela primeira vez; só existe quando `unlockedAt` é null. */
  recordedAt?: string;
}

export type AchievementUnlocks = Record<string, AchievementUnlock>;

type Row = Record<string, any>;

const dateOf = (value: unknown): string | null =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;

const byDate = (a: Row, b: Row) =>
  String(dateOf(a.date) || '').localeCompare(String(dateOf(b.date) || '')) ||
  String(a.createdAt || '').localeCompare(String(b.createdAt || ''));

/** Data em que a soma acumulada de `amount(row)` passou de `threshold`, na ordem do histórico. */
function dateReaching(rows: Row[], amount: (row: Row) => number, threshold: number) {
  let total = 0;
  for (const row of [...rows].sort(byDate)) {
    total += amount(row);
    if (total >= threshold) return dateOf(row.date);
  }
  return null;
}

/** Data do enésimo registro com data (contagem simples). */
function dateOfNth(dates: Array<string | null>, n: number) {
  const sorted = dates.filter((item): item is string => Boolean(item)).sort();
  return sorted.length >= n ? sorted[n - 1] : null;
}

/**
 * Datas das conquistas cumulativas (horas, questões, tópicos, simulados, revisões, primeira sessão),
 * lidas do histórico. Só devolve as que o histórico já cumpre. Sequências, cobertura e conquistas
 * estratégicas dependem de regras do app e ficam fora.
 */
export function inferCumulativeUnlockDates(data: Row): Record<string, string> {
  const sessions: Row[] = Array.isArray(data.studySessions) ? data.studySessions : [];
  const questions: Row[] = Array.isArray(data.questoes) ? data.questoes : [];
  const simulations: Row[] = Array.isArray(data.simulados) ? data.simulados : [];
  const reviews: Row[] = Array.isArray(data.reviewAgenda) ? data.reviewAgenda : [];
  const history: Row[] = Array.isArray(data.topicHistory) ? data.topicHistory : [];

  const seconds = (row: Row) => Number(row.durationSeconds) || 0;
  const resolved = (row: Row) => Number(row.resolved) || 0;

  const firstTopicCompletion = new Map<string, string>();
  for (const event of history) {
    if (event.type !== 'topic_completed' || !event.topicId) continue;
    const date = dateOf(event.localDate || event.date);
    const previous = firstTopicCompletion.get(event.topicId);
    if (date && (!previous || date < previous)) firstTopicCompletion.set(event.topicId, date);
  }
  const topicDates = [...firstTopicCompletion.values()];

  const found: Record<string, string | null> = {
    firstSession: sessions.length
      ? dateOfNth(
          sessions.map(item => dateOf(item.date)),
          1
        )
      : null,
    hours10: dateReaching(sessions, seconds, 36000),
    hours50: dateReaching(sessions, seconds, 180000),
    hours100: dateReaching(sessions, seconds, 360000),
    q100: dateReaching(questions, resolved, 100),
    q500: dateReaching(questions, resolved, 500),
    q1000: dateReaching(questions, resolved, 1000),
    sim1: dateOfNth(
      simulations.map(item => dateOf(item.date)),
      1
    ),
    sim5: dateOfNth(
      simulations.map(item => dateOf(item.date)),
      5
    ),
    topics10: dateOfNth(topicDates, 10),
    topics50: dateOfNth(topicDates, 50),
    reviews25: dateOfNth(
      reviews
        .filter(item => item.status === 'Concluído')
        .map(item => dateOf(item.completedAt) || dateOf(item.date)),
      25
    ),
  };
  return Object.fromEntries(
    Object.entries(found).filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

/** Migração: registra as cumulativas com a data inferida. As demais entram na primeira leitura. */
export function buildMigratedUnlocks(data: Row): AchievementUnlocks {
  const existing =
    data.achievementUnlocks && typeof data.achievementUnlocks === 'object'
      ? (data.achievementUnlocks as AchievementUnlocks)
      : {};
  const result: AchievementUnlocks = { ...existing };
  for (const [id, unlockedAt] of Object.entries(inferCumulativeUnlockDates(data))) {
    if (!result[id]) result[id] = { unlockedAt, source: 'migrated' };
  }
  return result;
}

export interface UnlockSyncResult {
  /** Conquistas desbloqueadas agora, nesta chamada. Vazio na primeira leitura. */
  newlyUnlocked: string[];
  changed: boolean;
}

/**
 * Compara as conquistas cumpridas com o registro.
 * Na primeira leitura de um estado (`achievementsBaselined` falso) tudo o que já está cumprido entra
 * como `migrated`, sem aviso. Depois, cada novo cumprimento entra como `live` com a data de hoje.
 */
export function syncAchievementUnlocks(
  state: Row,
  unlockedIds: readonly string[],
  todayISO: string
): UnlockSyncResult {
  if (!state.achievementUnlocks || typeof state.achievementUnlocks !== 'object')
    state.achievementUnlocks = {};
  const registry = state.achievementUnlocks as AchievementUnlocks;
  const baselined = state.achievementsBaselined === true;
  // Estado sem registro (demo, backup já na versão atual): as cumulativas ganham a data do histórico.
  const inferred = baselined ? {} : inferCumulativeUnlockDates(state);
  const newlyUnlocked: string[] = [];
  let changed = false;

  for (const id of unlockedIds) {
    if (registry[id]) continue;
    changed = true;
    if (baselined) {
      registry[id] = { unlockedAt: todayISO, source: 'live' };
      newlyUnlocked.push(id);
    } else {
      const unlockedAt = (inferred as Record<string, string>)[id] ?? null;
      registry[id] = unlockedAt
        ? { unlockedAt, source: 'migrated' }
        : { unlockedAt: null, source: 'migrated', recordedAt: todayISO };
    }
  }
  if (!baselined) {
    state.achievementsBaselined = true;
    changed = true;
  }
  return { newlyUnlocked, changed };
}
