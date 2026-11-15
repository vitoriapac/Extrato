import { formatInteger } from '../../core/format-number.js';
import {
  BEGINNER_DAYS_LIMIT,
  BEGINNER_QUESTION_LIMIT,
  type BeginnerAssessment,
} from '../../domain/analytics/beginner-gate.js';

const WHAT: Record<string, string> = {
  subjects: 'compara a precisão e a tendência de cada disciplina',
  diagnosis: 'ordena os tópicos que mais precisam de atenção',
  questions: 'mostra o resultado das questões, dos simulados e a inteligência da prova',
};

/** Estado vazio das abas analíticas enquanto o registro ainda é pequeno. */
export function renderBeginnerState(section: string, assessment: BeginnerAssessment): string {
  const what = WHAT[section] || WHAT.questions;
  const days = assessment.recordDays === 1 ? '1 dia' : `${assessment.recordDays} dias`;
  const questions =
    assessment.questionCount === 1 ? '1 questão' : `${formatInteger(assessment.questionCount)} questões`;
  return `<div class="empty-state performance-beginner" role="status" data-beginner-state="${section}"><strong>O que você desbloqueia aqui</strong><p>Esta seção ${what}.</p><p>Para evitar leituras distorcidas no início, ela abre automaticamente ao atingir ${BEGINNER_QUESTION_LIMIT} questões respondidas ou ${BEGINNER_DAYS_LIMIT / 7} semanas de estudo. Você já tem ${questions} e ${days} registrados.</p><div class="performance-reading__actions"><button type="button" class="btn small" data-performance-open="questoes">Registrar questões</button><button type="button" class="btn ghost small" data-performance-investigate="overview">Ver a Visão geral</button></div></div>`;
}
