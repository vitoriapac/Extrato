/**
 * @fileoverview Definições de tipos centrais do StudyTrack para JSDoc e checagem de tipos estática.
 */

/**
 * @typedef {'Não iniciado' | 'Em andamento' | 'Revisão' | 'Concluído'} TopicStatus
 */

/**
 * @typedef {'Fácil' | 'Médio' | 'Difícil'} TopicDifficulty
 */

/**
 * @typedef {Object} Topic
 * @property {string} id - Identificador único do tópico.
 * @property {string} name - Nome descritivo do tópico.
 * @property {string} [link] - Link externo de referência (ex: videoaula, material).
 * @property {TopicStatus} status - Estado de avanço do tópico.
 * @property {boolean} [archived] - Se o tópico está arquivado.
 * @property {string|null} [archivedAt] - Data ISO de arquivamento.
 * @property {string} [notes] - Anotações e sínteses do estudante.
 * @property {string[]} [tags] - Etiquetas e marcadores temáticos.
 * @property {TopicDifficulty} [difficulty] - Grau de dificuldade percebido.
 * @property {string} [createdAt] - Data ISO de criação.
 * @property {string|null} [firstCompletedAt] - Primeira conclusão.
 * @property {string|null} [lastCompletedAt] - Última conclusão.
 * @property {number} [completionCount] - Vezes que foi concluído.
 * @property {string|null} [lastReviewedAt] - Última revisão realizada.
 * @property {number} [reviewCount] - Vezes revisado.
 * @property {number|null} [examImportance] - Peso ou importância para a prova (0 a 1).
 * @property {number|null} [estimatedStudyMinutes] - Esforço estimado em minutos.
 * @property {string[]} [prerequisites] - IDs de tópicos que são pré-requisitos.
 * @property {Record<string, string>} [fieldOrigins] - Rastreabilidade de origem (import ou manual).
 */

/**
 * @typedef {Object} Subject
 * @property {string} id - Identificador único da disciplina.
 * @property {string} name - Nome da disciplina.
 * @property {boolean} collapsed - Se está recolhida na visualização.
 * @property {boolean} archived - Se foi arquivada.
 * @property {string|null} archivedAt - Data ISO de arquivamento.
 * @property {string} createdAt - Data ISO de criação.
 * @property {Topic[]} topics - Lista de tópicos pertencentes à disciplina.
 */

/**
 * @typedef {Object} QuestionRecord
 * @property {string} id - Identificador único da sessão de questões.
 * @property {string} date - Data civil da resolução (AAAA-MM-DD).
 * @property {string} subjectId - Identificador da disciplina.
 * @property {string|null} topicId - Identificador do tópico associado (se identificado).
 * @property {number} resolved - Quantidade total de questões resolvidas.
 * @property {number} correct - Quantidade de questões acertadas.
 * @property {Record<string, number>} [errorBreakdown] - Detalhamento por categoria de erro.
 * @property {string|null} [errorCategory] - Categoria dominante ou única do erro.
 * @property {string|null} [recommendationId] - Recomendação vinculada.
 * @property {string} [createdAt] - Data ISO de criação do registro.
 */

/**
 * @typedef {Object} SimulationBreakdownItem
 * @property {string} id - Identificador do item da disciplina no simulado.
 * @property {string} subjectId - Disciplina avaliada.
 * @property {number} correct - Acertos na disciplina.
 * @property {number} total - Total de questões da disciplina no simulado.
 */

/**
 * @typedef {Object} SimulationRecord
 * @property {string} id - Identificador do simulado.
 * @property {string} nome - Nome ou edição do simulado.
 * @property {string} date - Data civil da realização (AAAA-MM-DD).
 * @property {number} correct - Total de acertos geral.
 * @property {number} total - Total de questões geral.
 * @property {SimulationBreakdownItem[]} [breakdown] - Desdobramento por disciplina.
 * @property {string} [createdAt] - Data ISO de criação.
 */

/**
 * @typedef {Object} StudySession
 * @property {string} id - Identificador único da sessão de estudo.
 * @property {string} date - Data civil da sessão (AAAA-MM-DD).
 * @property {string} subjectId - Disciplina estudada.
 * @property {string|null} topicId - Tópico estudado.
 * @property {number} durationSeconds - Duração em segundos.
 * @property {'study'|'review'|'questions'|'simulation'} [type] - Tipo de atividade.
 * @property {string} [source] - Origem ('timer', 'manual', 'plan').
 * @property {string|null} [planItemId] - Atividade do plano semanal associada.
 * @property {string|null} [recommendationId] - Recomendação vinculada.
 * @property {string} [createdAt] - Data ISO de registro.
 */

/**
 * @typedef {Object} ReadinessSnapshot
 * @property {string} date - Data civil de captura.
 * @property {number} score - Índice de prontidão calculado (0 a 100).
 * @property {number} confidence - Nível de confiança da estimativa (0 a 1).
 * @property {Record<string, number>} factors - Contribuição de cada fator.
 * @property {string} algorithmVersion - Versão do algoritmo de cálculo.
 * @property {string[]} activeExamTags - Concursos ativos no momento do cálculo.
 */

export {};
