export interface AchievementNoticeBadge {
  id: string;
  name: string;
  desc: string;
}

export interface AchievementNotice {
  title: string;
  description: string;
  /** Emblemas mostrados no aviso (no máximo três). */
  badgeIds: string[];
}

const joinNames = (names: string[]) =>
  names.length < 2
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;

/** Texto do aviso de desbloqueio. Várias conquistas na mesma ação viram um aviso só. */
export function buildAchievementNotice(
  unlockedIds: readonly string[],
  badges: readonly AchievementNoticeBadge[]
): AchievementNotice | null {
  const found = unlockedIds
    .map(id => badges.find(badge => badge.id === id))
    .filter((badge): badge is AchievementNoticeBadge => Boolean(badge));
  if (!found.length) return null;
  if (found.length === 1)
    return {
      title: `Conquista desbloqueada: ${found[0].name}`,
      description: found[0].desc,
      badgeIds: [found[0].id],
    };
  return {
    title: `${found.length} conquistas desbloqueadas`,
    description: joinNames(found.map(badge => badge.name)),
    badgeIds: found.slice(0, 3).map(badge => badge.id),
  };
}
