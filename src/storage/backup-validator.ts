/**
 * Validador e normalizador profundo para integridade de backups e restaurações.
 */

import {
  STATUS_OPTIONS,
  DIFFICULTY_OPTIONS,
  TIPO_AGENDA_OPTIONS,
  REVIEW_OPTIONS,
  CURRENT_SCHEMA_VERSION,
} from '../state/schema.js';
import { EXAM_PRIORITIES } from '../state/strategic.js';
import { EXAM_INTELLIGENCE_CONFIG } from '../domain/exam-intelligence/config.js';
import { validateExam } from '../domain/exam-intelligence/exam.js';
import { validateExamQuestion } from '../domain/exam-intelligence/exam-question.js';
import { validAchievementProjectionSnapshot } from '../application/projection/achievement-projection-history.js';
import { validCapacityRecord } from '../domain/planning/capacity-history.js';
import { validateBackupEnvelope } from './migration-service.js';
import { validAdherenceTarget } from '../application/adherence/adherence-target.js';
import {
  isSafeId,
  isPlainObject,
  isISODate,
  isOptionalTimestamp,
  isFiniteNonNegative,
  structuredCloneSafe,
  pluralize,
} from '../core/utils.js';

export interface BackupValidationSuccess {
  valid: true;
  version: number;
  normalized: any;
}

export interface BackupValidationFailure {
  valid: false;
  message: string;
}

export type BackupValidationResult = BackupValidationSuccess | BackupValidationFailure;

