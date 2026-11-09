-- =============================================================================
-- Migration: Catálogo Dinâmico de Editais & Templates na Nuvem (Fase 5 SaaS)
-- Tabela: public.exam_catalog_templates
-- Permissões: Leitura pública (anon e authenticated), escrita restrita a service_role
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.exam_catalog_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  organizer_banca TEXT NOT NULL,
  exam_year INT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('bancario', 'fiscal', 'tribunais', 'policial', 'administrativa', 'enem', 'oab')
  ),
  is_premium BOOLEAN NOT NULL DEFAULT true,
  version TEXT NOT NULL DEFAULT '2026-v1',
  description TEXT NOT NULL DEFAULT '',
  subjects_count INT NOT NULL DEFAULT 0,
  topics_count INT NOT NULL DEFAULT 0,
  blueprint_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para buscas rápidas e ordenação
CREATE INDEX IF NOT EXISTS idx_exam_catalog_category ON public.exam_catalog_templates (category);
CREATE INDEX IF NOT EXISTS idx_exam_catalog_published_at ON public.exam_catalog_templates (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_catalog_slug ON public.exam_catalog_templates (slug);

-- Habilitar RLS
ALTER TABLE public.exam_catalog_templates ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário (anônimo ou autenticado) pode listar e consultar os editais
CREATE POLICY "exam_catalog_templates_select_all"
  ON public.exam_catalog_templates
  FOR SELECT
  USING (true);

-- Apenas service_role pode criar, editar ou excluir templates de editais
REVOKE INSERT, UPDATE, DELETE ON public.exam_catalog_templates FROM anon, authenticated;

-- =============================================================================
-- Seeds de Editais Oficiais Curados
-- =============================================================================

INSERT INTO public.exam_catalog_templates (
  slug, title, organizer_banca, exam_year, category, is_premium, version, description, subjects_count, topics_count, blueprint_json
) VALUES
(
  'caixa-tbn-2024',
  'Caixa Econômica Federal — Técnico Bancário Novo',
  'Cesgranrio',
  2024,
  'bancario',
  false,
  '2026-v1',
  'Edital oficial Caixa 2024 (Edital nº 01/2024). Conhecimentos Básicos e Específicos com pesos calibrados.',
  6,
  38,
  '{
    "id": "caixa-tbn-2024",
    "name": "Caixa — Técnico Bancário Novo",
    "version": "2026-v1",
    "sources": ["caixa-tbn-2024"],
    "subjects": [
      {
        "id": "pt-caixa",
        "name": "Língua Portuguesa",
        "weight": 1.0,
        "importance": 1.2,
        "topics": [
          {"id": "pt-1", "name": "Compreensão e interpretação de textos", "importance": 1.5},
          {"id": "pt-2", "name": "Ortografia oficial e acentuação gráfica", "importance": 1.0},
          {"id": "pt-3", "name": "Morfossintaxe: classes de palavras e termos da oração", "importance": 1.3},
          {"id": "pt-4", "name": "Concordância nominal e verbal", "importance": 1.4},
          {"id": "pt-5", "name": "Regência nominal e verbal, crase", "importance": 1.4},
          {"id": "pt-6", "name": "Pontuação", "importance": 1.1}
        ]
      },
      {
        "id": "ing-caixa",
        "name": "Língua Inglesa",
        "weight": 1.0,
        "importance": 0.8,
        "topics": [
          {"id": "ing-1", "name": "Compreensão de texto escrito em língua inglesa", "importance": 1.2},
          {"id": "ing-2", "name": "Vocabulário técnico e expressões bancárias", "importance": 1.0}
        ]
      },
      {
        "id": "mat-fin-caixa",
        "name": "Matemática Financeira",
        "weight": 1.0,
        "importance": 1.3,
        "topics": [
          {"id": "mf-1", "name": "Juros simples e compostos", "importance": 1.5},
          {"id": "mf-2", "name": "Taxas de juros nominais, efetivas e equivalentes", "importance": 1.4},
          {"id": "mf-3", "name": "Sistemas de amortização (SAC e Price)", "importance": 1.5},
          {"id": "mf-4", "name": "Valor Presente Líquido (VPL) e Taxa Interna de Retorno (TIR)", "importance": 1.1}
        ]
      },
      {
        "id": "prob-est-caixa",
        "name": "Noções de Probabilidade e Estatística",
        "weight": 1.0,
        "importance": 1.0,
        "topics": [
          {"id": "pe-1", "name": "Representação tabular e gráfica", "importance": 1.0},
          {"id": "pe-2", "name": "Medidas de tendência central (média, mediana, moda)", "importance": 1.3},
          {"id": "pe-3", "name": "Medidas de dispersão (variância, desvio padrão)", "importance": 1.2},
          {"id": "pe-4", "name": "Probabilidade e distribuições discretas", "importance": 1.1}
        ]
      },
      {
        "id": "cb-caixa",
        "name": "Conhecimentos Bancários",
        "weight": 2.0,
        "importance": 2.0,
        "topics": [
          {"id": "cb-1", "name": "Sistema Financeiro Nacional (SFN) e órgãos reguladores", "importance": 1.8},
          {"id": "cb-2", "name": "Produtos bancários e operações de crédito", "importance": 1.6},
          {"id": "cb-3", "name": "Mercado de capitais e títulos de crédito", "importance": 1.4},
          {"id": "cb-4", "name": "Mercado de câmbio e operações comerciais", "importance": 1.2},
          {"id": "cb-5", "name": "Garantias do SFN (aval, fiança, alienação fiduciária)", "importance": 1.5},
          {"id": "cb-6", "name": "Prevenção à lavagem de dinheiro (PLD-FT)", "importance": 1.7},
          {"id": "cb-7", "name": "Open Finance e Pix", "importance": 1.8}
        ]
      },
      {
        "id": "ti-atend-caixa",
        "name": "Tecnologia da Informação e Atendimento Digital",
        "weight": 2.0,
        "importance": 1.8,
        "topics": [
          {"id": "ti-1", "name": "Segurança da informação e LGPD no contexto bancário", "importance": 1.8},
          {"id": "ti-2", "name": "Ferramentas colaborativas e computação em nuvem", "importance": 1.2},
          {"id": "ti-3", "name": "Cultura digital, analytics e inteligência artificial", "importance": 1.4},
          {"id": "ti-4", "name": "Técnicas de vendas e atendimento ao cliente", "importance": 1.6},
          {"id": "ti-5", "name": "Resolução CMN nº 4.949 e Código de Defesa do Consumidor", "importance": 1.5}
        ]
      }
    ]
  }'::jsonb
),
(
  'bb-escriturario-2023',
  'Banco do Brasil — Escriturário (Agente Comercial)',
  'Cesgranrio',
  2023,
  'bancario',
  true,
  '2026-v1',
  'Edital BB 2023 (Edital nº 01/2022). Distribuição completa com foco em Vendas, Negociação e Conhecimentos Bancários.',
  6,
  35,
  '{
    "id": "bb-escriturario-2023",
    "name": "Banco do Brasil — Escriturário Comercial",
    "version": "2026-v1",
    "sources": ["bb-escriturario-2023"],
    "subjects": [
      {
        "id": "pt-bb",
        "name": "Língua Portuguesa",
        "weight": 1.0,
        "importance": 1.2,
        "topics": [
          {"id": "pt-bb-1", "name": "Interpretação textual e tipologia textual", "importance": 1.5},
          {"id": "pt-bb-2", "name": "Ortografia, acentuação e crase", "importance": 1.2},
          {"id": "pt-bb-3", "name": "Sintaxe da oração e do período", "importance": 1.3},
          {"id": "pt-bb-4", "name": "Concordância e regência", "importance": 1.4}
        ]
      },
      {
        "id": "ing-bb",
        "name": "Língua Inglesa",
        "weight": 1.0,
        "importance": 0.8,
        "topics": [
          {"id": "ing-bb-1", "name": "Compreensão de textos e vocabulário bancário", "importance": 1.1}
        ]
      },
      {
        "id": "mat-bb",
        "name": "Matemática Financeira",
        "weight": 1.5,
        "importance": 1.4,
        "topics": [
          {"id": "mf-bb-1", "name": "Juros simples e juros compostos", "importance": 1.5},
          {"id": "mf-bb-2", "name": "Sistemas de amortização (Price e SAC)", "importance": 1.5},
          {"id": "mf-bb-3", "name": "Taxas de juros nominais e proporcionais", "importance": 1.3}
        ]
      },
      {
        "id": "cb-bb",
        "name": "Conhecimentos Bancários",
        "weight": 2.0,
        "importance": 2.0,
        "topics": [
          {"id": "cb-bb-1", "name": "Estrutura do Sistema Financeiro Nacional", "importance": 1.8},
          {"id": "cb-bb-2", "name": "Produtos e serviços bancários e mercado de câmbio", "importance": 1.6},
          {"id": "cb-bb-3", "name": "Crime de lavagem de dinheiro (Lei 9.613/98)", "importance": 1.7},
          {"id": "cb-bb-4", "name": "Open Finance, Pix e Moedas Digitais", "importance": 1.8}
        ]
      },
      {
        "id": "inf-bb",
        "name": "Conhecimentos de Informática",
        "weight": 1.5,
        "importance": 1.5,
        "topics": [
          {"id": "inf-bb-1", "name": "Segurança da informação e boas práticas", "importance": 1.6},
          {"id": "inf-bb-2", "name": "Sistemas operacionais e conceitos de redes", "importance": 1.2},
          {"id": "inf-bb-3", "name": "Manipulação de dados e planilhas eletrônicas", "importance": 1.4}
        ]
      },
      {
        "id": "vendas-bb",
        "name": "Vendas e Negociação",
        "weight": 2.5,
        "importance": 2.2,
        "topics": [
          {"id": "vn-bb-1", "name": "Técnicas de vendas e atendimento ao cliente", "importance": 2.0},
          {"id": "vn-bb-2", "name": "Ética e conduta profissional no ambiente bancário", "importance": 1.5},
          {"id": "vn-bb-3", "name": "Código de Defesa do Consumidor e Ouvidoria", "importance": 1.8},
          {"id": "vn-bb-4", "name": "Marketing digital e jornada do cliente omnicanal", "importance": 1.6}
        ]
      }
    ]
  }'::jsonb
),
(
  'receita-federal-afrfb',
  'Receita Federal — Auditor-Fiscal (AFRFB)',
  'FGV',
  2023,
  'fiscal',
  true,
  '2026-v1',
  'Edital Receita Federal 2023 (FGV). Edital de alta complexidade com Direito Tributário, Aduaneiro e Contabilidade Avançada.',
  7,
  52,
  '{
    "id": "receita-federal-afrfb",
    "name": "Receita Federal — Auditor-Fiscal",
    "version": "2026-v1",
    "sources": ["receita-federal-afrfb-2023"],
    "subjects": [
      {
        "id": "trib-rfb",
        "name": "Direito Tributário",
        "weight": 3.0,
        "importance": 2.5,
        "topics": [
          {"id": "tr-1", "name": "Sistema Tributário Nacional e princípios constitucionais", "importance": 2.0},
          {"id": "tr-2", "name": "Competência tributária e limitações constitucionais", "importance": 1.8},
          {"id": "tr-3", "name": "Obrigação tributária e fato gerador", "importance": 1.7},
          {"id": "tr-4", "name": "Crédito tributário: suspensão, extinção e exclusão", "importance": 2.0},
          {"id": "tr-5", "name": "Administração tributária e certidões negativas", "importance": 1.5}
        ]
      },
      {
        "id": "leg-trib-rfb",
        "name": "Legislação Tributária Federal",
        "weight": 2.5,
        "importance": 2.2,
        "topics": [
          {"id": "lt-1", "name": "Imposto sobre a Renda (IRPJ e IRPF)", "importance": 2.0},
          {"id": "lt-2", "name": "PIS/PASEP e COFINS cumulativo e não cumulativo", "importance": 2.0},
          {"id": "lt-3", "name": "Imposto sobre Produtos Industrializados (IPI)", "importance": 1.6},
          {"id": "lt-4", "name": "Simples Nacional (LC 123/2006)", "importance": 1.7}
        ]
      },
      {
        "id": "cont-geral-rfb",
        "name": "Contabilidade Geral e Avançada",
        "weight": 3.0,
        "importance": 2.4,
        "topics": [
          {"id": "cg-1", "name": "Estrutura conceitual e pronunciamentos técnicos CPC", "importance": 2.0},
          {"id": "cg-2", "name": "Balanço Patrimonial e Demonstração do Resultado (DRE)", "importance": 2.0},
          {"id": "cg-3", "name": "Demonstração dos Fluxos de Caixa (DFC) e DVA", "importance": 1.8},
          {"id": "cg-4", "name": "Combinação de negócios e investimentos em coligadas", "importance": 1.7}
        ]
      },
      {
        "id": "leg-aduan-rfb",
        "name": "Legislação Aduaneira e Comércio Internacional",
        "weight": 2.0,
        "importance": 1.8,
        "topics": [
          {"id": "la-1", "name": "Jurisdição aduaneira e recintos alfandegados", "importance": 1.6},
          {"id": "la-2", "name": "Imposto de Importação e Exportação", "importance": 1.8},
          {"id": "la-3", "name": "Regimes aduaneiros especiais (Drawback, Entreposto, Admissão)", "importance": 1.9},
          {"id": "la-4", "name": "Despacho aduaneiro e valoração aduaneira", "importance": 1.7}
        ]
      },
      {
        "id": "dir-adm-rfb",
        "name": "Direito Administrativo",
        "weight": 1.5,
        "importance": 1.5,
        "topics": [
          {"id": "da-1", "name": "Princípios da administração pública e poderes administrativos", "importance": 1.6},
          {"id": "da-2", "name": "Atos administrativos: requisitos, atributos e anulação", "importance": 1.7},
          {"id": "da-3", "name": "Nova Lei de Licitações (Lei 14.133/21)", "importance": 1.9},
          {"id": "da-4", "name": "Responsabilidade civil do Estado e improbidade administrativa", "importance": 1.6}
        ]
      },
      {
        "id": "dir-const-rfb",
        "name": "Direito Constitucional",
        "weight": 1.5,
        "importance": 1.4,
        "topics": [
          {"id": "dc-1", "name": "Direitos e garantias fundamentais", "importance": 1.7},
          {"id": "dc-2", "name": "Organização político-administrativa do Estado", "importance": 1.3},
          {"id": "dc-3", "name": "Organização dos Poderes e funções essenciais à justiça", "importance": 1.4},
          {"id": "dc-4", "name": "Controle de constitucionalidade", "importance": 1.6}
        ]
      },
      {
        "id": "auditoria-rfb",
        "name": "Auditoria Governamental e Privada",
        "weight": 2.0,
        "importance": 1.9,
        "topics": [
          {"id": "au-1", "name": "Normas de auditoria independente e NBC TA", "importance": 1.8},
          {"id": "au-2", "name": "Planejamento e procedimentos de auditoria", "importance": 1.7},
          {"id": "au-3", "name": "Amostragem em auditoria e testes substantivos", "importance": 1.6},
          {"id": "au-4", "name": "Relatórios de auditoria e pareceres", "importance": 1.7}
        ]
      }
    ]
  }'::jsonb
),
(
  'tjsp-escrevente-2024',
  'TJ-SP — Escrevente Técnico Judiciário',
  'Vunesp',
  2024,
  'tribunais',
  true,
  '2026-v1',
  'Edital oficial TJ-SP 2024 (Vunesp). Foco intenso em Direito Processual Civil, Processual Penal e Normas da Corregedoria.',
  5,
  36,
  '{
    "id": "tjsp-escrevente-2024",
    "name": "TJ-SP — Escrevente Técnico Judiciário",
    "version": "2026-v1",
    "sources": ["tjsp-escrevente-2024"],
    "subjects": [
      {
        "id": "pt-tjsp",
        "name": "Língua Portuguesa",
        "weight": 2.4,
        "importance": 2.0,
        "topics": [
          {"id": "pt-tj-1", "name": "Interpretação e sentido global do texto", "importance": 2.0},
          {"id": "pt-tj-2", "name": "Concordância nominal e verbal", "importance": 1.8},
          {"id": "pt-tj-3", "name": "Regência nominal e verbal e Crase", "importance": 1.8},
          {"id": "pt-tj-4", "name": "Pontuação e colocação pronominal", "importance": 1.5}
        ]
      },
      {
        "id": "cpc-tjsp",
        "name": "Direito Processual Civil",
        "weight": 2.0,
        "importance": 1.9,
        "topics": [
          {"id": "cpc-tj-1", "name": "Atos processuais: forma, tempo e lugar", "importance": 1.9},
          {"id": "cpc-tj-2", "name": "Prazos processuais e penalidades", "importance": 2.0},
          {"id": "cpc-tj-3", "name": "Comunicação dos atos: citação e intimação", "importance": 1.8},
          {"id": "cpc-tj-4", "name": "Juizados Especiais Cíveis (Lei 9.099/95)", "importance": 1.6}
        ]
      },
      {
        "id": "cpp-tjsp",
        "name": "Direito Processual Penal",
        "weight": 1.6,
        "importance": 1.7,
        "topics": [
          {"id": "cpp-tj-1", "name": "Inquérito policial e ação penal", "importance": 1.8},
          {"id": "cpp-tj-2", "name": "Competência e provas", "importance": 1.6},
          {"id": "cpp-tj-3", "name": "Prisões, medidas cautelares e liberdade provisória", "importance": 1.7}
        ]
      },
      {
        "id": "normas-tjsp",
        "name": "Normas da Corregedoria Geral da Justiça",
        "weight": 2.0,
        "importance": 2.0,
        "topics": [
          {"id": "ncgj-1", "name": "Livros e classificadores obrigatórios", "importance": 1.9},
          {"id": "ncgj-2", "name": "Processo eletrônico e tramitação digital (SAJ)", "importance": 2.0},
          {"id": "ncgj-3", "name": "Deveres funcionais dos escreventes", "importance": 1.7}
        ]
      },
      {
        "id": "dir-const-tjsp",
        "name": "Direito Constitucional e Administrativo",
        "weight": 1.5,
        "importance": 1.5,
        "topics": [
          {"id": "dca-tj-1", "name": "Art. 5º da CF/88 (Direitos fundamentais)", "importance": 1.9},
          {"id": "dca-tj-2", "name": "Estatuto dos Funcionários Públicos de SP (Lei 10.261/68)", "importance": 1.8},
          {"id": "dca-tj-3", "name": "Improbidade Administrativa (Lei 8.429/92)", "importance": 1.6}
        ]
      }
    ]
  }'::jsonb
),
(
  'pf-agente-2021',
  'Polícia Federal — Agente de Polícia Federal',
  'Cebraspe',
  2021,
  'policial',
  true,
  '2026-v1',
  'Edital Polícia Federal (Cebraspe). Foco no Bloco I (Informática avançada, Contabilidade e Raciocínio Lógico).',
  6,
  44,
  '{
    "id": "pf-agente-2021",
    "name": "Polícia Federal — Agente",
    "version": "2026-v1",
    "sources": ["pf-agente-2021"],
    "subjects": [
      {
        "id": "inf-pf",
        "name": "Tecnologia da Informação",
        "weight": 3.0,
        "importance": 2.6,
        "topics": [
          {"id": "ti-pf-1", "name": "Banco de dados: conceitos, modelo relacional e SQL", "importance": 2.2},
          {"id": "ti-pf-2", "name": "Redes de computadores, protocolos e segurança", "importance": 2.0},
          {"id": "ti-pf-3", "name": "Programação básica em Python e manipulação de dados", "importance": 2.0},
          {"id": "ti-pf-4", "name": "Sistemas operacionais Linux e Windows", "importance": 1.6}
        ]
      },
      {
        "id": "cont-pf",
        "name": "Contabilidade Geral",
        "weight": 2.5,
        "importance": 2.3,
        "topics": [
          {"id": "ct-pf-1", "name": "Mecanismo de débito e crédito e partidas dobradas", "importance": 2.0},
          {"id": "ct-pf-2", "name": "Balanço patrimonial e demonstração do resultado", "importance": 1.9},
          {"id": "ct-pf-3", "name": "Patrimônio líquido e reservas", "importance": 1.6}
        ]
      },
      {
        "id": "pt-pf",
        "name": "Língua Portuguesa",
        "weight": 2.0,
        "importance": 1.8,
        "topics": [
          {"id": "pt-pf-1", "name": "Compreensão e interpretação de textos do Cebraspe", "importance": 2.0},
          {"id": "pt-pf-2", "name": "Tipologia textual e coesão referencial", "importance": 1.7},
          {"id": "pt-pf-3", "name": "Redação oficial e padrão ofício", "importance": 1.5}
        ]
      },
      {
        "id": "dir-penal-pf",
        "name": "Direito Penal e Processual Penal",
        "weight": 1.5,
        "importance": 1.6,
        "topics": [
          {"id": "dp-pf-1", "name": "Aplicação da lei penal e tipicidade", "importance": 1.7},
          {"id": "dp-pf-2", "name": "Crimes contra a administração pública e patrimônio", "importance": 1.8},
          {"id": "dp-pf-3", "name": "Inquérito policial e provas na investigação criminal", "importance": 1.9}
        ]
      },
      {
        "id": "leg-esp-pf",
        "name": "Legislação Especial",
        "weight": 1.5,
        "importance": 1.6,
        "topics": [
          {"id": "le-pf-1", "name": "Lei de Drogas (Lei 11.343/06)", "importance": 1.9},
          {"id": "le-pf-2", "name": "Estatuto do Desarmamento (Lei 10.826/03)", "importance": 1.7},
          {"id": "le-pf-3", "name": "Organizações Criminosas (Lei 12.850/13)", "importance": 1.9}
        ]
      },
      {
        "id": "rlm-pf",
        "name": "Raciocínio Lógico e Estatística",
        "weight": 1.5,
        "importance": 1.5,
        "topics": [
          {"id": "rl-pf-1", "name": "Proposições lógicas, conectivos e tabelas-verdade", "importance": 1.7},
          {"id": "rl-pf-2", "name": "Análise combinatória e probabilidade", "importance": 1.6}
        ]
      }
    ]
  }'::jsonb
),
(
  'inss-tecnico-2022',
  'INSS — Técnico do Seguro Social',
  'Cebraspe',
  2022,
  'administrativa',
  true,
  '2026-v1',
  'Edital INSS (Cebraspe). Foco esmagador em Seguridade Social e Regime Geral de Previdência Social (RGPS).',
  5,
  34,
  '{
    "id": "inss-tecnico-2022",
    "name": "INSS — Técnico do Seguro Social",
    "version": "2026-v1",
    "sources": ["inss-tecnico-2022"],
    "subjects": [
      {
        "id": "prev-inss",
        "name": "Seguridade Social (Direito Previdenciário)",
        "weight": 4.0,
        "importance": 3.0,
        "topics": [
          {"id": "prev-1", "name": "Conceito, princípios constitucionais da Seguridade Social", "importance": 2.2},
          {"id": "prev-2", "name": "Segurados obrigatórios e facultativos do RGPS", "importance": 2.5},
          {"id": "prev-3", "name": "Benefícios previdenciários (Aposentadorias, Auxílios, Pensão)", "importance": 2.8},
          {"id": "prev-4", "name": "Financiamento da Seguridade Social e contribuições", "importance": 2.2},
          {"id": "prev-5", "name": "Manutenção, perda e restabelecimento da qualidade de segurado", "importance": 2.4}
        ]
      },
      {
        "id": "pt-inss",
        "name": "Língua Portuguesa",
        "weight": 1.5,
        "importance": 1.5,
        "topics": [
          {"id": "pt-inss-1", "name": "Interpretação textual Cebraspe", "importance": 1.8},
          {"id": "pt-inss-2", "name": "Morfossintaxe e pontuação", "importance": 1.5}
        ]
      },
      {
        "id": "dir-adm-inss",
        "name": "Direito Administrativo e Regime dos Servidores",
        "weight": 1.5,
        "importance": 1.5,
        "topics": [
          {"id": "da-inss-1", "name": "Lei 8.112/90 (Regime jurídico dos servidores federais)", "importance": 2.0},
          {"id": "da-inss-2", "name": "Atos e processos administrativos (Lei 9.784/99)", "importance": 1.7}
        ]
      },
      {
        "id": "dir-const-inss",
        "name": "Direito Constitucional",
        "weight": 1.0,
        "importance": 1.2,
        "topics": [
          {"id": "dc-inss-1", "name": "Direitos e garantias fundamentais", "importance": 1.5},
          {"id": "dc-inss-2", "name": "Capítulo da Ordem Social e Previdência Social", "importance": 1.8}
        ]
      },
      {
        "id": "inf-inss",
        "name": "Noções de Informática e RLM",
        "weight": 1.0,
        "importance": 1.0,
        "topics": [
          {"id": "inf-inss-1", "name": "Segurança da informação e navegação web", "importance": 1.2},
          {"id": "rlm-inss-1", "name": "Lógica proposicional e diagramas lógicos", "importance": 1.2}
        ]
      }
    ]
  }'::jsonb
),
(
  'oab-exame-ordem',
  'OAB — Exame de Ordem Unificado (1ª Fase)',
  'FGV',
  2024,
  'oab',
  true,
  '2026-v1',
  'Exame de Ordem FGV (80 questões). Mapeamento das 17 disciplinas com peso máximo em Ética e Estatuto da Advocacia.',
  6,
  40,
  '{
    "id": "oab-exame-ordem",
    "name": "OAB — Exame de Ordem 1ª Fase",
    "version": "2026-v1",
    "sources": ["oab-exame-ordem-2024"],
    "subjects": [
      {
        "id": "etica-oab",
        "name": "Ética Profissional e Estatuto da Advocacia",
        "weight": 3.0,
        "importance": 2.8,
        "topics": [
          {"id": "et-1", "name": "Direitos e prerrogativas do advogado (Art. 7º EAOAB)", "importance": 2.5},
          {"id": "et-2", "name": "Incompatibilidades e impedimentos", "importance": 2.2},
          {"id": "et-3", "name": "Infrações e sanções disciplinares", "importance": 2.1},
          {"id": "et-4", "name": "Honorários advocatícios e sociedade de advogados", "importance": 2.0}
        ]
      },
      {
        "id": "dir-civil-oab",
        "name": "Direito Civil e Processual Civil",
        "weight": 2.5,
        "importance": 2.2,
        "topics": [
          {"id": "dc-oab-1", "name": "Parte Geral e Negócio Jurídico", "importance": 1.8},
          {"id": "dc-oab-2", "name": "Direito das Obrigações e Contratos", "importance": 2.0},
          {"id": "dpc-oab-1", "name": "Petição inicial, tutela provisória e recursos", "importance": 2.1}
        ]
      },
      {
        "id": "dir-const-oab",
        "name": "Direito Constitucional",
        "weight": 2.0,
        "importance": 1.9,
        "topics": [
          {"id": "dco-1", "name": "Ações constitucionais (MS, HC, MI, HD, AP)", "importance": 2.0},
          {"id": "dco-2", "name": "Controle de constitucionalidade difuso e concentrado", "importance": 2.0}
        ]
      },
      {
        "id": "dir-penal-oab",
        "name": "Direito Penal e Processual Penal",
        "weight": 2.0,
        "importance": 1.9,
        "topics": [
          {"id": "dp-oab-1", "name": "Teoria do delito, culpabilidade e penas", "importance": 1.9},
          {"id": "dpp-oab-1", "name": "Prisões cautelares, provas e rito do Júri", "importance": 1.9}
        ]
      },
      {
        "id": "dir-trab-oab",
        "name": "Direito do Trabalho e Processo do Trabalho",
        "weight": 1.8,
        "importance": 1.7,
        "topics": [
          {"id": "dt-oab-1", "name": "Contrato individual de trabalho e verbas rescisórias", "importance": 1.9},
          {"id": "dpt-oab-1", "name": "Recursos trabalhistas e execução trabalhista", "importance": 1.8}
        ]
      },
      {
        "id": "dir-trib-oab",
        "name": "Direito Tributário e Administrativo",
        "weight": 1.8,
        "importance": 1.7,
        "topics": [
          {"id": "dtr-oab-1", "name": "Princípios tributários e imunidades", "importance": 1.8},
          {"id": "da-oab-1", "name": "Serviços públicos e licitações", "importance": 1.7}
        ]
      }
    ]
  }'::jsonb
),
(
  'enem-matriz-2024',
  'ENEM — Matriz de Referência por Competências',
  'INEP',
  2024,
  'enem',
  true,
  '2026-v1',
  'Matriz Oficial do Exame Nacional do Ensino Médio dividida pelas 4 áreas do conhecimento do INEP.',
  4,
  32,
  '{
    "id": "enem-matriz-2024",
    "name": "ENEM — Matriz Geral de Referência",
    "version": "2026-v1",
    "sources": ["enem-inep-2024"],
    "subjects": [
      {
        "id": "ch-enem",
        "name": "Ciências Humanas e suas Tecnologias",
        "weight": 1.0,
        "importance": 1.5,
        "topics": [
          {"id": "ch-1", "name": "Cultura e identidade na sociedade contemporânea", "importance": 1.5},
          {"id": "ch-2", "name": "Cidadania, democracia e movimentos sociais no Brasil", "importance": 1.6},
          {"id": "ch-3", "name": "Urbanização, meio ambiente e agropecuária brasileira", "importance": 1.6}
        ]
      },
      {
        "id": "cn-enem",
        "name": "Ciências da Natureza e suas Tecnologias",
        "weight": 1.0,
        "importance": 1.5,
        "topics": [
          {"id": "cn-1", "name": "Ecologia, ciclos biogeoquímicos e sustentabilidade", "importance": 1.8},
          {"id": "cn-2", "name": "Genética, evolução e biotecnologia", "importance": 1.6},
          {"id": "cn-3", "name": "Mecânica, termologia e ondulatória", "importance": 1.7},
          {"id": "cn-4", "name": "Química ambiental, estequiometria e funções orgânicas", "importance": 1.7}
        ]
      },
      {
        "id": "lc-enem",
        "name": "Linguagens, Códigos e suas Tecnologias",
        "weight": 1.0,
        "importance": 1.4,
        "topics": [
          {"id": "lc-1", "name": "Gêneros textuais, intertextualidade e recursos expressivos", "importance": 1.8},
          {"id": "lc-2", "name": "Artes visuais e literatura brasileira moderna e contemporânea", "importance": 1.5},
          {"id": "lc-3", "name": "Língua estrangeira moderna (Inglês/Espanhol)", "importance": 1.2}
        ]
      },
      {
        "id": "mat-enem",
        "name": "Matemática e suas Tecnologias",
        "weight": 1.5,
        "importance": 2.0,
        "topics": [
          {"id": "mt-1", "name": "Razão, proporção, regra de três e porcentagem", "importance": 2.2},
          {"id": "mt-2", "name": "Estatística descritiva e probabilidade", "importance": 2.0},
          {"id": "mt-3", "name": "Geometria plana e espacial (cálculo de áreas e volumes)", "importance": 2.0},
          {"id": "mt-4", "name": "Funções do 1º e 2º graus e gráficos", "importance": 1.8}
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  organizer_banca = EXCLUDED.organizer_banca,
  exam_year = EXCLUDED.exam_year,
  category = EXCLUDED.category,
  is_premium = EXCLUDED.is_premium,
  version = EXCLUDED.version,
  description = EXCLUDED.description,
  subjects_count = EXCLUDED.subjects_count,
  topics_count = EXCLUDED.topics_count,
  blueprint_json = EXCLUDED.blueprint_json,
  updated_at = now();
