// Reuse one phase surface so updates never leave a duplicate or stale copy.
export function syncOnboardingPhase(document, { visible = false } = {}) {
  const phase = document.getElementById('overviewExamPhase'),
    entry = document.getElementById('guidedOnboarding');
  if (!phase || !entry) return;
  if (visible) entry.append(phase);
  else entry.after(phase);
}
