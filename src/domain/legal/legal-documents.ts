/**
 * Documentos Legais, Termos de Uso, Política de Privacidade e Conformidade LGPD/CDC (Fase 9 SaaS)
 *
 * Módulo puramente algorítmico e determinístico em TypeScript, sem dependências de UI/DOM.
 */

export const CURRENT_LEGAL_VERSION = '2026-11-v1';

export interface LegalMetadata {
  version: string;
  lastUpdated: string;
  effectiveDate: string;
  dpoEmail: string;
  supportEmail: string;
  companyName: string;
  jurisdiction: string;
}

export const LEGAL_METADATA: LegalMetadata = {
  version: CURRENT_LEGAL_VERSION,
  lastUpdated: '08 de novembro de 2026',
  effectiveDate: '08 de novembro de 2026',
  dpoEmail: 'privacidade@extratodeestudos.com.br',
  supportEmail: 'suporte@extratodeestudos.com.br',
  companyName: 'Extrato de Estudos Tecnologia Ltda.',
  jurisdiction: 'Foro do domicílio do consumidor (Art. 101, I do Código de Defesa do Consumidor)',
};

export interface LegalSection {
  id: string;
  title: string;
  simpleSummary: string; // Legal Design em linguagem acessível
  content: string[];
}

export interface LegalDocument {
  id: 'terms' | 'privacy' | 'rights';
  title: string;
  subtitle: string;
  version: string;
  lastUpdated: string;
  sections: LegalSection[];
}

/**
 * 1. Termos e Condições Gerais de Uso (CDC — Lei nº 8.078/1990 e Código Civil)
 */
export const TERMS_OF_SERVICE: LegalDocument = {
  id: 'terms',
  title: 'Termos e Condições de Uso',
  subtitle: 'Diretrizes contratuais claras, transparentes e em total conformidade com o Código de Defesa do Consumidor.',
  version: CURRENT_LEGAL_VERSION,
  lastUpdated: LEGAL_METADATA.lastUpdated,
  sections: [
    {
      id: 'natureza-servico',
      title: '1. Objeto e Natureza do Serviço (Obrigação de Meio)',
      simpleSummary: 'O Extrato de Estudos é uma ferramenta de organização e planejamento algorítmico; não garantimos aprovação em exames.',
      content: [
        'O Extrato de Estudos é uma plataforma tecnológica de organização pessoal de estudos, análise de métricas de aprendizado, caderno de erros e planejamento baseado em evidências.',
        'A plataforma constitui estrita obrigação de meio. Não oferecemos garantia, promessa implícita ou explícita de aprovação em concursos públicos, exames da OAB, ENEM ou vestibulares.',
        'O desempenho em avaliações reais depende exclusivamente do empenho, disciplina individual do estudante e de fatores externos alheios ao controle da plataforma.',
      ],
    },
    {
      id: 'licenca-planos',
      title: '2. Licença de Uso e Planos (Free, Pro e Mentor)',
      simpleSummary: 'Sua conta é individual e intransferível. Os limites de cada plano são objetivos e respeitados pela plataforma.',
      content: [
        'A plataforma concede ao usuário uma licença de uso pessoal, não exclusiva, revogável e intransferível.',
        'O Plano Free Local permite a gestão de até 8 disciplinas ativas, 1 concurso configurado e 30 flashcards de revisão no caderno de erros, funcionando inteiramente no navegador local.',
        'Os Planos Pro (Mensal e Anual) e Mentor desbloqueiam disciplinas ilimitadas, sincronização contínua na nuvem entre dispositivos, simulador What-If e relatórios analíticos avançados.',
        'É vedado o compartilhamento de credenciais de acesso ou a revenda de planos a terceiros sem prévia autorização.',
      ],
    },
    {
      id: 'faturamento-pix-cartao',
      title: '3. Faturamento: Pagamentos via PIX e Cartão de Crédito',
      simpleSummary: 'PIX é pré-pago sem renovação surpresa; Cartão possui renovação automática mensal ou parcelamento anual em até 12x.',
      content: [
        'Pagamentos via PIX possuem caráter pré-pago avulso (acesso de 31 dias no Pro Mensal ou 366 dias no Pro Anual). O PIX não renova automaticamente e não gera cobranças futuras indesejadas.',
        'Pagamentos via Cartão de Crédito Mensal constituem assinatura recorrente automatizada (auto-renovável a cada ciclo de 30 dias até manifestação de cancelamento).',
        'Pagamentos via Cartão de Crédito Anual podem ser parcelados em até 12x, conforme condições exibidas no checkout seguro.',
        'Em caso de recusa na renovação do cartão de crédito, concedemos uma tolerância de 3 dias corridos (grace period) antes de suspender a sincronização em nuvem, permitindo a regularização sem perda de histórico.',
      ],
    },
    {
      id: 'direito-arrependimento-7d',
      title: '4. Direito de Arrependimento de 7 Dias (Art. 49 do CDC)',
      simpleSummary: 'Você tem 7 dias corridos para testar e pedir reembolso integral imediato caso não fique satisfeito.',
      content: [
        'Em estrito cumprimento ao Art. 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990), o assinante tem o direito de desistir imotivadamente da contratação no prazo de até 7 (sete) dias corridos a contar da confirmação do pagamento.',
        'A solicitação de estorno pode ser feita diretamente pelo painel da conta ou via canal de suporte (suporte@extratodeestudos.com.br).',
        'O reembolso é integral, processado de forma imediata (devolução via PIX para a chave pagadora ou estorno na fatura do cartão de crédito).',
      ],
    },
    {
      id: 'garantia-local-first',
      title: '5. Garantia de Não-Sequestro de Dados (Local-First Guarantee)',
      simpleSummary: 'Mesmo cancelando o plano pago, seus registros de estudo continuam no seu computador e podem ser exportados livremente.',
      content: [
        'Assumimos o compromisso contratual de não-sequestro de dados. Caso sua assinatura Pro expire ou seja cancelada, seus registros locais de estudo permanecem integralmente funcionais no seu dispositivo.',
        'Você mantém o direito irrevogável de exportar todos os seus dados em formatos abertos e estruturados (JSON e CSV) a qualquer momento.',
      ],
    },
    {
      id: 'cancelamento-recorrencia',
      title: '6. Cancelamento da Recorrência sem Multas',
      simpleSummary: 'Cancele a renovação futura do cartão quando quiser com 1 clique, mantendo o acesso até o fim do período já pago.',
      content: [
        'O cancelamento da renovação automática de cartão de crédito pode ser realizado a qualquer momento no painel "Minha Assinatura" com 1 clique (marcando cancel_at_period_end).',
        'Não há incidência de taxas rescisórias, multas ou fidelidade contratual oculta.',
        'Ao cancelar, o usuário mantém acesso a todos os recursos Pro até o último dia do período já contratado.',
      ],
    },
  ],
};

