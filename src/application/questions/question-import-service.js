import {
  normalizeKey,
  normalizeQuestionImportRows,
} from '../../domain/questions/question-import-normalizer.js';

/**
 * @param {Object} [deps]
 * @param {any} [deps.subjectService]
 * @param {any} [deps.questionService]
 * @param {() => any[]} [deps.getSubjects]
 * @param {() => any[]} [deps.getQuestions]
 * @param {string[]} [deps.errorCategoryKeys] chaves de ERROR_CATEGORIES do app
 * @param {() => string} [deps.today] data local AAAA-MM-DD, usada quando a linha do CSV não traz data
 * @param {<T>(task: () => T) => T} [deps.atomic] executa a importação e desfaz todas as mudanças se ela lançar erro
 */
export function createQuestionImportService({
  subjectService,
  questionService,
  getSubjects,
  getQuestions,
  errorCategoryKeys,
  today,
  atomic,
} = {}) {
  if (
    !subjectService ||
    !questionService ||
    typeof getSubjects !== 'function' ||
    typeof getQuestions !== 'function' ||
    !Array.isArray(errorCategoryKeys) ||
    !errorCategoryKeys.length ||
    typeof today !== 'function' ||
    typeof atomic !== 'function'
  ) {
    throw new TypeError(
      'Serviço de importação de questões requer subjectService, questionService, getSubjects, getQuestions, errorCategoryKeys, today e atomic.'
    );
  }

  const preview = (rawText, { fileName = '' } = {}) => {
    const records = normalizeQuestionImportRows(rawText, {
      defaultDate: today(),
      errorCategoryKeys,
    });
    const subjects = getSubjects();
    const existingQuestions = getQuestions();

    const newSubjectsMap = new Map();
    const newTopicsMap = new Map();
    let matchedSubjectsCount = 0;
    let matchedTopicsCount = 0;
    let duplicateCount = 0;
    let totalResolved = 0;
    let totalCorrect = 0;
    let unknownErrorCategoryCount = 0;
    let archivedRecordCount = 0;
    const archivedMatches = new Set();

    const preparedRecords = records.map(record => {
      totalResolved += record.resolved;
      totalCorrect += record.correct;
      unknownErrorCategoryCount += record.unknownErrorCategoryCount;

      const subjectKey = normalizeKey(record.subjectName);
      const matchedSubject = subjects.find(s => normalizeKey(s.name) === subjectKey);

      let matchedTopic = null;
      if (matchedSubject) {
        matchedSubjectsCount++;
        if (record.topicName) {
          const topicKey = normalizeKey(record.topicName);
          matchedTopic = (matchedSubject.topics || []).find(t => normalizeKey(t.name) === topicKey);
          if (matchedTopic) {
            matchedTopicsCount++;
          } else {
            const key = `${matchedSubject.id}|${topicKey}`;
            if (!newTopicsMap.has(key)) {
              newTopicsMap.set(key, {
                subjectName: matchedSubject.name,
                topicName: record.topicName,
                subjectId: matchedSubject.id,
              });
            }
          }
        }
      } else {
        if (!newSubjectsMap.has(subjectKey)) {
          newSubjectsMap.set(subjectKey, record.subjectName);
        }
        if (record.topicName) {
          const key = `${subjectKey}|${normalizeKey(record.topicName)}`;
          if (!newTopicsMap.has(key)) {
            newTopicsMap.set(key, {
              subjectName: record.subjectName,
              topicName: record.topicName,
              subjectId: null,
            });
          }
        }
      }

      // Check for exact duplicate in existing questions
      const isDuplicate = Boolean(
        matchedSubject &&
        existingQuestions.some(
          q =>
            q.date === record.date &&
            q.subjectId === matchedSubject.id &&
            (record.topicName ? matchedTopic && q.topicId === matchedTopic.id : !q.topicId) &&
            q.resolved === record.resolved &&
            q.correct === record.correct
        )
      );

      // Duplicatas são ignoradas na importação, então não contam como destino arquivado.
      let archivedTarget = null;
      if (!isDuplicate && matchedSubject?.archived) archivedTarget = matchedSubject.name;
      else if (!isDuplicate && matchedTopic?.archived)
        archivedTarget = `${matchedSubject.name}: ${matchedTopic.name}`;
      if (archivedTarget) {
        archivedRecordCount++;
        archivedMatches.add(archivedTarget);
      }

      if (isDuplicate) {
        duplicateCount++;
      }

      return {
        ...record,
        matchedSubjectId: matchedSubject?.id || null,
        matchedTopicId: matchedTopic?.id || null,
        isDuplicate,
      };
    });

    const accuracy = totalResolved > 0 ? Math.round((totalCorrect / totalResolved) * 100) : 0;

    return {
      fileName,
      totalSessions: records.length,
      totalResolved,
      totalCorrect,
      accuracy,
      matchedSubjectsCount,
      matchedTopicsCount,
      newSubjects: Array.from(newSubjectsMap.values()),
      newTopics: Array.from(newTopicsMap.values()),
      duplicateCount,
      unknownErrorCategoryCount,
      archivedRecordCount,
      archivedMatches: Array.from(archivedMatches),
      records: preparedRecords,
    };
  };

  const importQuestions = (previewData, { createMissing = true, skipDuplicates = true } = {}) => {
    let subjects = getSubjects();
    const createdSubjects = [];
    const createdTopics = [];

    // 1. Create missing subjects if allowed
    if (createMissing && previewData.newSubjects?.length) {
      for (const subjectName of previewData.newSubjects) {
        const existing = subjects.find(s => normalizeKey(s.name) === normalizeKey(subjectName));
        if (!existing) {
          const created = subjectService.create(subjectName);
          createdSubjects.push(created);
        }
      }
      subjects = getSubjects();
    }

    // 2. Create missing topics if allowed
    if (createMissing && previewData.newTopics?.length) {
      for (const item of previewData.newTopics) {
        const subject = subjects.find(s => normalizeKey(s.name) === normalizeKey(item.subjectName));
        if (subject) {
          const topicExists = (subject.topics || []).some(
            t => normalizeKey(t.name) === normalizeKey(item.topicName)
          );
          if (!topicExists) {
            const created = subjectService.addTopic(subject.id, { name: item.topicName });
            createdTopics.push(created);
          }
        }
      }
      subjects = getSubjects();
    }

    // 3. Insert question records
    let addedSessions = 0;
    let addedQuestionsCount = 0;
    let skippedDuplicatesCount = 0;

    for (const record of previewData.records) {
      if (skipDuplicates && record.isDuplicate) {
        skippedDuplicatesCount++;
        continue;
      }

      const subject = subjects.find(s => normalizeKey(s.name) === normalizeKey(record.subjectName));
      if (!subject) continue; // If missing subjects are not created, skip

      let topicId = null;
      if (record.topicName) {
        const topic = (subject.topics || []).find(
          t => normalizeKey(t.name) === normalizeKey(record.topicName)
        );
        topicId = topic?.id || null;
      }

      questionService.create({
        date: record.date,
        subjectId: subject.id,
        topicId,
        resolved: record.resolved,
        correct: record.correct,
        errorBreakdown: record.errorBreakdown,
        recommendationId: null,
      });

      addedSessions++;
      addedQuestionsCount += record.resolved;
    }

    return {
      addedSessions,
      addedQuestionsCount,
      createdSubjectsCount: createdSubjects.length,
      createdTopicsCount: createdTopics.length,
      skippedDuplicatesCount,
    };
  };

  return Object.freeze({
    preview,
    // Criação de disciplinas, tópicos e questões acontece toda dentro de atomic: ou entra tudo, ou nada.
    import: (previewData, options) => atomic(() => importQuestions(previewData, options)),
  });
}
