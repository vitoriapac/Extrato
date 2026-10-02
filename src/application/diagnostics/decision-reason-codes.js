export const DECISION_REASON_CODES=Object.freeze([
  'overdue_review','scheduled_review','evidence_collection','capacity_constraint','cooldown',
  'higher_priority_score','exam_phase','manual_constraint','unknown'
]);

export const DECISION_REASON_LABELS=Object.freeze({
  overdue_review:'Revisão crítica vencida',scheduled_review:'Revisão programada',
  evidence_collection:'Coleta de evidências',capacity_constraint:'Restrição de capacidade',
  cooldown:'Intervalo de segurança entre ajustes',higher_priority_score:'Prioridade calculada maior',
  exam_phase:'Fase da prova',manual_constraint:'Restrição definida pelo estudante',
  unknown:'Motivo estruturado indisponível'
});

export function decisionReasonCode(value){
  return DECISION_REASON_CODES.includes(value)?value:'unknown';
}
