export function compareRecoveryPlan(currentPlan: any, proposedPlan: any) {
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
    increased: changes.filter((item: any) => item.direction === 'increase'),
    reduced: changes.filter((item: any) => item.direction === 'decrease'),
    preserved: changes.filter((item: any) => item.direction === 'preserved'),
  };
}
