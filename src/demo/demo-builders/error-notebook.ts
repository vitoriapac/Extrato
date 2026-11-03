import { addLocalDays } from '../../core/date-utils.js';
import type { ErrorFlashcard } from '../../core/types.js';

interface BuildDemoFlashcardOptions {
  today: string;
  subjects: Array<{ id: string; name: string; topics: Array<{ id: string; name: string }> }>;
}

interface RawDemoCard {
  subjectName: string;
  topicName: string;
  statementSummary: string;
  bancaTrap: string;
  correctConcept: string;
  errorCategory: 'desatencao' | 'interpretacao' | 'esqueci' | 'naoSabia' | 'calculo';
  status: 'pending' | 'reviewing' | 'mastered';
  offsetDays: number;
  reviewCount: number;
  consecutiveSuccesses: number;
  intervalDays: number;
  easeFactor: number;
}

const RAW_DEMO_CARDS: RawDemoCard[] = [
  // --- CARDS VENCIDOS HOJE (reviewing, offsetDays = 0) ---
  {
    subjectName: 'Conhecimentos Bancários',
    topicName: 'Conselho Monetário Nacional',
    statementSummary:
      'Competência para emitir moeda e fixar diretrizes e metas de inflação no Sistema Financeiro.',
    bancaTrap:
      'Afirmar que o CMN emite papel-moeda e executa a fiscalização das instituições financeiras diretamente.',
    correctConcept:
      'O CMN é órgão exclusivamente normativo e deliberativo (fixa diretrizes e metas de inflação); quem emite e fiscaliza operacionalmente é o BACEN.',
    errorCategory: 'desatencao',
    status: 'reviewing',
    offsetDays: 0,
    reviewCount: 2,
    consecutiveSuccesses: 1,
    intervalDays: 2,
    easeFactor: 2.35,
  },
  {
    subjectName: 'Língua Portuguesa',
    topicName: 'Crase',
    statementSummary:
      'Ocorrência de crase diante de pronomes de tratamento e pronomes indefinidos.',
    bancaTrap:
      'Induzir ao erro afirmando que "Enviei a correspondência a Vossa Excelência" admite crase facultativa por cortesia.',
    correctConcept:
      'Não há crase antes de pronomes de tratamento (salvo Senhora, Senhorita e Dona), nem diante de pronomes indefinidos, pois repelem o artigo feminino.',
    errorCategory: 'esqueci',
    status: 'reviewing',
    offsetDays: 0,
    reviewCount: 3,
    consecutiveSuccesses: 2,
    intervalDays: 3,
    easeFactor: 2.4,
  },
  {
    subjectName: 'Matemática Financeira',
    topicName: 'Taxas de juros (nominal, efetiva, equivalente)',
    statementSummary:
      'Cálculo de taxa equivalente no regime composto vs. taxa proporcional no regime simples.',
    bancaTrap: 'Dividir a taxa nominal anual por 12 para achar a taxa mensal no regime composto.',
    correctConcept:
      'No regime de juros compostos, taxas equivalentes exigem exponenciação: (1 + i_ano) = (1 + i_mes)^12; a proporcionalidade linear só vale em juros simples.',
    errorCategory: 'calculo',
    status: 'reviewing',
    offsetDays: 0,
    reviewCount: 2,
    consecutiveSuccesses: 1,
    intervalDays: 2,
    easeFactor: 2.2,
  },
  {
    subjectName: 'Atendimento e Negociação',
    topicName: 'Código de Proteção e Defesa do Consumidor',
    statementSummary:
      'Prazo e condições do direito de arrependimento em contratações de serviços bancários.',
    bancaTrap:
      'Exigir justificativa fundamentada de defeito do produto ou limitar a devolução a compras presenciais na agência.',
    correctConcept:
      'O direito de arrependimento (art. 49 CDC) prevê prazo de 7 dias para contratações fora do estabelecimento (telefone/internet), com devolução integral e imediata sem necessidade de justificativa.',
    errorCategory: 'interpretacao',
    status: 'reviewing',
    offsetDays: 0,
    reviewCount: 1,
    consecutiveSuccesses: 1,
    intervalDays: 1,
    easeFactor: 2.5,
  },
  {
    subjectName: 'Conhecimentos Bancários',
    topicName: 'Mercado de crédito',
    statementSummary: 'Distinção jurídica fundamental entre Aval e Fiança em títulos de crédito.',
    bancaTrap:
      'Afirmar que a outorga uxória/conjugal é obrigatória tanto para o aval quanto para a fiança em títulos de crédito cambiários.',
    correctConcept:
      'O aval é obrigação autônoma típica do direito cambiário e não exige outorga do cônjuge no Código Civil atual para títulos específicos, enquanto a fiança é contrato acessório com benefício de ordem e outorga mandatória.',
    errorCategory: 'naoSabia',
    status: 'reviewing',
    offsetDays: 0,
    reviewCount: 2,
    consecutiveSuccesses: 1,
    intervalDays: 2,
    easeFactor: 2.3,
  },

  // --- CARDS PENDENTES (novos, para primeiro estudo) ---
  {
    subjectName: 'Língua Portuguesa',
    topicName: 'Pontuação',
    statementSummary:
      'Emprego da vírgula para isolar orações subordinadas adjetivas explicativas vs. restritivas.',
    bancaTrap:
      'Afirmar que a retirada da vírgula em "Os clientes, que leram o contrato, assinaram" altera apenas a pontuação sem mudar o sentido semântico.',
    correctConcept:
      'A presença de vírgula indica oração explicativa (todos os clientes leram); a ausência torna-a restritiva (apenas os clientes que leram assinaram). A mudança altera radicalmente o sentido.',
    errorCategory: 'interpretacao',
    status: 'pending',
    offsetDays: 1,
    reviewCount: 0,
    consecutiveSuccesses: 0,
    intervalDays: 1,
    easeFactor: 2.5,
  },
  {
    subjectName: 'Conhecimentos Bancários',
    topicName: 'Lavagem de dinheiro e crimes financeiros',
    statementSummary: 'Identificação das três fases sequenciais do crime de lavagem de capitais.',
    bancaTrap:
      'Inverter a ordem entre Ocultação (Layering) e Colocação (Placement) ou considerar a dissimulação como fase final.',
    correctConcept:
      'As fases estritas são: 1) Colocação (introdução do dinheiro ilícito), 2) Ocultação/Estratificação (distanciamento da origem por múltiplas transações), e 3) Integração (reincorporação à economia formal).',
    errorCategory: 'esqueci',
    status: 'pending',
    offsetDays: 1,
    reviewCount: 0,
    consecutiveSuccesses: 0,
    intervalDays: 1,
    easeFactor: 2.5,
  },
  {
    subjectName: 'Matemática Financeira',
    topicName: 'Sistemas de amortização (SAC e PRICE)',
    statementSummary:
      'Comportamento das parcelas, amortização e juros na Tabela PRICE (Sistema Francês).',
    bancaTrap:
      'Afirmar que na Tabela PRICE as quotas de amortização são constantes ao longo do financiamento.',
    correctConcept:
      'Na PRICE, as prestações totais são constantes, os juros são decrescentes e a parcela de amortização é estritamente crescente a cada período.',
    errorCategory: 'desatencao',
    status: 'pending',
    offsetDays: 2,
    reviewCount: 0,
    consecutiveSuccesses: 0,
    intervalDays: 1,
    easeFactor: 2.5,
  },
  {
    subjectName: 'Atendimento e Negociação',
    topicName: 'Resolução de conflitos e ouvidoria',
    statementSummary:
      'Papel da Ouvidoria bancária e prazos regulamentares de resposta segundo o CMN.',
    bancaTrap:
      'Tratar a ouvidoria como canal de atendimento primário de primeira instância junto com a agência física.',
    correctConcept:
      'A ouvidoria é instância recursal (atendimento de última instância prévia ao Judiciário) e deve responder em até 10 dias úteis, prorrogáveis justificadamente uma única vez por igual período.',
    errorCategory: 'naoSabia',
    status: 'pending',
    offsetDays: 2,
    reviewCount: 0,
    consecutiveSuccesses: 0,
    intervalDays: 1,
    easeFactor: 2.5,
  },
  {
    subjectName: 'Língua Portuguesa',
    topicName: 'Concordância verbal',
    statementSummary:
      'Concordância do verbo com a partícula apassivadora "se" vs. índice de indeterminação do sujeito.',
    bancaTrap: 'Escrever "Alugam-se salas" como incorreto por suposta falta de sujeito.',
    correctConcept:
      'Com verbo transitivo direto acompanhado de "se" apassivador, a frase está na voz passiva sintética e o termo seguinte é o sujeito paciente ("Salas são alugadas" -> verbo no plural).',
    errorCategory: 'desatencao',
    status: 'pending',
    offsetDays: 3,
    reviewCount: 0,
    consecutiveSuccesses: 0,
    intervalDays: 1,
    easeFactor: 2.5,
  },
  {
    subjectName: 'Conhecimentos Bancários',
    topicName: 'Mercado de capitais',
    statementSummary:
      'Diferença entre ações ordinárias (ON) e preferenciais (PN) em sociedades anônimas.',
    bancaTrap:
      'Afirmar que ações preferenciais nunca possuem direito a voto em nenhuma hipótese deliberativa.',
    correctConcept:
      'Ações PN concedem preferência na distribuição de dividendos ou reembolso de capital, mas passam a adquirir pleno direito a voto se a companhia passar 3 exercícios consecutivos sem pagar dividendo fixo.',
    errorCategory: 'esqueci',
    status: 'pending',
    offsetDays: 3,
    reviewCount: 0,
    consecutiveSuccesses: 0,
    intervalDays: 1,
    easeFactor: 2.5,
  },

  // --- CARDS DOMINADOS (mastered, revisões futuras distantes) ---
  {
    subjectName: 'Conhecimentos Bancários',
    topicName: 'Banco Central',
    statementSummary:
      'Status jurídico e autonomia do Banco Central após a Lei Complementar nº 179/2021.',
    bancaTrap:
      'Classificar o BACEN como empresa pública subordinada diretamente ao Ministério da Fazenda.',
    correctConcept:
      'O BACEN é autarquia especial dotada de autonomia técnica, operacional e administrativa, não vinculada nem subordinada hierarquicamente a ministério, com mandatos fixos não coincidentes da diretoria.',
    errorCategory: 'naoSabia',
    status: 'mastered',
    offsetDays: 14,
    reviewCount: 4,
    consecutiveSuccesses: 3,
    intervalDays: 14,
    easeFactor: 2.7,
  },
  {
    subjectName: 'Língua Portuguesa',
    topicName: 'Regência verbal e nominal',
    statementSummary: 'Regência do verbo "visar" no sentido de almejar/ter por objetivo.',
    bancaTrap: 'Utilizar "Ele visa o cargo público" sem preposição como norma culta formal.',
    correctConcept:
      'No sentido de ter por meta ou almejar, o verbo "visar" é transitivo indireto e rege obrigatoriamente a preposição "a": "visar ao cargo público". Sem preposição significa apontar arma ou apor visto.',
    errorCategory: 'esqueci',
    status: 'mastered',
    offsetDays: 16,
    reviewCount: 5,
    consecutiveSuccesses: 4,
    intervalDays: 18,
    easeFactor: 2.8,
  },
  {
    subjectName: 'Matemática Financeira',
    topicName: 'Conceitos gerais e juros simples',
    statementSummary: 'Fórmula fundamental do montante no regime de juros simples.',
    bancaTrap:
      'Esquecer de converter a unidade de tempo da taxa e do prazo para a mesma base temporal.',
    correctConcept:
      'M = C * (1 + i * n); a taxa (i) e o prazo (n) devem estar expressos impreterivelmente na mesma unidade de tempo (ambos ao mês ou ambos ao ano).',
    errorCategory: 'calculo',
    status: 'mastered',
    offsetDays: 20,
    reviewCount: 4,
    consecutiveSuccesses: 3,
    intervalDays: 21,
    easeFactor: 2.9,
  },
  {
    subjectName: 'Atendimento e Negociação',
    topicName: 'Segurança da informação e sigilo bancário',
    statementSummary: 'Hipóteses de quebra de sigilo bancário sem ordem judicial direta.',
    bancaTrap:
      'Afirmar que a Receita Federal ou a Polícia podem decretar diretamente a quebra de sigilo bancário em qualquer inquérito administrativo.',
    correctConcept:
      'Pela LC 105/2001 e jurisprudência vinculante do STF, o sigilo bancário só pode ser transferido à Receita Federal em procedimento fiscal instaurado; órgãos policiais necessitam de prévia autorização judicial.',
    errorCategory: 'interpretacao',
    status: 'mastered',
    offsetDays: 22,
    reviewCount: 4,
    consecutiveSuccesses: 3,
    intervalDays: 24,
    easeFactor: 2.7,
  },
  {
    subjectName: 'Conhecimentos Bancários',
    topicName: 'Instituições financeiras',
    statementSummary: 'Composição mínima obrigatória de carteiras de um Banco Múltiplo.',
    bancaTrap:
      'Afirmar que qualquer banco com duas carteiras quaisquer (como corretora e câmbio) configura banco múltiplo.',
    correctConcept:
      'O banco múltiplo deve possuir no mínimo duas carteiras, sendo pelo menos uma delas comercial ou de investimento.',
    errorCategory: 'esqueci',
    status: 'mastered',
    offsetDays: 25,
    reviewCount: 5,
    consecutiveSuccesses: 4,
    intervalDays: 28,
    easeFactor: 2.85,
  },
  {
    subjectName: 'Língua Portuguesa',
    topicName: 'Ortografia oficial',
    statementSummary: 'Uso dos porquês: "por que", "por quê", "porque" e "porquê".',
    bancaTrap: 'Utilizar "porquê" junto e sem acento em frases interrogativas diretas.',
    correctConcept:
      '"Por que" = início de pergunta ou pronome relativo; "por quê" = fim de frase; "porque" = conjunção explicativa/causal; "o porquê" = substantivo sinônimo de motivo.',
    errorCategory: 'desatencao',
    status: 'mastered',
    offsetDays: 30,
    reviewCount: 6,
    consecutiveSuccesses: 4,
    intervalDays: 30,
    easeFactor: 3.0,
  },
];

