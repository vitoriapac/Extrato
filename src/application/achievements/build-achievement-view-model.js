export function buildAchievementViewModel(achievements = []) {
  const rows = (Array.isArray(achievements) ? achievements : []).map(item => ({ ...item, unlocked: Boolean(item?.unlocked) }));
  const unlocked = rows.filter(item => item.unlocked);
  const locked = rows.filter(item => !item.unlocked);
  return {
    total: rows.length,
    unlockedCount: unlocked.length,
    remainingCount: locked.length,
    unlocked,
    locked
  };
}
