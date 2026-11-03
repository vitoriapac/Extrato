import { addLocalDays } from '../../core/date-utils.js';

const genericErrors: Record<string, any> = {
  naoSabia: 24,
  esqueci: 17,
  interpretacao: 19,
  calculo: 15,
  desatencao: 17,
  chute: 8,
};
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const dateAt = (today: string, day: number, historyDays: number) =>
  addLocalDays(today, day - historyDays);

export function allocateErrors(errors: number, categories: string[], profile: Record<string, any>) {
  const weights = categories.map((key: any) =>
    Math.max(0, Number(profile?.[key] ?? genericErrors[key] ?? 0))
  );
  const total = weights.reduce((sum: any, value: any) => sum + value, 0) || 1;
  const exact = weights.map((value: any) => (errors * value) / total),
    counts = exact.map(Math.floor);
  let remainder = errors - counts.reduce((sum: any, value: any) => sum + value, 0);
  const order = exact
    .map((value: any, index: any) => ({ index, fraction: value - counts[index] }))
    .sort((a: any, b: any) => b.fraction - a.fraction || a.index - b.index);
  for (let index = 0; index < remainder; index++) counts[order[index % order.length].index]++;
  return Object.fromEntries(categories.map((key: any, index: any) => [key, counts[index]]));
}

function phaseSlots(scenario: Record<string, any>) {
  const phases = scenario.profile.phases;
  const weights = phases.map(
    (phase: any) => ((phase.days[1] - phase.days[0] + 1) / 7) * phase.weeklyHours
  );
  const total = weights.reduce((sum: any, value: any) => sum + value, 0),
    target = scenario.targets.studySessions;
  const exact = weights.map((value: any) => (target * value) / total),
    counts = exact.map(Math.floor);
  let left = target - counts.reduce((sum: any, value: any) => sum + value, 0);
  const order = exact
    .map((value: any, index: any) => ({ index, fraction: value - counts[index] }))
    .sort((a: any, b: any) => b.fraction - a.fraction);
  for (let index = 0; index < left; index++) counts[order[index].index]++;
  return phases.flatMap((phase: any, phaseIndex: any) => {
    const days = Array.from(
      { length: phase.days[1] - phase.days[0] + 1 },
      (_, index) => phase.days[0] + index
    ).filter(day => day % 7 !== 0 && day % 11 !== 0);
    return Array.from(
      { length: counts[phaseIndex] },
      (_, index) => days[(index * 7 + Math.floor(index / days.length)) % days.length]
    );
  });
}

function narrativeQuestionSlots(questionSlots: number[], entries: any[], totalQuestions: number) {
  const strategic = entries.filter((entry: any) => entry.source?.narrativeRole),
    assigned = new Map(),
    used = new Set<number>();
  for (const [roleIndex, entry] of strategic.entries()) {
    const count = entry.source.narrativeRole === 'insufficient_evidence' ? 1 : 3;
    for (let part = 0; part < count; part++) {
      const target = Math.floor(((part + 1) * questionSlots.length) / (count + 1)) + roleIndex;
      let position = target % questionSlots.length;
      while (used.has(position)) position = (position + 1) % questionSlots.length;
      used.add(position);
      assigned.set(questionSlots[position], { entry, part, count });
    }
  }
  const reserved = strategic.reduce(
    (sum: any, entry: any) => sum + entry.source.targetQuestionVolume,
    0
  );
  if (reserved > totalQuestions)
    throw new RangeError('Volumes narrativos excedem as questões da demonstração.');
  const genericCount = questionSlots.length - assigned.size,
    genericTotal = totalQuestions - reserved;
  if (!genericCount || genericTotal < genericCount)
    throw new RangeError('Questões insuficientes para as sessões genéricas.');
  const genericBase = Math.floor(genericTotal / genericCount),
    genericExtra = genericTotal % genericCount;
  let genericIndex = 0;
  return new Map(
    questionSlots.map((index: any) => {
      const selected = assigned.get(index);
      if (selected) {
        const volume = selected.entry.source.targetQuestionVolume;
        return [
          index,
          {
            entry: selected.entry,
            resolved:
              Math.floor(volume / selected.count) +
              (selected.part < volume % selected.count ? 1 : 0),
          },
        ];
      }
      const resolved = genericBase + (genericIndex++ < genericExtra ? 1 : 0);
      return [index, { entry: null, resolved }];
    })
  );
}

function narrativeAccuracy(source: Record<string, any>, day: number, historyDays: number) {
  const target = source.targetMastery,
    progress = day / historyDays;
  if (source.narrativeRole === 'improving') return clamp(target - 16 + 16 * progress, 0, 100);
  if (source.narrativeRole === 'declining') return clamp(target + 13 - 13 * progress, 0, 100);
  if (source.narrativeRole === 'priority_gap') return clamp(target - 8 + 8 * progress, 0, 100);
  return target;
}

