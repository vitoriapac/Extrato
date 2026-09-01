import { CURRENT_SCHEMA_VERSION } from './schema.js';
import { nowISO, uid } from '../core/utils.js';
import {DEFAULT_ALGORITHM_VERSIONS} from './strategic.js';

export function createDefaultState(){
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    subjects: [{
      id: uid('subject'), name: 'Português', collapsed: false, archived: false,
      archivedAt: null, createdAt: nowISO(),
      topics: [{
        id: uid('topic'), name: 'Interpretação de Texto', link: 'https://youtube.com',
        status: 'Não iniciado', archived: false, archivedAt: null, notes: '', tags: [],
        difficulty: 'Médio', createdAt: nowISO(), firstCompletedAt: null,
        lastCompletedAt: null, completionCount: 0, lastReviewedAt: null, reviewCount: 0,
        examImportance: null, estimatedStudyMinutes: null, prerequisites: []
      }]
    }],
    calendar: [], reviewAgenda: [], questoes: [], simulados: [],
    metas: {
      semanal: 5, mensal: 20, questoesSemanal: 150, simuladosSemanal: 1,
      metaAprovacao: 70, horasDiarias: 2.5,
      horasPorDia: {'0':2.5,'1':2.5,'2':2.5,'3':2.5,'4':2.5,'5':2.5,'6':2.5}
    },
    examDate: '', examBlueprint:{examDate:null,targetScore:80,configuredAt:null,subjects:[]},
    algorithmVersions:{...DEFAULT_ALGORITHM_VERSIONS},progressHistory: [], studySessions: [], dailyPlans: [], studyPlans: [], planAdjustments: [], recommendationFeedback: [], alertStates: [],
    activeTimer: {
      startedAt: null, runStartedAt: null, accumulatedSeconds: 0, isRunning: false,
      subjectId: null, topicId: null, type: 'study', hiddenAt: null,
      planItemId: null, targetMinutes: null
    },
    topicHistory: [], achievementsUnlocked: {}, metasPorDisciplina: [],
    lastBackupAt: null, updatedAt: null
  };
}
