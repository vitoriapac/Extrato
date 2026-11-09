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
  badge?: string;
  description: string;
  subjects: readonly StarterPackSubject[];
}

export const STARTER_PACKS: readonly StarterPack[] = Object.freeze([
  {
    id: 'admin_general',
    name: 'Área Administrativa Geral',
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
  {
    id: 'tribunais_general',
    name: 'Área Tribunais (TJ, TRT e TRE)',
    badge: 'Judiciário',
    description: 'Português, RLM, Constitucional, Administrativo, Processo Civil e Gestão Pública',
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
            name: 'Sintaxe: Concordância, Regência e Crase',
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
            name: 'Proposições, Conectivos e Tabela-Verdade',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Equivalências Lógicas e Negações',
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
            name: 'Direitos e Garantias Fundamentais (Art. 5º)',
            estimatedStudyMinutes: 90,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Poder Judiciário e Funções Essenciais à Justiça',
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
            name: 'Regime Jurídico dos Servidores (Lei 8.112/90)',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Atos Administrativos e Poderes da Administração',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Direito Processual Civil',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Atos Processuais, Prazos e Citações',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Tutelas Provisórias e Procedimento Comum',
            estimatedStudyMinutes: 75,
            difficulty: 'Médio' as const,
          },
        ],
      },
    ]),
  },
  {
    id: 'inss_tecnico',
    name: 'INSS — Técnico do Seguro Social',
    badge: 'Previdenciário',
    description: 'Seguridade Social, Benefícios, Português, Administrativo, Constitucional e RLM',
    subjects: Object.freeze([
      {
        name: 'Seguridade Social',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Conceito, Princípios e Organização da Seguridade',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Segurados Obrigatórios e Facultativos do RGPS',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Benefícios Previdenciários: Regras e Cálculo',
            estimatedStudyMinutes: 90,
            difficulty: 'Difícil' as const,
          },
        ],
      },
      {
        name: 'Língua Portuguesa',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Compreensão de Texto e Tipologia Textual',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Pontuação, Concordância e Regência',
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
            name: 'Regime dos Servidores Públicos (Lei 8.112/90)',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Ética no Serviço Público (Decreto 1.171/94)',
            estimatedStudyMinutes: 45,
            difficulty: 'Fácil' as const,
          },
        ],
      },
      {
        name: 'Direito Constitucional',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Direitos Sociais e Seguridade na CF/88 (Arts. 194 a 204)',
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
            name: 'Proposições, Conectivos e Conjuntos Numéricos',
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
            name: 'Conceitos de Internet, Segurança e Ferramentas de Nuvem',
            estimatedStudyMinutes: 45,
            difficulty: 'Fácil' as const,
          },
        ],
      },
    ]),
  },
  {
    id: 'bancaria_general',
    name: 'Carreiras Bancárias (BB e Caixa)',
    badge: 'Bancário',
    description: 'Português, Matemática Financeira, Conhecimentos Bancários, Vendas e Informática',
    subjects: Object.freeze([
      {
        name: 'Conhecimentos Bancários',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Estrutura do Sistema Financeiro Nacional (SFN)',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Produtos e Serviços Bancários e Meios de Pagamento',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Garantias no SFN e Prevenção à Lavagem de Dinheiro',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Língua Portuguesa',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Interpretação Textual e Redação Oficial',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Matemática Financeira',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Juros Simples, Compostos e Taxas Equivalentes',
            estimatedStudyMinutes: 75,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Sistemas de Amortização (SAC e Price)',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Atendimento e Vendas',
        difficulty: 'Fácil' as const,
        topics: [
          {
            name: 'Técnicas de Vendas, Negociação e Ética Comercial',
            estimatedStudyMinutes: 45,
            difficulty: 'Fácil' as const,
          },
          {
            name: 'Proteção ao Consumidor (CDC Aplicado a Bancos)',
            estimatedStudyMinutes: 45,
            difficulty: 'Fácil' as const,
          },
        ],
      },
      {
        name: 'Tecnologia da Informação',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Segurança da Informação, LGPD e Ferramentas Digitais',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
    ]),
  },
  {
    id: 'policia_federal',
    name: 'Polícia Federal (Agente e Escrivão)',
    badge: 'Polícia Federal',
    description: 'Português, RLM, Informática/TI, Contabilidade Geral, Penal, Processo Penal e Legislação',
    subjects: Object.freeze([
      {
        name: 'Informática e Tecnologia',
        difficulty: 'Difícil' as const,
        topics: [
          {
            name: 'Redes de Computadores e Protocolos de Internet',
            estimatedStudyMinutes: 75,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Segurança da Informação, Criptografia e Malware',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Banco de Dados, SQL e Noções de Python/R',
            estimatedStudyMinutes: 90,
            difficulty: 'Difícil' as const,
          },
        ],
      },
      {
        name: 'Contabilidade Geral',
        difficulty: 'Difícil' as const,
        topics: [
          {
            name: 'Patrimônio, Contas e Escrituração Contábil',
            estimatedStudyMinutes: 75,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Balanço Patrimonial e DRE',
            estimatedStudyMinutes: 90,
            difficulty: 'Difícil' as const,
          },
        ],
      },
      {
        name: 'Língua Portuguesa',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Compreensão de Texto e Coesão Gramatical',
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
            name: 'Lógica Proposicional, Negações e Equivalências',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Direito Penal e Processual Penal',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Teoria do Crime, Tipicidade e Ilicitude',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Inquérito Policial, Prisões e Provas',
            estimatedStudyMinutes: 75,
            difficulty: 'Médio' as const,
          },
        ],
      },
      {
        name: 'Direito Administrativo e Constitucional',
        difficulty: 'Médio' as const,
        topics: [
          {
            name: 'Art. 5º e Segurança Pública na CF/88',
            estimatedStudyMinutes: 60,
            difficulty: 'Médio' as const,
          },
          {
            name: 'Regime Disciplinar dos Servidores e Atos Administrativos',
            estimatedStudyMinutes: 60,
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
