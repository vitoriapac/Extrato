export interface StarterPackTopic {
  name: string;
  estimatedStudyMinutes: number;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
}

export interface StarterPackSubject {
  name: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  topics: StarterPackTopic[];
}

export interface StarterPack {
  id: string;
  name: string;
  badge: string;
  description: string;
  subjects: readonly StarterPackSubject[];
}

export const STARTER_PACKS: readonly StarterPack[] = Object.freeze([
  {
    id: 'admin_general',
    name: 'Área Administrativa Geral',
    badge: 'Mais Popular',
    description:
      'Português, Raciocínio Lógico, Dir. Constitucional, Dir. Administrativo e Informática',
    subjects: Object.freeze([
      {
        name: 'Língua Portuguesa',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Interpretação e Compreensão de Texto',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Ortografia e Acentuação Gráfica',
            estimatedStudyMinutes: 45,
            difficulty: 'Fácil' as const,
          },
          {
            name: 'Sintaxe: Concordância e Regência',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Raciocínio Lógico-Matemático',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Estruturas Lógicas e Proposições',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Tabelas-Verdade e Conectivos Lógicos',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Direito Constitucional',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Princípios Fundamentais (Art. 1º ao 4º)',
            estimatedStudyMinutes: 45,
            difficulty: 'Fácil' as const,
          },
          {
            name: 'Direitos e Garantias Fundamentais (Art. 5º)',
            estimatedStudyMinutes: 90,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Direito Administrativo',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Princípios da Administração Pública',
            estimatedStudyMinutes: 45,
            difficulty: 'Fácil' as const,
          },
          {
            name: 'Atos Administrativos: Conceito e Atributos',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Noções de Informática',
        difficulty: 'Fácil' as const,
        topics: [
          {
            name: 'Segurança da Informação e Ameaças',
            estimatedStudyMinutes: 45,
            difficulty: 'Fácil' as const,
          },
          {
            name: 'Navegadores e Correio Eletrônico',
            estimatedStudyMinutes: 45,
            difficulty: 'Fácil' as const,
          },
        ],
      },
    ]),
  },
  {
    id: 'police_general',
    name: 'Carreiras Policiais Básicas',
    badge: 'Segurança',
    description: 'Português, RLM, Constitucional, Dir. Penal e Processo Penal',
    subjects: Object.freeze([
      {
        name: 'Língua Portuguesa',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Compreensão de Texto e Coesão',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Tipologia Textual e Reescrita',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Raciocínio Lógico',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Lógica Proposicional e Equivalências',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Direito Constitucional',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Direitos e Garantias Individuais',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Segurança Pública (Art. 144 CF)',
            estimatedStudyMinutes: 45,
            difficulty: 'Fácil' as const,
          },
        ],
      },
      {
        name: 'Direito Penal',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Aplicação da Lei Penal e Teoria do Crime',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Crimes Contra a Pessoa e Patrimônio',
            estimatedStudyMinutes: 90,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Direito Processual Penal',
        difficulty: 'Médio' as const,
        topics: [
          { name: 'Inquérito Policial', estimatedStudyMinutes: 60, difficulty: 'Médio' as const },
          {
            name: 'Prisão em Flagrante e Cautelares',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
    ]),
  },
  {
    id: 'fiscal_general',
    name: 'Área Fiscal & Controle Básica',
    badge: 'Alta Carga',
    description: 'Português, RLM, Constitucional, Administrativo, Tributário e Contabilidade',
    subjects: Object.freeze([
      {
        name: 'Língua Portuguesa',
        difficulty: 'Médio' as const,
        topics: [
          { name: 'Sintaxe e Pontuação', estimatedStudyMinutes: 60, difficulty: 'Médio' as const },
        ],
      },
      {
        name: 'Raciocínio Lógico e Matemática Financeira',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Lógica e Juros Simples/Compostos',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Direito Constitucional',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Tributação e Orçamento na CF/88',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Direito Administrativo',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Licitações e Contratos Públicos',
            estimatedStudyMinutes: 90,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Direito Tributário',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Sistema Tributário Nacional',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Obrigação e Crédito Tributário',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Contabilidade Geral',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Estrutura Conceitual Básica e Lançamentos',
            estimatedStudyMinutes: 90,
            difficulty: 'Médio' as const,
          },
        ],
      },
    ]),
  },
]);

export function findStarterPackById(id: string): StarterPack | null {
  return STARTER_PACKS.find(p => p.id === id) || null;
}