export function validateNormalizedBackup(data: any): { valid: true } | BackupValidationFailure {
  const fail = (message: string): BackupValidationFailure => ({ valid: false, message });
  const collections = [
    'subjects',
    'calendar',
    'reviewAgenda',
    'questoes',
    'simulados',
    'exams',
    'examQuestions',
    'progressHistory',
    'readinessSnapshots',
    'projectionSnapshots',
    'studySessions',
    'dailyPlans',
    'studyPlans',
    'planAdjustments',
    'adaptivePlanningHistory',
    'recommendationFeedback',
    'recommendationHistory',
    'weeklyCloseSnapshots',
    'planningCapacityHistory',
    'alertStates',
    'topicHistory',
    'metasPorDisciplina',
  ];
  for (const field of collections) {
    if (!Array.isArray(data[field])) return fail(`O campo "${field}" deve ser uma lista.`);
    if (data[field].length > 50000)
      return fail(`O campo "${field}" excede o limite seguro de 50.000 registros.`);
  }
  const ids = new Set<string>(),
    subjectIds = new Set<string>(),
    topicIds = new Set<string>(),
    sessionIds = new Set<string>(),
    planItemIds = new Set<string>(),
    examIds = new Set<string>(),
    topicSubjectIds = new Map<string, string>();
  const registerId = (id: unknown, label: string) => {
    if (!isSafeId(id)) return `${label} possui um identificador inválido.`;
    if (ids.has(id)) return `O identificador "${id}" aparece mais de uma vez no backup.`;
    ids.add(id);
    return '';
  };
  const textOk = (value: unknown, max = 5000) => typeof value === 'string' && value.length <= max;
  for (const record of data.planningCapacityHistory) {
    if (!validCapacityRecord(record)) return fail('Registro de capacidade histórica inválido.');
    const error = registerId(record.id, 'Um registro de capacidade');
    if (error) return fail(error);
  }
  for (const subject of data.subjects) {
    if (!isPlainObject(subject)) return fail('Uma disciplina não é um objeto válido.');
    const idError = registerId(subject.id, 'Uma disciplina');
    if (idError) return fail(idError);
    subjectIds.add(subject.id);
    if (
      !textOk(subject.name, 300) ||
      !Array.isArray(subject.topics) ||
      subject.topics.length > 10000
    )
      return fail('Uma disciplina possui nome ou lista de tópicos inválida.');
    for (const topic of subject.topics) {
      if (!isPlainObject(topic)) return fail('Um tópico não é um objeto válido.');
      const topicIdError = registerId(topic.id, 'Um tópico');
      if (topicIdError) return fail(topicIdError);
      topicIds.add(topic.id);
      topicSubjectIds.set(topic.id, subject.id);
      if (
        !textOk(topic.name, 500) ||
        !textOk(topic.link || '', 2000) ||
        !textOk(topic.notes || '', 20000)
      )
        return fail('Um tópico excede os limites de texto permitidos.');
      if (!STATUS_OPTIONS.includes(topic.status) || !DIFFICULTY_OPTIONS.includes(topic.difficulty))
        return fail('Um tópico possui status ou dificuldade inválida.');
      if (
        !Array.isArray(topic.tags) ||
        topic.tags.length > 100 ||
        topic.tags.some(tag => !textOk(tag, 100))
      )
        return fail('Um tópico possui tags inválidas.');
      if (
        topic.examImportance !== null &&
        (!Number.isFinite(Number(topic.examImportance)) ||
          Number(topic.examImportance) < 0 ||
          Number(topic.examImportance) > 1)
      )
        return fail('Um tópico possui importância de prova inválida.');
      if (
        topic.estimatedStudyMinutes !== null &&
        (!isFiniteNonNegative(topic.estimatedStudyMinutes) ||
          Number(topic.estimatedStudyMinutes) <= 0)
      )
        return fail('Um tópico possui esforço estimado inválido.');
      if (
        !Array.isArray(topic.prerequisites) ||
        topic.prerequisites.length > 100 ||
        topic.prerequisites.some(id => !isSafeId(id))
      )
        return fail('Um tópico possui pré-requisitos inválidos.');
    }
  }
  for (const exam of data.exams) {
    const issue = validateExam(exam);
    if (issue) return fail(issue);
    const idError = registerId(exam.id, 'Uma prova histórica');
    if (idError) return fail(idError);
    examIds.add(exam.id);
  }
  const questionKeys = new Set<string>();
  for (const question of data.examQuestions) {
    const issue = validateExamQuestion(question);
    if (issue) return fail(issue);
    const idError = registerId(question.id, 'Uma questão histórica');
    if (idError) return fail(idError);
    if (
      !examIds.has(question.examId) ||
      !subjectIds.has(question.subjectId) ||
      topicSubjectIds.get(question.topicId) !== question.subjectId
    )
      return fail('Uma questão histórica aponta para prova, disciplina ou tópico inexistente.');
    const key = `${question.examId}:${question.questionNumber}`;
    if (questionKeys.has(key)) return fail('Uma prova contém números de questão duplicados.');
    questionKeys.add(key);
  }
  if (
    data.exams.some((exam: any) =>
      (exam.unresolvedQuestions || []).some((row: any) =>
        questionKeys.has(`${exam.id}:${row.number}`)
      )
    )
  )
    return fail('Uma questão histórica não pode estar classificada e pendente ao mesmo tempo.');
  const validateEntity = (item: any, label: string) => {
    if (!isPlainObject(item)) return `${label} não é um objeto válido.`;
    return registerId(item.id, label);
  };
  for (const item of data.calendar) {
    const error = validateEntity(item, 'Um item do calendário');
    if (error) return fail(error);
    if (
      !isISODate(item.date) ||
      !STATUS_OPTIONS.includes(item.status) ||
      !REVIEW_OPTIONS.includes(item.reviewType)
    )
      return fail('Um item do calendário possui data, status ou tipo inválido.');
  }
  for (const item of data.reviewAgenda) {
    const error = validateEntity(item, 'Uma revisão');
    if (error) return fail(error);
    if (
      !isISODate(item.date) ||
      !STATUS_OPTIONS.includes(item.status) ||
      !TIPO_AGENDA_OPTIONS.includes(item.tipo) ||
      !isOptionalTimestamp(item.completedAt)
    )
      return fail('Uma revisão possui data, status ou tipo inválido.');
  }
  for (const item of data.questoes) {
    const error = validateEntity(item, 'Um registro de questões');
    if (error) return fail(error);
    if (
      !isISODate(item.date) ||
      !isFiniteNonNegative(item.resolved) ||
      !isFiniteNonNegative(item.correct) ||
      Number(item.correct) > Number(item.resolved)
    )
      return fail('Um registro de questões possui data ou totais inválidos.');
  }
  for (const item of data.simulados) {
    const error = validateEntity(item, 'Um simulado');
    if (error) return fail(error);
    if (
      !isISODate(item.date) ||
      !textOk(item.nome || '', 500) ||
      !isFiniteNonNegative(item.total) ||
      !isFiniteNonNegative(item.correct) ||
      Number(item.correct) > Number(item.total) ||
      !Array.isArray(item.breakdown)
    )
      return fail('Um simulado possui dados inválidos.');
    for (const row of item.breakdown) {
      const rowError = validateEntity(row, 'Uma linha de simulado');
      if (rowError) return fail(rowError);
      if (
        !isFiniteNonNegative(row.total) ||
        !isFiniteNonNegative(row.correct) ||
        Number(row.correct) > Number(row.total)
      )
        return fail('Uma linha de simulado possui totais inválidos.');
    }
  }
  for (const item of data.studySessions) {
    const error = validateEntity(item, 'Uma sessão');
    if (error) return fail(error);
    sessionIds.add(item.id);
    if (
      !isISODate(item.date) ||
      !isFiniteNonNegative(item.durationSeconds) ||
      !isFiniteNonNegative(item.questionsResolved) ||
      !isFiniteNonNegative(item.correctAnswers) ||
      Number(item.correctAnswers) > Number(item.questionsResolved) ||
      !['study', 'review', 'questions', 'simulation'].includes(item.type) ||
      !textOk(item.notes || '', 20000)
    )
      return fail('Uma sessão de estudo possui dados inválidos.');
  }
  for (const plan of data.dailyPlans) {
    const error = validateEntity(plan, 'Um plano diário');
    if (error) return fail(error);
    if (
      !isISODate(plan.date) ||
      !isFiniteNonNegative(plan.availableMinutes) ||
      !Array.isArray(plan.items)
    )
      return fail('Um plano diário possui dados inválidos.');
    for (const item of plan.items) {
      const itemError = validateEntity(item, 'Um item de plano');
      if (itemError) return fail(itemError);
      planItemIds.add(item.id);
      if (
        !isFiniteNonNegative(item.plannedMinutes) ||
        !isFiniteNonNegative(item.executedSeconds) ||
        !['study', 'review', 'questions', 'simulation'].includes(item.type) ||
        ![
          'planned',
          'in_progress',
          'partial',
          'completed',
          'deferred',
          'replaced',
          'skipped',
        ].includes(item.status)
      )
        return fail('Um item de plano possui dados inválidos.');
    }
  }
  for (const plan of data.studyPlans) {
    const error = validateEntity(plan, 'Um plano até a prova');
    if (error) return fail(error);
    if (
      !isOptionalTimestamp(plan.confirmedAt) ||
      !isFiniteNonNegative(plan.weeklyAvailableMinutes) ||
      !isFiniteNonNegative(plan.weeklyPlannedMinutes) ||
      !Array.isArray(plan.subjects) ||
      !Array.isArray(plan.items)
    )
      return fail('Um plano até a prova possui dados inválidos.');
  }
  for (const item of data.planAdjustments) {
    const error = validateEntity(item, 'Um ajuste de plano');
    if (error) return fail(error);
    if (
      !isISODate(item.periodStart) ||
      !isISODate(item.periodEnd) ||
      !isOptionalTimestamp(item.confirmedAt) ||
      !isFiniteNonNegative(item.deficitMinutes) ||
      !isFiniteNonNegative(item.redistributedMinutes) ||
      !Array.isArray(item.allocations)
    )
      return fail('Um ajuste de plano possui dados inválidos.');
  }
  for (const item of data.adaptivePlanningHistory) {
    const error = validateEntity(item, 'Uma decisão de planejamento');
    if (error) return fail(error);
    if (
      typeof item.createdAt !== 'string' ||
      !isOptionalTimestamp(item.createdAt) ||
      !isOptionalTimestamp(item.decidedAt) ||
      !['suggested', 'applied', 'rejected', 'reverted'].includes(item.status) ||
      !isSafeId(item.sourceSubjectId) ||
      !isSafeId(item.targetSubjectId) ||
      !isFiniteNonNegative(item.minutes) ||
      Number(item.minutes) < EXAM_INTELLIGENCE_CONFIG.transferMinimumMinutes ||
      Number(item.minutes) > EXAM_INTELLIGENCE_CONFIG.transferMaximumMinutes ||
      !Array.isArray(item.reasons) ||
      item.reasons.some((reason: any) => !textOk(reason, 500)) ||
      [item.sourceBefore, item.sourceAfter, item.targetBefore, item.targetAfter].some(
        value => !isFiniteNonNegative(value)
      ) ||
      !Number.isInteger(Number(item.algorithmVersion)) ||
      Number(item.algorithmVersion) < 1
    )
      return fail('Uma decisão de planejamento possui dados inválidos.');
    if (
      [item.planId, item.sourceTopicId, item.targetTopicId].some(id => id != null && !isSafeId(id))
    )
      return fail('Uma decisão de planejamento possui referência inválida.');
    if (
      ['applied', 'reverted'].includes(item.status) &&
      (!isSafeId(item.planId) ||
        !isSafeId(item.sourceTopicId) ||
        !isSafeId(item.targetTopicId) ||
        !isFiniteNonNegative(item.sourceItemBefore) ||
        !isFiniteNonNegative(item.targetItemBefore) ||
        !isPlainObject(item.sourceMixBefore) ||
        !isPlainObject(item.targetMixBefore))
    )
      return fail('Uma decisão de planejamento aplicada não pode ser revertida com estes dados.');
  }
  for (const item of data.recommendationFeedback) {
    const error = validateEntity(item, 'Um feedback de recomendação');
    if (error) return fail(error);
    if (
      !isISODate(item.date) ||
      typeof item.accepted !== 'boolean' ||
      typeof item.completed !== 'boolean' ||
      !isOptionalTimestamp(item.createdAt) ||
      !isOptionalTimestamp(item.completedAt)
    )
      return fail('Um feedback de recomendação possui dados inválidos.');
  }
  for (const item of data.recommendationHistory) {
    const error = validateEntity(item, 'Uma recomendação histórica');
    if (error) return fail(error);
    if (
      typeof item.createdAt !== 'string' ||
      !isOptionalTimestamp(item.createdAt) ||
      !['pending', 'executed', 'dismissed', 'expired'].includes(item.status) ||
      !isOptionalTimestamp(item.executedAt) ||
      !isOptionalTimestamp(item.dismissedAt) ||
      !isOptionalTimestamp(item.expiredAt) ||
      !['study', 'review', 'questions', 'prerequisite'].includes(item.activityType) ||
      !Array.isArray(item.reasons) ||
      item.reasons.some((reason: any) => typeof reason !== 'string' || reason.length > 500) ||
      (item.suggestedMinutes != null && !isFiniteNonNegative(item.suggestedMinutes)) ||
      (item.priority != null && !isFiniteNonNegative(item.priority)) ||
      [item.subjectId, item.topicId, item.sessionId, item.feedbackId, item.candidateId].some(
        id => id != null && !isSafeId(id)
      )
    )
      return fail('Uma recomendação histórica possui dados inválidos.');
  }
  for (const item of data.alertStates) {
    if (
      !isPlainObject(item) ||
      !isSafeId(item.alertId) ||
      !(item.dismissedUntil === null || isISODate(item.dismissedUntil)) ||
      !(item.resolvedAt === null || isISODate(item.resolvedAt))
    )
      return fail('Um estado de alerta possui dados inválidos.');
  }
  for (const item of data.topicHistory) {
    const error = validateEntity(item, 'Um evento histórico');
    if (error) return fail(error);
  }
  for (const item of data.metasPorDisciplina) {
    const error = validateEntity(item, 'Uma meta por disciplina');
    if (error) return fail(error);
    if (!isFiniteNonNegative(item.meta))
      return fail('Uma meta por disciplina possui valor inválido.');
  }
  const validRef = (value: unknown, set: Set<string>) =>
    value == null || (typeof value === 'string' && isSafeId(value) && set.has(value));
  if (
    data.subjects.some((subject: any) =>
      subject.topics.some((topic: any) =>
        topic.prerequisites.some((id: any) => !topicIds.has(id) || id === topic.id)
      )
    )
  )
    return fail('O backup contém pré-requisito de tópico inexistente ou circular direto.');
  const referenceCollections = [
    ...data.calendar,
    ...data.reviewAgenda,
    ...data.questoes,
    ...data.studySessions,
    ...data.metasPorDisciplina,
  ];
  if (
    referenceCollections.some(
      (item: any) => !validRef(item.subjectId, subjectIds) || !validRef(item.topicId, topicIds)
    )
  )
    return fail('O backup contém referência para disciplina ou tópico inexistente.');
  if (
    data.simulados.some((sim: any) =>
      sim.breakdown.some((item: any) => !validRef(item.subjectId, subjectIds))
    )
  )
    return fail('O backup contém detalhamento de simulado para uma disciplina inexistente.');
  if (
    data.dailyPlans.some((plan: any) =>
      plan.items.some(
        (item: any) => !validRef(item.subjectId, subjectIds) || !validRef(item.topicId, topicIds)
      )
    )
  )
    return fail('O backup contém item de plano com referência inexistente.');
  if (
    data.topicHistory.some(
      (item: any) =>
        (item.subjectId != null && !isSafeId(item.subjectId)) ||
        (item.topicId != null && !isSafeId(item.topicId))
    )
  )
    return fail('O backup contém histórico com identificador inseguro.');
  if (
    data.questoes.some(
      (item: any) => item.studySessionId != null && !validRef(item.studySessionId, sessionIds)
    )
  )
    return fail('O backup contém questões vinculadas a uma sessão inexistente.');
  if (
    data.studySessions.some(
      (item: any) => item.planItemId != null && !validRef(item.planItemId, planItemIds)
    )
  )
    return fail('O backup contém sessão vinculada a um item de plano inexistente.');
  if (
    !isPlainObject(data.metas) ||
    Object.entries(data.metas).some(
      ([key, value]) => key !== 'horasPorDia' && !isFiniteNonNegative(value)
    ) ||
    !isPlainObject(data.metas.horasPorDia) ||
    Object.values(data.metas.horasPorDia).some(value => !isFiniteNonNegative(value))
  )
    return fail('O backup contém metas globais inválidas.');
  if (
    !isPlainObject(data.activeTimer) ||
    !isFiniteNonNegative(data.activeTimer.accumulatedSeconds) ||
    !validRef(data.activeTimer.subjectId, subjectIds) ||
    !validRef(data.activeTimer.topicId, topicIds) ||
    !validRef(data.activeTimer.planItemId, planItemIds)
  )
    return fail('O backup contém um cronômetro ativo inválido.');
  if (
    !isPlainObject(data.examBlueprint) ||
    !(data.examBlueprint.examDate === null || isISODate(data.examBlueprint.examDate)) ||
    !Number.isFinite(Number(data.examBlueprint.targetScore)) ||
    Number(data.examBlueprint.targetScore) < 0 ||
    Number(data.examBlueprint.targetScore) > 100 ||
    !isOptionalTimestamp(data.examBlueprint.configuredAt) ||
    !Array.isArray(data.examBlueprint.subjects) ||
    data.examBlueprint.subjects.length > 1000
  )
    return fail('O backup contém configuração de prova inválida.');
  if (
    data.examBlueprint.subjects.some(
      (item: any) =>
        item?.accuracyTarget != null &&
        (typeof item.accuracyTarget !== 'number' ||
          !Number.isFinite(item.accuracyTarget) ||
          item.accuracyTarget < 0 ||
          item.accuracyTarget > 100)
    )
  )
    return fail('O backup contém meta de acerto por disciplina inválida.');
  if (
    data.examBlueprint.subjects.some(
      (item: any) =>
        !isPlainObject(item) ||
        !validRef(item.subjectId, subjectIds) ||
        !isFiniteNonNegative(item.expectedQuestions) ||
        !isFiniteNonNegative(item.questionWeight) ||
        !EXAM_PRIORITIES.includes(item.priority)
    )
  )
    return fail('O backup contém peso de disciplina inválido.');
  if (
    !isPlainObject(data.algorithmVersions) ||
    Object.values(data.algorithmVersions).some(
      value => !Number.isInteger(Number(value)) || Number(value) < 1
    )
  )
    return fail('O backup contém versões de algoritmos inválidas.');
  if (
    data.progressHistory.some(
      (item: any) =>
        !isPlainObject(item) ||
        !isISODate(item.date) ||
        !isFiniteNonNegative(item.pct) ||
        Number(item.pct) > 100
    )
  )
    return fail('O backup contém histórico de progresso inválido.');
  if (
    data.projectionSnapshots.some(
      (item: any) =>
        !isPlainObject(item) ||
        !isSafeId(item.id) ||
        !isISODate(item.date) ||
        !Number.isFinite(Date.parse(item.issuedAt)) ||
        !Array.isArray(item.activeExamTags) ||
        item.activeExamTags.some(tag => typeof tag !== 'string') ||
        !textOk(item.signature, 100000) ||
        (item.kind === 'achievement'
          ? !validAchievementProjectionSnapshot(item) ||
            item.source.simulations.some(
              (input: any) =>
                !isPlainObject(input) ||
                !isSafeId(input.id) ||
                !isISODate(input.date) ||
                !isFiniteNonNegative(input.correct) ||
                !isFiniteNonNegative(input.total) ||
                Number(input.total) <= 0 ||
                Number(input.correct) > Number(input.total)
            )
          : item.kind !== undefined ||
            !Array.isArray(item.inputs) ||
            (item.knownSimulationIds !== undefined &&
              (!Array.isArray(item.knownSimulationIds) ||
                item.knownSimulationIds.some(id => !isSafeId(id)))) ||
            !textOk(item.composition, 10000) ||
            ![item.low, item.central, item.high].every(
              value =>
                typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
            ) ||
            item.low > item.central ||
            item.central > item.high ||
            item.algorithmVersion !== 1 ||
            item.inputs.some(
              (input: any) =>
                !isPlainObject(input) ||
                !isSafeId(input.id) ||
                !isISODate(input.date) ||
                !isFiniteNonNegative(input.correct) ||
                !isFiniteNonNegative(input.total) ||
                Number(input.total) <= 0 ||
                Number(input.correct) > Number(input.total)
            ))
    )
  )
    return fail('O backup contém faixas de projeção inválidas.');
  if (
    data.readinessSnapshots.some(
      (item: any) =>
        !isPlainObject(item) ||
        !isSafeId(item.id) ||
        !isISODate(item.date) ||
        !isFiniteNonNegative(item.score) ||
        Number(item.score) > 100 ||
        !Array.isArray(item.activeExamTags) ||
        !isPlainObject(item.factors) ||
        !Number.isInteger(Number(item.algorithmVersion))
    )
  )
    return fail('O backup contém histórico de prontidão inválido.');
  if (
    data.readinessSnapshots.some(
      (item: any) =>
        (item.weights !== undefined &&
          (!isPlainObject(item.weights) ||
            !Object.keys(item.weights).length ||
            Object.values(item.weights).some(
              value => !isFiniteNonNegative(value) || Number(value) <= 0
            ))) ||
        (item.captureKind !== undefined &&
          !['weekly-close', 'before-strategy-change'].includes(item.captureKind)) ||
        (item.eventKey != null && !isSafeId(item.eventKey)) ||
        (item.reason != null && !textOk(item.reason, 500))
    )
  )
    return fail('O backup contém metadados de prontidão inválidos.');
  const flashcardError = validateErrorFlashcards(data.errorFlashcards);
  if (flashcardError) return fail(flashcardError);
  return { valid: true };
}