/**
 * 2. Política de Privacidade e Proteção de Dados (LGPD — Lei nº 13.709/2018 e Marco Civil — Lei nº 12.965/2014)
 */
export const PRIVACY_POLICY: LegalDocument = {
  id: 'privacy',
  title: 'Política de Privacidade e Proteção de Dados',
  subtitle: 'Arquitetura Privacy-by-Design, conformidade integral com a LGPD e o Marco Civil da Internet.',
  version: CURRENT_LEGAL_VERSION,
  lastUpdated: LEGAL_METADATA.lastUpdated,
  sections: [
    {
      id: 'arquitetura-privacy-by-design',
      title: '1. Arquitetura Privacy-by-Design e Modo Local-First',
      simpleSummary: 'No modo Free, tudo fica no seu navegador. No modo Pro, seus dados são isolados por RLS e criptografia.',
      content: [
        'O Extrato de Estudos adota o princípio de Privacidade desde a Concepção (Privacy-by-Design).',
        'No Modo Local (Free), 100% dos seus dados (matérias, tópicos, sessões, notas pessoais e erros) são gravados exclusivamente no banco de dados do seu navegador (IndexedDB e localStorage). Nenhum byte do seu conteúdo de estudo é enviado aos nossos servidores.',
        'No Modo Sincronizado (Pro/Mentor), os dados são transmitidos por conexões criptografadas (TLS 1.3) e armazenados em tabelas isoladas por Row Level Security (RLS) no PostgreSQL, com opção de criptografia adicional ponta a ponta (Zero-Knowledge).',
      ],
    },
    {
      id: 'bases-legais-e-inventario',
      title: '2. Dados Coletados e Bases Legais da LGPD (Art. 7º)',
      simpleSummary: 'Coletamos apenas o essencial para autenticar sua conta, emitir recibos fiscais e sincronizar seus estudos.',
      content: [
        'Execução de Contrato (Art. 7º, V): nome, e-mail, identificador de autenticação Clerk (sub), foto/avatar opcional e estado de estudo sincronizado para entrega do serviço.',
        'Cumprimento de Obrigação Legal e Regulatória (Art. 7º, II): CPF/CNPJ (taxId), telefone e registros fiscais de pagamento exigidos pelas autoridades tributárias, bem como registros de acesso à aplicação mantidos pelo prazo legal de 6 meses (Art. 15 da Lei nº 12.965/2014 - Marco Civil da Internet).',
        'Legítimo Interesse e Prevenção à Fraude (Art. 7º, IX e Art. 11, II, "g"): identificador de dispositivo técnico (device_id), hashes de integridade (checksum_sha256) e limites de requisições por segundo para proteção da infraestrutura.',
      ],
    },
    {
      id: 'subprocessadores',
      title: '3. Operadores Técnicos e Subprocessadores Homologados',
      simpleSummary: 'Trabalhamos apenas com parceiros de alto nível de segurança (Clerk, Supabase, AbacatePay, Resend e Cloudflare).',
      content: [
        'Clerk: fornecedor de gestão de identidade, autenticação multifator (MFA), gerenciamento de sessões e perfil.',
        'Supabase: infraestrutura de banco de dados PostgreSQL hospedada com criptografia em repouso e políticas RLS de isolamento estrito.',
        'AbacatePay / Gateway de Pagamento: processador de pagamentos PIX e Cartão de Crédito em conformidade PCI-DSS SAQ-A. O Extrato de Estudos armazena apenas a bandeira e os últimos 4 dígitos do cartão (card_last4), jamais tendo acesso a números completos de cartão ou códigos de segurança (CVV).',
        'Resend: serviço de mensageria para envio seguro de e-mails transacionais, confirmações de pagamento e alertas de segurança autenticados por SPF/DKIM/DMARC.',
        'Cloudflare / Vercel: rede de distribuição de conteúdo (CDN) e proteção contra ataques de negação de serviço (DDoS).',
      ],
    },
    {
      id: 'zero-comercializacao',
      title: '4. Declaração Estrita de Zero Comercialização de Dados',
      simpleSummary: 'Nunca vendemos nem compartilhamos seus dados pessoais com redes de anúncios ou terceiros.',
      content: [
        'Não vendemos, alugamos, licenciamos ou comercializamos dados de usuários sob nenhuma circunstância.',
        'A plataforma não contém rastreadores publicitários invasivos, pixels de redes sociais de terceiros ou qualquer mecanismo de perfilamento comercial.',
      ],
    },
    {
      id: 'seguranca-retencao',
      title: '5. Segurança da Informação e Prazo de Retenção',
      simpleSummary: 'Seus dados são protegidos por criptografia moderna e mantidos apenas enquanto você mantiver sua conta ativa.',
      content: [
        'Todas as comunicações entre o cliente e a nuvem utilizam TLS 1.3 com certificados válidos.',
        'Os dados de estudo sincronizados são armazenados enquanto o titular mantiver a conta ativa na plataforma.',
        'Após solicitação de exclusão definitiva da conta, todos os registros de estudo e snapshots são permanentemente apagados dos servidores em até 48 horas, preservando-se unicamente os registros fiscais obrigatórios pela legislação tributária brasileira.',
      ],
    },
  ],
};

