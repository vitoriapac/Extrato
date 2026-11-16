import { isStrategicGap, STRATEGY_THRESHOLDS } from '../../domain/strategy/config.js';
import { displayReadinessValue } from '../analytics/build-header-view-model.js';
import { formatReadableMinutes as formatStudyMinutes } from './build-weekly-performance-brief.js';
import { formatDateBR } from '../../core/format-date.js';

type Row = Record<string, any>;

export interface PreparationLink {
  kind: 'section' | 'tab' | 'plan-adjust' | 'reveal';
  target: string;
  subjectId?: string | null;
  label: string;
}

export type ReadinessVerdict = { state: 'down' | 'steady' | 'up'; text: string } | null;

export interface PreparationReading {
  howAmI: {
    readiness: {
      value: number;
      detail: string | null;
      /** Tendência frente ao período anterior; sem causa. */
      verdict: ReadinessVerdict;
    } | null;
    projection: {
      text: string;
      /** Faixa projetada de nota e meta, em % da escala da prova, para a régua. */
      low: number;
      high: number;
      target: number | null;
    } | null;
    rhythm: { text: string } | null;
  };
  /** Até três pontos que mais pesam, lidos como associação, sem causa. */
  pulling: Array<{ text: string; link: PreparationLink | null }>;
  whatToDo: {
    state: string;
    /** Mesma ação e mesmo ID da recomendação de Hoje. */
    action: {
      recommendationId: string | null;
      label: string;
      text: string;
      reason: string | null;
      planNote: string;
      /** "No plano" e "Evidência" em pares rótulo/valor, para ler em diagonal. */
      facts: { inPlan: string; evidence: string };
    } | null;
    reason: string | null;
    deficit: string | null;
    /** Há plano de recuperação na trajetória (situação de atenção ou risco). */
    recovery: boolean;
  };
  /** O que já está firme (disciplinas na meta, simulados, semana cumprida): vem antes do alerta, só com evidência. */
  steady: string[];
  /** O que falta registrar para a leitura ficar mais firme; nunca omitido. */
  evidence: string[];
}

/** De onde vem o impacto na prova: nunca apresentado como fato sem origem. */
const impactOrigin = (item: Row): string => {
  const profile = item.examIntelligence || {};
  if (profile.usedHistory) return 'ajustado pelo histórico da banca';
  if (profile.impactSourceType === 'manual') return 'configurado por você';
  if (profile.impactSourceType === 'official') return 'oficial';
  return 'estimado';
};
const finite = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
const round = (value: number) => Math.round(value);

/**
 * Compõe a leitura da preparação a partir de modelos que o app já calcula (Prontidão, projeção,
 * resumo semanal, candidatos de estudo e próxima melhor ação). Não cria fórmula nem recomendação:
 * a ação é a de Hoje e só ganha o contexto do plano.
 */
