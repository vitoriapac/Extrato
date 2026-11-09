/**
 * Serviço de Catálogo Dinâmico de Editais na Nuvem (Fase 5 SaaS)
 *
 * Fornece busca, filtragem por categorias e bancos oficiais,
 * armazenamento em cache offline e conversão para o formato consumido
 * pelo exam-import-service.ts.
 */

export type ExamCategory =
  | 'todos'
  | 'bancario'
  | 'fiscal'
  | 'tribunais'
  | 'policial'
  | 'administrativa'
  | 'enem'
  | 'oab';

export interface CloudExamCatalogItem {
  id: string;
  slug: string;
  title: string;
  organizerBanca: string;
  examYear: number;
  category: ExamCategory;
  isPremium: boolean;
  version: string;
  description: string;
  subjectsCount: number;
  topicsCount: number;
  publishedAt: string;
}

export interface ExamCatalogBlueprintTopic {
  id: string;
  name: string;
  importance?: number;
  difficulty?: { level: string } | string;
  examImportanceEstimate?: number;
}

export interface ExamCatalogBlueprintSubject {
  id: string;
  name: string;
  weight?: number;
  importance?: number;
  topics: ExamCatalogBlueprintTopic[];
}

export interface ExamCatalogBlueprint {
  id: string;
  name: string;
  version: string;
  sources: string[];
  subjects: ExamCatalogBlueprintSubject[];
  description?: string;
}

export const CLOUD_CATALOG_STORAGE_KEY = 'extrato_cloud_catalog_cache_v1';

/**
 * Catálogo Curado Embutido (Fallback resiliente e Offline-First)
 */
export const BUILTIN_EXAM_CATALOG: CloudExamCatalogItem[] = [
  {
    id: 'caixa-tbn-2024',
    slug: 'caixa-tbn-2024',
    title: 'Caixa Econômica Federal — Técnico Bancário Novo',
    organizerBanca: 'Cesgranrio',
    examYear: 2024,
    category: 'bancario',
    isPremium: false,
    version: '2026-v1',
    description: 'Edital oficial Caixa 2024. Conhecimentos Básicos e Específicos com pesos calibrados.',
    subjectsCount: 6,
    topicsCount: 38,
    publishedAt: '2024-02-22T00:00:00Z',
  },
  {
    id: 'bb-escriturario-2023',
    slug: 'bb-escriturario-2023',
    title: 'Banco do Brasil — Escriturário (Agente Comercial)',
    organizerBanca: 'Cesgranrio',
    examYear: 2023,
    category: 'bancario',
    isPremium: true,
    version: '2026-v1',
    description: 'Edital BB 2023. Distribuição completa com foco em Vendas, Negociação e Conhecimentos Bancários.',
    subjectsCount: 6,
    topicsCount: 35,
    publishedAt: '2023-01-15T00:00:00Z',
  },
  {
    id: 'receita-federal-afrfb',
    slug: 'receita-federal-afrfb',
    title: 'Receita Federal — Auditor-Fiscal (AFRFB)',
    organizerBanca: 'FGV',
    examYear: 2023,
    category: 'fiscal',
    isPremium: true,
    version: '2026-v1',
    description: 'Edital Receita Federal 2023 (FGV). Edital com Direito Tributário, Aduaneiro e Contabilidade Avançada.',
    subjectsCount: 7,
    topicsCount: 52,
    publishedAt: '2023-03-01T00:00:00Z',
  },
  {
    id: 'tjsp-escrevente-2024',
    slug: 'tjsp-escrevente-2024',
    title: 'TJ-SP — Escrevente Técnico Judiciário',
    organizerBanca: 'Vunesp',
    examYear: 2024,
    category: 'tribunais',
    isPremium: true,
    version: '2026-v1',
    description: 'Edital oficial TJ-SP 2024 (Vunesp). Foco em Processo Civil, Processual Penal e Normas da Corregedoria.',
    subjectsCount: 5,
    topicsCount: 36,
    publishedAt: '2024-05-10T00:00:00Z',
  },
  {
    id: 'pf-agente-2021',
    slug: 'pf-agente-2021',
    title: 'Polícia Federal — Agente de Polícia Federal',
    organizerBanca: 'Cebraspe',
    examYear: 2021,
    category: 'policial',
    isPremium: true,
    version: '2026-v1',
    description: 'Edital Polícia Federal (Cebraspe). Foco em TI avançada, Contabilidade e Raciocínio Lógico.',
    subjectsCount: 6,
    topicsCount: 44,
    publishedAt: '2021-01-15T00:00:00Z',
  },
  {
    id: 'inss-tecnico-2022',
    slug: 'inss-tecnico-2022',
    title: 'INSS — Técnico do Seguro Social',
    organizerBanca: 'Cebraspe',
    examYear: 2022,
    category: 'administrativa',
    isPremium: true,
    version: '2026-v1',
    description: 'Edital INSS (Cebraspe). Foco total em Seguridade Social e Regime Geral de Previdência Social.',
    subjectsCount: 5,
    topicsCount: 34,
    publishedAt: '2022-09-15T00:00:00Z',
  },
  {
    id: 'oab-exame-ordem',
    slug: 'oab-exame-ordem',
    title: 'OAB — Exame de Ordem Unificado (1ª Fase)',
    organizerBanca: 'FGV',
    examYear: 2024,
    category: 'oab',
    isPremium: true,
    version: '2026-v1',
    description: 'Exame de Ordem FGV (80 questões). Mapeamento das 17 disciplinas com peso em Ética e Estatuto da Advocacia.',
    subjectsCount: 6,
    topicsCount: 40,
    publishedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'enem-matriz-2024',
    slug: 'enem-matriz-2024',
    title: 'ENEM — Matriz Geral de Referência',
    organizerBanca: 'INEP',
    examYear: 2024,
    category: 'enem',
    isPremium: true,
    version: '2026-v1',
    description: 'Matriz Oficial do Exame Nacional do Ensino Médio dividida pelas 4 áreas do conhecimento do INEP.',
    subjectsCount: 4,
    topicsCount: 32,
    publishedAt: '2024-04-01T00:00:00Z',
  },
];