/**
 * 3. Painel de Direitos do Titular (LGPD — Lei nº 13.709/2018, Art. 18)
 */
export const USER_RIGHTS_LGPD: LegalDocument = {
  id: 'rights',
  title: 'Seus Direitos como Titular (Art. 18 da LGPD)',
  subtitle: 'Transparência ativa e controle total sobre seus dados pessoais com ferramentas de autoatendimento.',
  version: CURRENT_LEGAL_VERSION,
  lastUpdated: LEGAL_METADATA.lastUpdated,
  sections: [
    {
      id: 'acesso-portabilidade',
      title: '1. Confirmação, Acesso e Portabilidade (Art. 18, I, II e V)',
      simpleSummary: 'Você pode baixar 100% dos seus dados a qualquer momento em arquivo JSON interoperável.',
      content: [
        'Você tem o direito de obter a confirmação da existência de tratamento dos seus dados e acessá-los integralmente.',
        'A qualquer instante, você pode utilizar a ferramenta de Backup e Portabilidade do Extrato de Estudos para baixar uma cópia completa de suas matérias, sessões, métricas e histórico em formato aberto (JSON).',
      ],
    },
    {
      id: 'retificacao',
      title: '2. Correção de Dados Incompletos ou Inexatos (Art. 18, III)',
      simpleSummary: 'Edite seu nome, foto e credenciais com facilidade no painel de perfil.',
      content: [
        'Você pode atualizar seus dados cadastrais (nome, avatar, e-mail e credenciais de login) diretamente pelo botão de Perfil do cabeçalho da plataforma a qualquer momento.',
      ],
    },
    {
      id: 'eliminacao-esquecimento',
      title: '3. Eliminação e Direito ao Esquecimento (Art. 18, VI)',
      simpleSummary: 'Apague seus dados locais com 1 clique ou requisite a exclusão definitiva da sua conta na nuvem.',
      content: [
        'Você pode apagar todos os dados armazenados no navegador do seu dispositivo atual limpando o armazenamento local.',
        'Caso deseje a eliminação definitiva da sua conta de usuário e de todos os dados sincronizados na nuvem, disponibilizamos o canal direto com o Encarregado de Proteção de Dados (privacidade@extratodeestudos.com.br).',
        'A exclusão na nuvem remove irrevogavelmente todos os registros de user_study_states e user_state_snapshots.',
      ],
    },
    {
      id: 'contato-dpo',
      title: '4. Encarregado pelo Tratamento de Dados Pessoais (DPO — Art. 41)',
      simpleSummary: 'Nosso canal exclusivo para dúvidas ou requisições sobre privacidade está à sua disposição.',
      content: [
        'Encarregado pelo Tratamento de Dados (DPO): Equipe de Privacidade e Governança do Extrato de Estudos.',
        'E-mail oficial para requisições de titulares: privacidade@extratodeestudos.com.br.',
        'Tempo médio de resposta: em até 5 dias úteis, em conformidade com as diretrizes da Autoridade Nacional de Proteção de Dados (ANPD).',
      ],
    },
  ],
};

