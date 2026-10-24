export function compareRecoveryPlan(currentPlan: any, proposedPlan: any) {
  const current = new Map<string, any>(
    currentPlan.subjects.map((item: any) => [item.subjectId, item])
  );
  const proposed = new Map<string, any>(
    proposedPlan.subjects.map((item: any) => [item.subjectId, item])
  );
  const changes = currentPlan.subjects.map((item: any) => {
    const after = proposed.get(item.subjectId)?.minutes;
    return {
      subjectId: item.subjectId,
      subjectName: item.subjectName || item.name || 'Disciplina',
      beforeMinutes: item.minutes,
      afterMinutes: after,
      deltaMinutes: after - item.minutes,
      direction:
        after > item.minutes ? 'increase' : after < item.minutes ? 'decrease' : 'preserved',
    };
  });
  return {
    changes,
    increased: changes.filter(item => item.direction === 'increase'),
    reduced: changes.filter(item => item.direction === 'decrease'),
    preserved: changes.filter(item => item.direction === 'preserved'),
  };
}