/**
 * Blueprints pré-carregados para fallback instantâneo
 */
export const BUILTIN_BLUEPRINTS: Record<string, ExamCatalogBlueprint> = {
  'caixa-tbn-2024': {
    id: 'caixa-tbn-2024',
    name: 'Caixa — Técnico Bancário Novo',
    version: '2026-v1',
    sources: ['caixa-tbn-2024'],
    subjects: [
      {
        id: 'pt-caixa',
        name: 'Língua Portuguesa',
        weight: 1.0,
        importance: 1.2,
        topics: [
          { id: 'pt-1', name: 'Compreensão e interpretação de textos', importance: 1.5 },
          { id: 'pt-2', name: 'Ortografia oficial e acentuação gráfica', importance: 1.0 },
          { id: 'pt-3', name: 'Morfossintaxe: classes de palavras e termos da oração', importance: 1.3 },
          { id: 'pt-4', name: 'Concordância nominal e verbal', importance: 1.4 },
          { id: 'pt-5', name: 'Regência nominal e verbal, crase', importance: 1.4 },
          { id: 'pt-6', name: 'Pontuação', importance: 1.1 },
        ],
      },
      {
        id: 'cb-caixa',
        name: 'Conhecimentos Bancários',
        weight: 2.0,
        importance: 2.0,
        topics: [
          { id: 'cb-1', name: 'Sistema Financeiro Nacional (SFN) e órgãos reguladores', importance: 1.8 },
          { id: 'cb-2', name: 'Produtos bancários e operações de crédito', importance: 1.6 },
          { id: 'cb-3', name: 'Mercado de capitais e títulos de crédito', importance: 1.4 },
          { id: 'cb-4', name: 'Prevenção à lavagem de dinheiro (PLD-FT)', importance: 1.7 },
          { id: 'cb-5', name: 'Open Finance e Pix', importance: 1.8 },
        ],
      },
      {
        id: 'mat-fin-caixa',
        name: 'Matemática Financeira',
        weight: 1.0,
        importance: 1.3,
        topics: [
          { id: 'mf-1', name: 'Juros simples e compostos', importance: 1.5 },
          { id: 'mf-2', name: 'Sistemas de amortização (SAC e Price)', importance: 1.5 },
        ],
      },
      {
        id: 'ti-atend-caixa',
        name: 'Tecnologia da Informação e Atendimento Digital',
        weight: 2.0,
        importance: 1.8,
        topics: [
          { id: 'ti-1', name: 'Segurança da informação e LGPD no contexto bancário', importance: 1.8 },
          { id: 'ti-2', name: 'Ferramentas colaborativas e computação em nuvem', importance: 1.2 },
          { id: 'ti-3', name: 'Técnicas de vendas e atendimento ao cliente', importance: 1.6 },
        ],
      },
    ],
  },
  'bb-escriturario-2023': {
    id: 'bb-escriturario-2023',
    name: 'Banco do Brasil — Escriturário Comercial',
    version: '2026-v1',
    sources: ['bb-escriturario-2023'],
    subjects: [
      {
        id: 'pt-bb',
        name: 'Língua Portuguesa',
        weight: 1.0,
        importance: 1.2,
        topics: [
          { id: 'pt-bb-1', name: 'Interpretação textual e tipologia textual', importance: 1.5 },
          { id: 'pt-bb-2', name: 'Ortografia, acentuação e crase', importance: 1.2 },
        ],
      },
      {
        id: 'cb-bb',
        name: 'Conhecimentos Bancários',
        weight: 2.0,
        importance: 2.0,
        topics: [
          { id: 'cb-bb-1', name: 'Estrutura do Sistema Financeiro Nacional', importance: 1.8 },
          { id: 'cb-bb-2', name: 'Crime de lavagem de dinheiro (Lei 9.613/98)', importance: 1.7 },
          { id: 'cb-bb-3', name: 'Open Finance, Pix e Moedas Digitais', importance: 1.8 },
        ],
      },
      {
        id: 'vendas-bb',
        name: 'Vendas e Negociação',
        weight: 2.5,
        importance: 2.2,
        topics: [
          { id: 'vn-bb-1', name: 'Técnicas de vendas e atendimento ao cliente', importance: 2.0 },
          { id: 'vn-bb-2', name: 'Código de Defesa do Consumidor e Ouvidoria', importance: 1.8 },
        ],
      },
    ],
  },
  'receita-federal-afrfb': {
    id: 'receita-federal-afrfb',
    name: 'Receita Federal — Auditor-Fiscal',
    version: '2026-v1',
    sources: ['receita-federal-afrfb-2023'],
    subjects: [
      {
        id: 'trib-rfb',
        name: 'Direito Tributário',
        weight: 3.0,
        importance: 2.5,
        topics: [
          { id: 'tr-1', name: 'Sistema Tributário Nacional e princípios constitucionais', importance: 2.0 },
          { id: 'tr-2', name: 'Crédito tributário: suspensão, extinção e exclusão', importance: 2.0 },
        ],
      },
      {
        id: 'cont-geral-rfb',
        name: 'Contabilidade Geral e Avançada',
        weight: 3.0,
        importance: 2.4,
        topics: [
          { id: 'cg-1', name: 'Balanço Patrimonial e DRE', importance: 2.0 },
          { id: 'cg-2', name: 'Demonstração dos Fluxos de Caixa (DFC)', importance: 1.8 },
        ],
      },
      {
        id: 'leg-aduan-rfb',
        name: 'Legislação Aduaneira e Comércio Internacional',
        weight: 2.0,
        importance: 1.8,
        topics: [
          { id: 'la-1', name: 'Regimes aduaneiros especiais (Drawback, Entreposto)', importance: 1.9 },
          { id: 'la-2', name: 'Despacho aduaneiro e valoração aduaneira', importance: 1.7 },
        ],
      },
    ],
  },
  'tjsp-escrevente-2024': {
    id: 'tjsp-escrevente-2024',
    name: 'TJ-SP — Escrevente Técnico Judiciário',
    version: '2026-v1',
    sources: ['tjsp-escrevente-2024'],
    subjects: [
      {
        id: 'pt-tjsp',
        name: 'Língua Portuguesa',
        weight: 2.4,
        importance: 2.0,
        topics: [
          { id: 'pt-tj-1', name: 'Interpretação e sentido global do texto', importance: 2.0 },
          { id: 'pt-tj-2', name: 'Concordância e Regência', importance: 1.8 },
        ],
      },
      {
        id: 'cpc-tjsp',
        name: 'Direito Processual Civil',
        weight: 2.0,
        importance: 1.9,
        topics: [
          { id: 'cpc-tj-1', name: 'Prazos processuais e penalidades', importance: 2.0 },
          { id: 'cpc-tj-2', name: 'Comunicação dos atos: citação e intimação', importance: 1.8 },
        ],
      },
      {
        id: 'normas-tjsp',
        name: 'Normas da Corregedoria Geral da Justiça',
        weight: 2.0,
        importance: 2.0,
        topics: [
          { id: 'ncgj-1', name: 'Processo eletrônico e tramitação digital (SAJ)', importance: 2.0 },
          { id: 'ncgj-2', name: 'Deveres funcionais dos escreventes', importance: 1.7 },
        ],
      },
    ],
  },
  'pf-agente-2021': {
    id: 'pf-agente-2021',
    name: 'Polícia Federal — Agente',
    version: '2026-v1',
    sources: ['pf-agente-2021'],
    subjects: [
      {
        id: 'inf-pf',
        name: 'Tecnologia da Informação',
        weight: 3.0,
        importance: 2.6,
        topics: [
          { id: 'ti-pf-1', name: 'Banco de dados: relacional e SQL', importance: 2.2 },
          { id: 'ti-pf-2', name: 'Redes de computadores e segurança', importance: 2.0 },
        ],
      },
      {
        id: 'cont-pf',
        name: 'Contabilidade Geral',
        weight: 2.5,
        importance: 2.3,
        topics: [
          { id: 'ct-pf-1', name: 'Mecanismo de débito e crédito e partidas dobradas', importance: 2.0 },
          { id: 'ct-pf-2', name: 'Balanço patrimonial e demonstração do resultado', importance: 1.9 },
        ],
      },
    ],
  },
  'inss-tecnico-2022': {
    id: 'inss-tecnico-2022',
    name: 'INSS — Técnico do Seguro Social',
    version: '2026-v1',
    sources: ['inss-tecnico-2022'],
    subjects: [
      {
        id: 'prev-inss',
        name: 'Seguridade Social (Direito Previdenciário)',
        weight: 4.0,
        importance: 3.0,
        topics: [
          { id: 'prev-1', name: 'Conceito e princípios constitucionais da Seguridade', importance: 2.2 },
          { id: 'prev-2', name: 'Benefícios previdenciários (Aposentadorias, Auxílios)', importance: 2.8 },
        ],
      },
      {
        id: 'dir-adm-inss',
        name: 'Direito Administrativo e Regime dos Servidores',
        weight: 1.5,
        importance: 1.5,
        topics: [
          { id: 'da-inss-1', name: 'Lei 8.112/90 (Regime jurídico dos servidores federais)', importance: 2.0 },
        ],
      },
    ],
  },
  'oab-exame-ordem': {
    id: 'oab-exame-ordem',
    name: 'OAB — Exame de Ordem 1ª Fase',
    version: '2026-v1',
    sources: ['oab-exame-ordem-2024'],
    subjects: [
      {
        id: 'etica-oab',
        name: 'Ética Profissional e Estatuto da Advocacia',
        weight: 3.0,
        importance: 2.8,
        topics: [
          { id: 'et-1', name: 'Direitos e prerrogativas do advogado (Art. 7º EAOAB)', importance: 2.5 },
          { id: 'et-2', name: 'Infrações e sanções disciplinares', importance: 2.1 },
        ],
      },
      {
        id: 'dir-const-oab',
        name: 'Direito Constitucional',
        weight: 2.0,
        importance: 1.9,
        topics: [
          { id: 'dco-1', name: 'Controle de constitucionalidade difuso e concentrado', importance: 2.0 },
        ],
      },
    ],
  },
  'enem-matriz-2024': {
    id: 'enem-matriz-2024',
    name: 'ENEM — Matriz Geral de Referência',
    version: '2026-v1',
    sources: ['enem-inep-2024'],
    subjects: [
      {
        id: 'mat-enem',
        name: 'Matemática e suas Tecnologias',
        weight: 1.5,
        importance: 2.0,
        topics: [
          { id: 'mt-1', name: 'Razão, proporção, regra de três e porcentagem', importance: 2.2 },
          { id: 'mt-2', name: 'Geometria plana e espacial (cálculo de áreas e volumes)', importance: 2.0 },
        ],
      },
      {
        id: 'cn-enem',
        name: 'Ciências da Natureza e suas Tecnologias',
        weight: 1.0,
        importance: 1.5,
        topics: [
          { id: 'cn-1', name: 'Ecologia, ciclos biogeoquímicos e sustentabilidade', importance: 1.8 },
        ],
      },
    ],
  },
};