const FLASHCARD_STATUSES = ['pending', 'reviewing', 'mastered'];

/**
 * Valida o Caderno de Erros. O campo é opcional (backups anteriores não o possuem) e referências
 * a disciplina/tópico removidos são preservadas: o cartão é histórico do estudante e a exclusão
 * de um tópico não deve tornar o próprio backup irrestaurável.
 */
function validateErrorFlashcards(cards: unknown): string {
  if (cards === undefined) return '';
  if (!Array.isArray(cards)) return 'O campo "errorFlashcards" deve ser uma lista.';
  if (cards.length > 50000)
    return 'O campo "errorFlashcards" excede o limite seguro de 50.000 registros.';
  const seen = new Set<string>();
  const text = (value: unknown, max: number, required = false) =>
    typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
  const count = (value: unknown) => Number.isInteger(value) && (value as number) >= 0;
  for (const card of cards) {
    if (!isPlainObject(card)) return 'Um flashcard de erro não é um objeto válido.';
    if (!isSafeId(card.id)) return 'Um flashcard de erro possui um identificador inválido.';
    if (seen.has(card.id))
      return `O identificador "${card.id}" aparece mais de uma vez nos flashcards de erro.`;
    seen.add(card.id);
    if (!isSafeId(card.topicId) || !isSafeId(card.subjectId))
      return `O flashcard "${card.id}" possui um identificador de tópico ou disciplina inválido.`;
    if (card.questionId != null && !isSafeId(card.questionId))
      return `O flashcard "${card.id}" possui um identificador de questão inválido.`;
    if (!FLASHCARD_STATUSES.includes(card.status))
      return `O flashcard "${card.id}" possui status inválido.`;
    if (!text(card.statementSummary, 5000) || !text(card.correctConcept, 5000, true))
      return `O flashcard "${card.id}" possui texto ou conceito correto inválido.`;
    if (
      (card.bancaTrap != null && !text(card.bancaTrap, 5000)) ||
      (card.errorCategory != null && !text(card.errorCategory, 200))
    )
      return `O flashcard "${card.id}" possui texto de pegadinha ou categoria inválido.`;
    if (!count(card.reviewCount) || !count(card.consecutiveSuccesses))
      return `O flashcard "${card.id}" possui contagem de revisões inválida.`;
    if (!isFiniteNonNegative(card.intervalDays))
      return `O flashcard "${card.id}" possui intervalo de revisão inválido.`;
    if (
      typeof card.easeFactor !== 'number' ||
      !Number.isFinite(card.easeFactor) ||
      card.easeFactor < 1.3 ||
      card.easeFactor > 3.5
    )
      return `O flashcard "${card.id}" possui fator de facilidade inválido.`;
    if (!(card.nextReviewDate == null || isISODate(card.nextReviewDate)))
      return `O flashcard "${card.id}" possui data da próxima revisão inválida.`;
    if (!Number.isFinite(Date.parse(card.createdAt)))
      return `O flashcard "${card.id}" possui data de criação inválida.`;
    if (!isOptionalTimestamp(card.lastReviewedAt))
      return `O flashcard "${card.id}" possui data da última revisão inválida.`;
  }
  return '';
}

