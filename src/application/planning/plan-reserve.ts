/** Folga que o plano semanal e a distribuição diária deixam livre: uma única regra para as duas etapas. */
export const PLAN_RESERVE_RATIO = 0.1;

/** Capacidade que o plano pode ocupar: a disponibilidade menos a reserva. */
export const usableMinutes = (availableMinutes: number): number =>
  Math.floor(availableMinutes * (1 - PLAN_RESERVE_RATIO));