export function buildPreparationReading({
  range = {},
  model = {},
  projection = null,
  weeklyBrief = null,
  readinessChange = null,
  nextBestAction = null,
  candidates = [],
  diagnosisOrder = [],
  subjectAccuracy = {},
  accuracyTarget = 80,
}: {
  range?: Row;
  model?: Row;
  projection?: Row | null;
  weeklyBrief?: Row | null;
  readinessChange?: Row | null;
  nextBestAction?: Row | null;
  candidates?: Row[];
  /** Ids dos tópicos na ordem dos cards do Diagnóstico; desempata a pontuação igual do mesmo jeito. */
  diagnosisOrder?: string[];
  /** Precisão em questões por disciplina (id → acerto e questões), do mesmo escopo da leitura. */
  subjectAccuracy?: Record<string, { accuracy: number | null; resolved: number }>;
  /** Meta de precisão (%) para contar as disciplinas que já estão nela. */
  accuracyTarget?: number;
} = {}): PreparationReading {
  const evidence: string[] = [];

  // Como estou
  const readinessValue = finite(displayReadinessValue(model.readiness));
  const pair = model.readinessPair;
  // O valor grande é o cálculo de hoje; o fechamento é um retrato de outra data. Se diferem, a frase diz isso.
  const closingDiffers =
    readinessValue != null && pair?.current && Number(pair.current.score) !== readinessValue;
  const formatSignedPoints = (n: number) =>
    `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n))} ${Math.abs(Math.round(n)) === 1 ? 'ponto' : 'pontos'}`;
  const demoClosing = String(pair?.current?.id || '').startsWith('demo-readiness-');
  const closingNote = closingDiffers
    ? ` O valor acima é o de hoje (${formatSignedPoints(readinessValue! - Number(pair!.current.score))} frente a esse fechamento).${demoClosing ? ' Na demonstração, os fechamentos são fictícios.' : ''}`
    : '';
  // A tendência usa os dois últimos fechamentos (independente do período); sem o campo novo, cai no delta do período.
  const closingDelta = model.readinessClosingDelta !== undefined ? model.readinessClosingDelta : model.readinessDelta;
  const readinessDetailBase =
    closingDelta != null && pair?.current && pair?.previous
      ? `Último fechamento (${formatDateBR(pair.current.date)}): ${pair.current.score}${
          closingDelta === 0
            ? ', igual ao fechamento anterior.'
            : `, ${closingDelta > 0 ? '+' : '−'}${Math.abs(closingDelta)} ${Math.abs(closingDelta) === 1 ? 'ponto' : 'pontos'} frente ao fechamento anterior.`
        }`
      : pair?.current
        ? `Último fechamento (${formatDateBR(pair.current.date)}): ${pair.current.score}.`
        : null;
  const readinessDetail = readinessDetailBase ? readinessDetailBase + closingNote : null;
  const delta = finite(closingDelta);
  const readinessVerdict: ReadinessVerdict =
    delta == null
      ? null
      : Math.abs(delta) <= 1
        ? { state: 'steady', text: 'Tendência entre os dois últimos fechamentos: estável' }
        : delta < 0
          ? { state: 'down', text: 'Tendência entre os dois últimos fechamentos: em queda' }
          : { state: 'up', text: 'Tendência entre os dois últimos fechamentos: em alta' };
  if (readinessValue != null && closingDelta == null)
    evidence.push('Sem fechamento anterior comparável: a Prontidão aparece sem variação.');
  const band = projection?.projection?.calibratedSimulationBand;
  const low = finite(band?.low),
    high = finite(band?.high);
  const confidence = projection?.confidence?.level;
  const confidenceLabel =
    confidence === 'moderate' ? 'moderada' : confidence === 'low' ? 'baixa' : null;
  const projectionText =
    low != null && high != null
      ? `Faixa projetada de ${round(low)}% a ${round(high)}%${confidenceLabel ? `, confiança ${confidenceLabel}` : ''}. ${finite(projection?.current?.targetScore) != null ? `Meta de ${round(projection!.current.targetScore)}%.` : ''} Não é chance de aprovação.`
      : null;
  if (!projectionText) evidence.push('Sem simulados comparáveis para projetar a faixa de nota.');
  const week = weeklyBrief?.current;
  const rhythmText =
    week && week.plannedMinutes > 0 && week.planFulfillmentPct != null
      ? `${formatStudyMinutes(week.studiedMinutes)} estudados de ${formatStudyMinutes(week.plannedMinutes)} planejados nos últimos 7 dias (volume de carga de ${week.planFulfillmentPct}%).`
      : null;
  if (!rhythmText)
    evidence.push('Sem tempo planejado nos últimos 7 dias: o ritmo não tem referência.');
  const resolved = Number(model.current?.resolved) || 0;
  if (resolved > 0 && resolved < 30)
    evidence.push('Amostra pequena (menos de 30 questões): leia a precisão como indício.');

  // O que puxa
  const pulling: PreparationReading['pulling'] = [];
  const dropped = (readinessChange?.factors || []).filter((item: Row) => item.direction === 'down');
  if (dropped.length)
    pulling.push({
      text: `O fator ${dropped[0].label} da Prontidão caiu de ${dropped[0].before} para ${dropped[0].after} (escala de 0 a 100)${pair?.previous && pair?.current ? ` entre ${formatDateBR(pair.previous.date)} e ${formatDateBR(pair.current.date)}` : ''}.`,
      link: null,
    });
  // Mesma fila do Diagnóstico (pontuação de prioridade do tópico, a que ordena a lista de cards); só entram
  // tópicos fracos com impacto alto. É a resposta oficial para "o que mais pesa"; as outras telas apontam para ela.
  const position = new Map(diagnosisOrder.map((id, index) => [id, index]));
  const gaps = [...candidates]
    .sort(
      (a, b) =>
        (Number(b?.score) || 0) - (Number(a?.score) || 0) ||
        (position.get(a?.topicId) ?? Infinity) - (position.get(b?.topicId) ?? Infinity)
    )
    // Com a fila do Diagnóstico informada, um tópico fora dela não é citado: a Leitura nunca mostra o que a lista não tem.
    .filter(item => isStrategicGap(item) && (!position.size || position.has(item.topicId)));
  // Tópico fraco dentro de disciplina forte: diz as duas coisas para o leitor não ver contradição.
  const strongSubjectNote = (gap: Row): string => {
    const stat = subjectAccuracy[gap.subjectId];
    return stat && stat.accuracy != null && stat.resolved >= 30 && stat.accuracy >= STRATEGY_THRESHOLDS.adequateMastery
      ? ` Tópico fraco dentro de ${gap.subjectName}, que tem ${round(stat.accuracy)}% de precisão em questões (todo o histórico).`
      : '';
  };
  for (const gap of gaps.slice(0, 3 - pulling.length))
    pulling.push({
      text: `${gap.subjectName} — ${gap.topicName}: domínio ${round(Number(gap.mastery))} (desempenho no tópico, de 0 a 100); impacto alto na prova (${impactOrigin(gap)}).${strongSubjectNote(gap)}`,
      link: { kind: 'section', target: 'diagnosis', label: 'Ver no Diagnóstico' },
    });
  const overdue = Number(weeklyBrief?.overdueReviews) || 0;
  if (pulling.length < 3 && overdue > 0)
    pulling.push({
      text: `${overdue} ${overdue === 1 ? 'revisão vencida' : 'revisões vencidas'}.`,
      link: { kind: 'tab', target: 'agenda', label: 'Abrir revisões' },
    });
  if (!pulling.length)
    evidence.push('Ainda não há pontos de atenção com evidência suficiente para destacar.');

  // O que fazer: a ação é a de Hoje; aqui só se mede contra o plano.
  const best = nextBestAction;
  let action: PreparationReading['whatToDo']['action'] = null;
  if (best?.action) {
    const minutes = finite(best.action.suggestedMinutes);
    const planNote = !best.activePlanId
      ? 'Sem plano ativo: esta ação não está medida contra o planejamento.'
      : best.currentAllocationMinutes != null
        ? `No plano da semana: ${formatStudyMinutes(best.currentAllocationMinutes)} para este tópico, de ${formatStudyMinutes(best.weeklyPlannedMinutes)} planejados.`
        : 'Este tópico ainda não tem tempo no plano da semana.';
    const evidenceRaw = String(best.evidence || 'não avaliada').toLowerCase();
    const evidenceText = evidenceRaw.charAt(0).toUpperCase() + evidenceRaw.slice(1);
    const inPlan = !best.activePlanId
      ? 'sem plano ativo'
      : best.currentAllocationMinutes != null
        ? `sim, ${formatStudyMinutes(best.currentAllocationMinutes)} de ${formatStudyMinutes(best.weeklyPlannedMinutes)} na semana`
        : 'não';
    action = {
      facts: { inPlan, evidence: evidenceText },
      recommendationId: best.action.recommendationId || null,
      label: best.label || 'Abrir em Hoje',
      text: `${best.topicName}${best.subjectName ? ` (${best.subjectName})` : ''}${minutes ? `, ${formatStudyMinutes(minutes)}` : ''}`,
      reason: Array.isArray(best.reasons) ? best.reasons.find((item: unknown) => typeof item === 'string' && item.trim()) || null : null,
      planNote,
    };
  }
  if (!best?.activePlanId) evidence.push('Sem plano ativo: registre um plano para medir o ritmo.');
  const deficit =
    week && week.plannedMinutes > week.studiedMinutes
      ? `Faltam ${formatStudyMinutes(week.plannedMinutes - week.studiedMinutes)} para igualar o planejado nos últimos 7 dias.`
      : null;

  // O que já está firme: só números com evidência (10 questões na disciplina), sem elogio vazio.
  const steady: string[] = [];
  const onTarget = Object.values(subjectAccuracy).filter(
    stat => stat.accuracy != null && stat.resolved >= 10 && stat.accuracy >= accuracyTarget
  ).length;
  if (onTarget > 0)
    steady.push(
      `${onTarget} ${onTarget === 1 ? 'disciplina já está' : 'disciplinas já estão'} na meta de precisão de ${round(accuracyTarget)}% (10 questões ou mais, todo o histórico).`
    );
  const simulation = finite(projection?.current?.simulationAccuracy);
  const simulationTarget = finite(projection?.current?.targetScore);
  if (simulation != null && simulationTarget != null && simulation >= simulationTarget)
    steady.push(
      `O resultado central dos simulados comparáveis (${round(simulation)}%) está na meta de ${round(simulationTarget)}%.`
    );
  if (week && week.plannedMinutes > 0 && week.studiedMinutes >= week.plannedMinutes)
    steady.push(
      `Semana cumprida: ${formatStudyMinutes(week.studiedMinutes)} estudados de ${formatStudyMinutes(week.plannedMinutes)} planejados nos últimos 7 dias.`
    );

  void range;
  return {
    howAmI: {
      readiness:
        readinessValue != null
          ? { value: readinessValue, detail: readinessDetail, verdict: readinessVerdict }
          : null,
      projection:
        projectionText && low != null && high != null
          ? {
              text: projectionText,
              low: round(low),
              high: round(high),
              target: finite(projection?.current?.targetScore) != null ? round(projection!.current.targetScore) : null,
            }
          : null,
      rhythm: rhythmText ? { text: rhythmText } : null,
    },
    pulling,
    steady,
    whatToDo: {
      state: best?.state || 'INSUFFICIENT_EVIDENCE',
      action,
      reason: action ? null : best?.reason || null,
      deficit,
      recovery: ['attention', 'at_risk'].includes(projection?.status),
    },
    evidence: [...new Set(evidence)],
  };
}