export interface ValidateBackupDataOptions {
  ensureDefaults?: (candidate: any) => void;
  migrateState?: (candidate: any) => any;
  currentSchemaVersion?: number;
}

export function validateBackupData(
  data: any,
  options: ValidateBackupDataOptions = {}
): BackupValidationResult {
  if (
    data?.metas?.aderenciaSemanal !== undefined &&
    !validAdherenceTarget(data.metas.aderenciaSemanal)
  )
    return {
      valid: false,
      message: 'A meta de aderência deve estar entre 50 e 100%, ou desativada (null).',
    };
  const arrayFields = [
    'planningCapacityHistory',
    'calendar',
    'reviewAgenda',
    'questoes',
    'simulados',
    'exams',
    'examQuestions',
    'progressHistory',
    'readinessSnapshots',
    'projectionSnapshots',
    'studySessions',
    'dailyPlans',
    'studyPlans',
    'planAdjustments',
    'adaptivePlanningHistory',
    'recommendationFeedback',
    'recommendationHistory',
    'alertStates',
    'topicHistory',
    'metasPorDisciplina',
    'errorFlashcards',
  ];
  const envelope = validateBackupEnvelope(data, {
    currentVersion: options.currentSchemaVersion ?? CURRENT_SCHEMA_VERSION,
    arrayFields,
  });
  if (envelope.valid === false) {
    return { valid: false, message: envelope.message };
  }
  const { version } = envelope;
  try {
    const rawClone = structuredCloneSafe(data);
    const normalized = options.migrateState ? options.migrateState(rawClone) : rawClone;
    if (options.ensureDefaults) {
      options.ensureDefaults(normalized);
    }
    const deepValidation = validateNormalizedBackup(normalized);
    if (deepValidation.valid === false) {
      return deepValidation;
    }
    return { valid: true, version, normalized };
  } catch (error) {
    console.error('Falha ao normalizar backup para validação', error);
    return {
      valid: false,
      message: 'O backup contém dados que não puderam ser normalizados com segurança.',
    };
  }
}

export function backupSummary(data: any, version: number): string {
  if (!data || !Array.isArray(data.subjects)) return '';
  const subjectCount = data.subjects.length;
  const topicCount = data.subjects.reduce(
    (sum: number, subject: any) =>
      sum + (Array.isArray(subject.topics) ? subject.topics.length : 0),
    0
  );
  const sessionCount = Array.isArray(data.studySessions) ? data.studySessions.length : 0;
  const questionCount = Array.isArray(data.questoes) ? data.questoes.length : 0;
  const updated = Date.parse(data.updatedAt || '');
  const updatedLabel = Number.isFinite(updated)
    ? new Date(updated).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : 'data não informada';
  return `Backup v${version}: ${pluralize(subjectCount, 'disciplina')}, ${pluralize(
    topicCount,
    'tópico'
  )}, ${pluralize(sessionCount, 'sessão', 'sessões')} e ${pluralize(
    questionCount,
    'registro'
  )} de questões. Última atualização: ${updatedLabel}.`;
}