/**
 * Normaliza textos para busca (sem acentos e minúsculas)
 */
export function normalizeSearchQuery(query: unknown): string {
  return String(query || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Filtra itens por categoria e texto de busca
 */
export function filterCatalogItems(
  items: CloudExamCatalogItem[],
  filter: { category?: string; query?: string } = {}
): CloudExamCatalogItem[] {
  const normCategory = (filter.category || 'todos').toLowerCase();
  const normQuery = normalizeSearchQuery(filter.query);

  return items.filter(item => {
    // Filtro por categoria
    if (normCategory !== 'todos' && item.category !== normCategory) {
      return false;
    }

    // Filtro por termo de busca
    if (normQuery) {
      const matchTitle = normalizeSearchQuery(item.title).includes(normQuery);
      const matchBanca = normalizeSearchQuery(item.organizerBanca).includes(normQuery);
      const matchDesc = normalizeSearchQuery(item.description).includes(normQuery);
      const matchSlug = normalizeSearchQuery(item.slug).includes(normQuery);
      if (!matchTitle && !matchBanca && !matchDesc && !matchSlug) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Carrega itens do cache offline do navegador
 */
export function loadCatalogCache(storage?: Storage): CloudExamCatalogItem[] | null {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!s) return null;
    const raw = s.getItem(CLOUD_CATALOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Falha silenciosa de cache
  }
  return null;
}

/**
 * Salva itens no cache offline
 */
export function saveCatalogCache(items: CloudExamCatalogItem[], storage?: Storage): void {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!s) return;
    s.setItem(CLOUD_CATALOG_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Falha silenciosa de cache
  }
}

/**
 * Busca a lista de editais disponíveis (via API Supabase ou fallback local)
 */
export async function fetchCatalogList(
  options: {
    category?: string;
    query?: string;
    fetchImpl?: typeof fetch;
    apiUrl?: string;
    signal?: AbortSignal;
    storage?: Storage;
  } = {}
): Promise<CloudExamCatalogItem[]> {
  const fetchFn = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  const apiUrl = options.apiUrl || (typeof window !== 'undefined' ? (window as any).APP_CONFIG?.SUPABASE_URL : '');

  let items: CloudExamCatalogItem[] = [];

  if (fetchFn && apiUrl) {
    try {
      const endpoint = `${apiUrl.replace(/\/+$/, '')}/rest/v1/exam_catalog_templates?select=id,slug,title,organizer_banca,exam_year,category,is_premium,version,description,subjects_count,topics_count,published_at&order=published_at.desc`;
      const res = await fetchFn(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: (typeof window !== 'undefined' ? (window as any).APP_CONFIG?.SUPABASE_ANON_KEY : '') || '',
        },
        signal: options.signal,
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          items = rows.map((r: any) => ({
            id: r.id || r.slug,
            slug: r.slug,
            title: r.title,
            organizerBanca: r.organizer_banca,
            examYear: Number(r.exam_year),
            category: r.category as ExamCategory,
            isPremium: Boolean(r.is_premium),
            version: r.version || '2026-v1',
            description: r.description || '',
            subjectsCount: Number(r.subjects_count || 0),
            topicsCount: Number(r.topics_count || 0),
            publishedAt: r.published_at || new Date().toISOString(),
          }));
          saveCatalogCache(items, options.storage);
        }
      }
    } catch {
      // Se falhar a requisição de rede, recai sobre o cache local ou builtin
    }
  }

  if (!items.length) {
    const cached = loadCatalogCache(options.storage);
    items = cached && cached.length ? cached : [...BUILTIN_EXAM_CATALOG];
  }

  return filterCatalogItems(items, {
    category: options.category,
    query: options.query,
  });
}

/**
 * Busca o blueprint estruturado completo de um concurso
 */
export async function fetchExamBlueprint(
  slug: string,
  options: {
    fetchImpl?: typeof fetch;
    apiUrl?: string;
    signal?: AbortSignal;
  } = {}
): Promise<ExamCatalogBlueprint | null> {
  const fetchFn = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  const apiUrl = options.apiUrl || (typeof window !== 'undefined' ? (window as any).APP_CONFIG?.SUPABASE_URL : '');

  if (fetchFn && apiUrl) {
    try {
      const endpoint = `${apiUrl.replace(/\/+$/, '')}/rest/v1/exam_catalog_templates?slug=eq.${encodeURIComponent(slug)}&select=blueprint_json`;
      const res = await fetchFn(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: (typeof window !== 'undefined' ? (window as any).APP_CONFIG?.SUPABASE_ANON_KEY : '') || '',
        },
        signal: options.signal,
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].blueprint_json) {
          return rows[0].blueprint_json as ExamCatalogBlueprint;
        }
      }
    } catch {
      // Falha de rede: recai sobre os blueprints embutidos
    }
  }

  if (BUILTIN_BLUEPRINTS[slug]) {
    return structuredClone(BUILTIN_BLUEPRINTS[slug]);
  }

  return null;
}