export function buildDemoStudyHistory(
  scenario: Record<string, any>,
  { today, subjects, random }: any
) {
  const { historyDays } = scenario.meta,
    slots = phaseSlots(scenario),
    sourceTopics = new Map(
      scenario.subjects.flatMap((subject: any) =>
        subject.topics.map((topic: any) => [topic.id, topic])
      )
    ),
    entries = subjects.flatMap((subject: any) =>
      subject.topics.map((topic: any) => ({ subject, topic, source: sourceTopics.get(topic.id) }))
    );
  const types = scenario.sessions.types,
    durations = scenario.sessions.durationsMinutes,
    questionSlots = slots
      .map((_: any, index: any) => index)
      .filter((index: any) => types[index % types.length] === 'questions');
  const questionAssignments = narrativeQuestionSlots(
      questionSlots,
      entries,
      scenario.targets.studyQuestions
    ),
    genericEntries = entries.filter((entry: any) => !entry.source?.narrativeRole),
    narrativeEntries = entries.filter((entry: any) => entry.source?.narrativeRole);
  const studySessions: any[] = [],
    questoes: any[] = [];
  const plateauTopicA =
    entries.find((e: any) => e.topic.name === 'Concordância verbal') || genericEntries[0];
  const plateauTopicB =
    entries.find((e: any) => e.topic.name === 'Operações compromissadas') || genericEntries[1];
  const plateauSlotsA = new Set([128, 148, 168, 188]);
  const plateauSlotsB = new Set([131, 151, 171, 191]);

  slots.forEach((day: any, index: any) => {
    const type = types[index % types.length],
      assignment: any = questionAssignments.get(index);

    let entry =
      assignment?.entry ||
      (!assignment && index % 5 === 0 && narrativeEntries.length
        ? narrativeEntries[Math.floor(index / 5) % narrativeEntries.length]
        : genericEntries[(index * 37) % genericEntries.length]);

    let forcedPlateauRate: number | null = null;
    if (type === 'questions' && !assignment?.entry && day >= historyDays - 28) {
      if (plateauSlotsA.has(index)) {
        entry = plateauTopicA;
        forcedPlateauRate = 65;
      } else if (plateauSlotsB.has(index)) {
        entry = plateauTopicB;
        forcedPlateauRate = 55;
      }
    }

    const date = dateAt(today, day, historyDays);
    const durationMinutes =
      durations[(index + Math.floor(random() * durations.length)) % durations.length];

    const slot = index % 10;
    let hour = 8;
    let focusLevel: 'deep' | 'normal' | 'distracted' = 'normal';
    let energyLevel: 'high' | 'normal' | 'low' = 'normal';

    if (slot < 5) {
      hour = 7 + (index % 4);
      focusLevel = index % 4 === 0 ? 'normal' : 'deep';
      energyLevel = index % 5 === 0 ? 'normal' : 'high';
    } else if (slot < 8) {
      hour = 13 + (index % 4);
      focusLevel = index % 3 === 0 ? 'deep' : index % 3 === 1 ? 'normal' : 'distracted';
      energyLevel = index % 2 === 0 ? 'normal' : index % 4 === 1 ? 'high' : 'low';
    } else {
      hour = 19 + (index % 3);
      focusLevel = index % 3 === 0 ? 'normal' : 'distracted';
      energyLevel = index % 3 === 0 ? 'normal' : 'low';
    }

    const startedAt = `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`;
    const session = {
      id: `demo-session-${index + 1}`,
      date,
      startedAt,
      endedAt: new Date(Date.parse(startedAt) + durationMinutes * 60000).toISOString(),
      durationSeconds: durationMinutes * 60,
      subjectId: entry.subject.id,
      topicId: entry.topic.id,
      planItemId: null as any,
      type,
      focusLevel,
      energyLevel,
      questionsResolved: 0,
      correctAnswers: 0,
      questionsCorrect: 0,
      notes: index % 13 === 0 ? 'Sessão demonstrativa com observação de progresso.' : '',
      createdAt: startedAt,
    };
    if (type === 'questions') {
      const resolved = assignment.resolved;
      const month = Math.min(
        scenario.questions.monthlyAccuracyPct.length - 1,
        Math.floor((day - 1) / 30)
      );
      const phaseRate = scenario.questions.monthlyAccuracyPct[month],
        subjectRate =
          Number(
            scenario.subjects.find((item: any) => item.id === entry.subject.id)?.targetAccuracyPct
          ) || 70;

      let rate: number;
      if (forcedPlateauRate !== null) {
        rate = forcedPlateauRate;
      } else if (entry.source?.narrativeRole) {
        rate = narrativeAccuracy(entry.source, day, historyDays);
      } else {
        const baseRate = phaseRate + (subjectRate - 70) * 0.55 + (random() - 0.5) * 10;
        const shiftModifier = hour < 12 ? 6 : hour >= 18 ? -18 : 0;
        rate = clamp(baseRate + shiftModifier, 30, 95);
      }

      const correct = Math.round((resolved * rate) / 100),
        errors = resolved - correct;
      session.questionsResolved = resolved;
      session.correctAnswers = correct;
      session.questionsCorrect = correct;
      questoes.push({
        id: `demo-question-${questoes.length + 1}`,
        date,
        subjectId: entry.subject.id,
        topicId: entry.topic.id,
        resolved,
        correct,
        errorBreakdown: allocateErrors(
          errors,
          scenario.questions.errorCategories,
          scenario.questions.profiles?.[entry.subject.name]
        ),
        studySessionId: session.id,
        createdAt: startedAt,
      });
    }
    studySessions.push(session);
  });
  return { studySessions, questoes };
}