/**
 * Recupera o documento canônico por tipo
 */
export function getLegalDocument(type: 'terms' | 'privacy' | 'rights'): LegalDocument {
  switch (type) {
    case 'terms':
      return TERMS_OF_SERVICE;
    case 'privacy':
      return PRIVACY_POLICY;
    case 'rights':
      return USER_RIGHTS_LGPD;
    default:
      return TERMS_OF_SERVICE;
  }
}

/**
 * Verifica se o usuário aceitou a versão vigente dos termos
 */
export function hasUserAcceptedCurrentLegalVersion(userProfile: {
  termsAcceptedVersion?: string | null;
} | null | undefined): boolean {
  if (!userProfile) return false;
  return userProfile.termsAcceptedVersion === CURRENT_LEGAL_VERSION;
}

/**
 * Cria o payload determinístico de aceite legal para gravação auditada
 */
export function createLegalAcceptancePayload(): {
  termsAcceptedVersion: string;
  termsAcceptedAt: string;
  privacyAcceptedAt: string;
} {
  const now = new Date().toISOString();
  return {
    termsAcceptedVersion: CURRENT_LEGAL_VERSION,
    termsAcceptedAt: now,
    privacyAcceptedAt: now,
  };
}

/**
 * Extrai parâmetros de consulta jurídica da URL (?legal=terms | ?legal=privacy | ?legal=rights)
 */
export function parseLegalQueryParam(urlOrSearch: string): 'terms' | 'privacy' | 'rights' | null {
  try {
    const search = urlOrSearch.includes('?') ? urlOrSearch.split('?')[1] : urlOrSearch;
    const params = new URLSearchParams(search);
    const legalParam = params.get('legal')?.toLowerCase();
    if (legalParam === 'terms' || legalParam === 'privacy' || legalParam === 'rights') {
      return legalParam;
    }
  } catch {
    // Falha silenciosa
  }
  return null;
}