export function buildDemoFlashcards(
  _scenario: Record<string, any>,
  { today, subjects }: BuildDemoFlashcardOptions
): ErrorFlashcard[] {
  const subjectMap = new Map<string, { id: string; topics: Map<string, string> }>();

  for (const s of subjects) {
    const topicsMap = new Map<string, string>();
    for (const t of s.topics || []) {
      topicsMap.set(t.name.trim().toLowerCase(), t.id);
    }
    subjectMap.set(s.name.trim().toLowerCase(), {
      id: s.id,
      topics: topicsMap,
    });
  }

  const flashcards: ErrorFlashcard[] = [];

  RAW_DEMO_CARDS.forEach((raw, index) => {
    const subInfo = subjectMap.get(raw.subjectName.toLowerCase());
    const subjectId = subInfo?.id || subjects[0]?.id || `demo-subject-1`;

    let topicId = subInfo?.topics.get(raw.topicName.toLowerCase());
    if (!topicId) {
      // Fallback para o primeiro tópico da disciplina correspondente
      const foundSub = subjects.find(s => s.id === subjectId);
      topicId = foundSub?.topics[0]?.id || `demo-topic-1-1`;
    }

    const nextReviewDate = addLocalDays(today, raw.offsetDays);
    const createdAt = `${addLocalDays(today, -Math.max(15, raw.offsetDays + 14))}T10:00:00.000Z`;
    const lastReviewedAt =
      raw.reviewCount > 0
        ? `${addLocalDays(today, -Math.max(1, raw.offsetDays))}T15:30:00.000Z`
        : null;

    flashcards.push({
      id: `demo-flashcard-${index + 1}`,
      subjectId,
      topicId,
      questionId: `demo-question-${((index * 13 + 5) % 80) + 1}`,
      statementSummary: raw.statementSummary,
      bancaTrap: raw.bancaTrap,
      correctConcept: raw.correctConcept,
      errorCategory: raw.errorCategory,
      status: raw.status,
      repetitions: raw.consecutiveSuccesses,
      consecutiveSuccesses: raw.consecutiveSuccesses,
      reviewCount: raw.reviewCount,
      intervalDays: raw.intervalDays,
      easeFactor: raw.easeFactor,
      nextReviewDate,
      lastReviewedAt,
      createdAt,
      updatedAt: lastReviewedAt || createdAt,
    } as unknown as ErrorFlashcard);
  });

  return flashcards;
}
