import { isStrategicGap } from '../../domain/strategy/config.js';
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
    projection: { text: string } | null;
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
      planNote: string;
      /** "No plano" e "Evidência" em pares rótulo/valor, para ler em diagonal. */
      facts: { inPlan: string; evidence: string };
    } | null;
    reason: string | null;
    deficit: string | null;
    /** Há plano de recuperação na trajetória (situação de atenção ou risco). */
    recovery: boolean;
  };
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
}: {
  range?: Row;
  model?: Row;
  projection?: Row | null;
  weeklyBrief?: Row | null;
  readinessChange?: Row | null;
  nextBestAction?: Row | null;
  candidates?: Row[];
} = {}): PreparationReading {
  const evidence: string[] = [];

  // Como estou
  const readinessValue = finite(displayReadinessValue(model.readiness));
  const pair = model.readinessPair;
  const readinessDetail =
    model.readinessDelta != null && pair?.current && pair?.previous
      ? `Último fechamento (${formatDateBR(pair.current.date)}): ${pair.current.score}, ${model.readinessDelta > 0 ? '+' : model.readinessDelta < 0 ? '−' : ''}${Math.abs(model.readinessDelta)} ${Math.abs(model.readinessDelta) === 1 ? 'ponto' : 'pontos'} frente a ${pair.previous.score} em ${formatDateBR(pair.previous.date)}, último registro do período anterior.`
      : pair?.current
        ? `Último fechamento (${formatDateBR(pair.current.date)}): ${pair.current.score}.`
        : null;
  const delta = finite(model.readinessDelta);
  const readinessVerdict: ReadinessVerdict =
    delta == null
      ? null
      : Math.abs(delta) <= 1
        ? { state: 'steady', text: 'Tendência: estável frente ao período anterior' }
        : delta < 0
          ? { state: 'down', text: 'Tendência: em queda frente ao período anterior' }
          : { state: 'up', text: 'Tendência: em alta frente ao período anterior' };
  if (readinessValue != null && model.readinessDelta == null)
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
      ? `${formatStudyMinutes(week.studiedMinutes)} estudados de ${formatStudyMinutes(week.plannedMinutes)} planejados nos últimos 7 dias (${week.planFulfillmentPct}% do tempo planejado).`
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
      text: `${dropped[0].label} caiu no índice de Prontidão, de ${dropped[0].before} para ${dropped[0].after} (escala de 0 a 100)${pair?.previous && pair?.current ? ` entre ${formatDateBR(pair.previous.date)} e ${formatDateBR(pair.current.date)}` : ''}.`,
      link: null,
    });
  const gaps = candidates
    .filter(item => isStrategicGap(item))
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
  for (const gap of gaps.slice(0, 3 - pulling.length))
    pulling.push({
      text: `${gap.subjectName} — ${gap.topicName}: domínio ${round(Number(gap.mastery))} (desempenho no tópico, de 0 a 100); impacto alto na prova (${impactOrigin(gap)}).`,
      link: {
        kind: 'section',
        target: 'subjects',
        subjectId: gap.subjectId || null,
        label: 'Ver disciplina',
      },
    });
  const weakest = weeklyBrief?.weakestSubject;
  if (pulling.length < 3 && weakest && weakest.accuracy != null)
    pulling.push({
      text: `${weakest.name}: ${weakest.accuracy}% de acerto nos últimos 7 dias (${weakest.resolved} questões).`,
      link: { kind: 'section', target: 'subjects', subjectId: weakest.id, label: 'Ver disciplina' },
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
    const evidenceText = String(best.evidence || 'não avaliada').toLowerCase();
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
      planNote,
    };
  }
  if (!best?.activePlanId) evidence.push('Sem plano ativo: registre um plano para medir o ritmo.');
  const deficit =
    week && week.plannedMinutes > week.studiedMinutes
      ? `Faltam ${formatStudyMinutes(week.plannedMinutes - week.studiedMinutes)} para igualar o planejado nos últimos 7 dias.`
      : null;

  void range;
  return {
    howAmI: {
      readiness:
        readinessValue != null
          ? { value: readinessValue, detail: readinessDetail, verdict: readinessVerdict }
          : null,
      projection: projectionText ? { text: projectionText } : null,
      rhythm: rhythmText ? { text: rhythmText } : null,
    },
    pulling,
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
