import { formatDecimal } from '../../core/format-number.js';
import { pluralize } from '../../core/utils.js';

type Row = Record<string, any>;

export type AchievementSessionNote =
  | { kind: 'unlocked'; names: string[]; text: string }
  | { kind: 'near'; id: string; name: string; text: string };

/** "Perto" = falta até 10% do critério ou algo que dá para cumprir hoje (limite por unidade). */
const DO_TODAY_LIMIT: Record<string, number> = {
  dias: 1,
  horas: 1,
  questões: 30,
  simulados: 1,
  tópicos: 1,
  revisões: 1,
};
const NEAR_FRACTION = 0.1;

export function isNearAchievement(progress: Row | null | undefined): boolean {
  if (!progress) return false;
  const target = Number(progress.target);
  const current = Number(progress.current);
  if (!(target > 0) || !Number.isFinite(current) || current >= target) return false;
  const remaining = target - current;
  return remaining <= target * NEAR_FRACTION || remaining <= (DO_TODAY_LIMIT[progress.unit] ?? 0);
}

function remainingText(progress: Row): string {
  const remaining = Number(progress.target) - Number(progress.current);
  switch (progress.unit) {
    case 'dias':
      return pluralize(Math.ceil(remaining), 'dia', 'dias');
    case 'horas':
      return `${formatDecimal(Math.ceil(remaining * 10) / 10)} h`;
    case 'questões':
      return pluralize(Math.ceil(remaining), 'questão', 'questões');
    case 'simulados':
      return pluralize(Math.ceil(remaining), 'simulado', 'simulados');
    case 'tópicos':
      return pluralize(Math.ceil(remaining), 'tópico', 'tópicos');
    case 'revisões':
      return pluralize(Math.ceil(remaining), 'revisão', 'revisões');
    default:
      return `${formatDecimal(Math.ceil(remaining))} ${String(progress.unit).replace('% de ', 'p.p. de ')}`;
  }
}

/**
 * Conquista a mostrar no resultado da sessão: o que foi desbloqueado agora ou, se nada foi,
 * a mais perto de ser cumprida. `achievements` vem de `evaluateAchievements()`; `registry` é o
 * registro gravado. Antes da primeira leitura (`baselined` falso) nada é novo.
 */
export function buildSessionAchievementNote(
  achievements: readonly Row[],
  registry: Row | null | undefined,
  baselined: boolean
): AchievementSessionNote | null {
  const known = registry || {};
  if (baselined) {
    const fresh = achievements.filter(item => item.unlocked && !known[item.id]);
    if (fresh.length) {
      const names = fresh.map(item => String(item.name));
      return {
        kind: 'unlocked',
        names,
        text:
          names.length === 1
            ? `Conquista desbloqueada: ${names[0]}.`
            : `${names.length} conquistas desbloqueadas: ${names.join(', ')}.`,
      };
    }
  }
  const near = achievements
    .filter(item => !item.unlocked && isNearAchievement(item.progress))
    .map(item => ({
      item,
      fraction: (item.progress.target - item.progress.current) / item.progress.target,
    }))
    .sort((a, b) => a.fraction - b.fraction)[0];
  if (!near) return null;
  return {
    kind: 'near',
    id: String(near.item.id),
    name: String(near.item.name),
    text: `Faltam ${remainingText(near.item.progress)} para ${near.item.name}.`,
  };
}

export interface PlanAchievementMark {
  itemId: string;
  achievementId: string;
  text: string;
}

const DONE_PLAN_STATUSES = new Set(['completed', 'deferred', 'replaced', 'skipped', 'discarded']);

/**
 * Atividade do plano de hoje que, se concluída, completa uma conquista. No máximo uma marca:
 * a primeira atividade pendente, na ordem em que o plano já está (a ordem não muda).
 * shortcut: só horas, questões e sequência de dias; tópicos, revisões e simulados dependem de
 * regras de conclusão próprias e entram se a marca se mostrar útil.
 */
export function pickPlanAchievementMark(
  items: readonly Row[],
  achievements: readonly Row[],
  { studiedToday = false }: { studiedToday?: boolean } = {}
): PlanAchievementMark | null {
  const open = achievements.filter(
    item => !item.unlocked && item.progress && Number(item.progress.target) > 0
  );
  for (const item of items) {
    if (DONE_PLAN_STATUSES.has(item.status)) continue;
    const minutesLeft =
      (Number(item.plannedMinutes) || 0) - (Number(item.executedSeconds) || 0) / 60;
    const questions = Number(item.recommendedQuestions) || 0;
    const completes = open
      .filter(achievement => {
        const remaining =
          Number(achievement.progress.target) - Number(achievement.progress.current);
        if (!(remaining > 0)) return false;
        if (achievement.progress.unit === 'horas')
          return minutesLeft > 0 && remaining <= minutesLeft / 60;
        if (achievement.progress.unit === 'questões')
          return questions > 0 && remaining <= questions;
        // Qualquer estudo hoje soma um dia à sequência, se hoje ainda não contou.
        if (achievement.progress.unit === 'dias') return !studiedToday && remaining <= 1;
        return false;
      })
      // Entre várias, a de maior alvo: é a mais difícil de repetir.
      .sort((a, b) => Number(b.progress.target) - Number(a.progress.target))[0];
    if (completes)
      return {
        itemId: String(item.id),
        achievementId: String(completes.id),
        text: `Conclui a conquista ${completes.name}`,
      };
  }
  return null;
}