/**
 * Converte o blueprint da nuvem para a estrutura consumida por exam-import-service.ts
 */
export function convertBlueprintToImportPreset(
  item: CloudExamCatalogItem,
  blueprint: ExamCatalogBlueprint
) {
  if (!blueprint || !Array.isArray(blueprint.subjects)) {
    throw new TypeError('Blueprint inválido ou ausente.');
  }

  return Object.freeze({
    id: blueprint.id || item.slug,
    name: blueprint.name || item.title,
    version: blueprint.version || item.version || '2026-v1',
    sources: blueprint.sources && blueprint.sources.length ? blueprint.sources : [item.slug],
    description: blueprint.description || item.description,
    subjects: blueprint.subjects.map(s => ({
      id: s.id,
      name: s.name,
      weight: s.weight ?? 1.0,
      importance: s.importance ?? 1.0,
      topics: (s.topics || []).map(t => ({
        id: t.id,
        name: t.name,
        difficulty: t.difficulty,
        importance: t.importance ?? 1.0,
        examImportanceEstimate: t.examImportanceEstimate ?? t.importance ?? 1.0,
      })),
    })),
  });
}

/**
 * Valida se o usuário tem permissão para importar o edital
 */
export function canUserAccessExam(item: CloudExamCatalogItem, isPro: boolean): boolean {
  if (!item.isPremium) return true;
  return isPro;
}
