import { useState } from 'preact/hooks';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';
import {
  type LegalDocument,
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  USER_RIGHTS_LGPD,
  LEGAL_METADATA,
} from '../../domain/legal/legal-documents.js';

export interface LegalComplianceViewProps {
  open?: boolean;
  onClose?: () => void;
  initialTab?: 'terms' | 'privacy' | 'rights';
  isModal?: boolean;
  onExportData?: () => void;
  onDeleteLocalData?: () => void;
}

export function LegalComplianceView({
  open = true,
  onClose,
  initialTab = 'terms',
  isModal = true,
  onExportData,
  onDeleteLocalData,
}: LegalComplianceViewProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'rights'>(initialTab);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const documentMap: Record<'terms' | 'privacy' | 'rights', LegalDocument> = {
    terms: TERMS_OF_SERVICE,
    privacy: PRIVACY_POLICY,
    rights: USER_RIGHTS_LGPD,
  };

  const currentDoc = documentMap[activeTab];

  const handleCopyDpoEmail = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(LEGAL_METADATA.dpoEmail).then(() => {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2500);
      });
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const content = (
    <div class="flex flex-col gap-4 text-left">
      {/* Cabeçalho do Documento */}
      <div class="flex flex-col gap-1 pb-3 border-b border-border-default">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-brand/10 dark:bg-accent/15 text-brand dark:text-accent">
              <Icon name="shield-check" size={20} />
            </span>
            <h3 class="text-base font-semibold text-text">{currentDoc.title}</h3>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="info">Versão {currentDoc.version}</Badge>
            <Button
              variant="ghost"
              size="small"
              iconLeft="file-text"
              onClick={handlePrint}
              title="Imprimir ou Salvar em PDF"
            >
              Imprimir
            </Button>
          </div>
        </div>
        <p class="text-xs text-secondary mt-1">{currentDoc.subtitle}</p>
      </div>

      {/* Navegação por Abas */}
      <nav
        aria-label="Documentos Jurídicos e Privacidade"
        class="flex items-center gap-1.5 border-b border-border-subtle pb-2 overflow-x-auto scrollbar-none"
      >
        <button
          type="button"
          aria-pressed={activeTab === 'terms'}
          onClick={() => setActiveTab('terms')}
          class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTab === 'terms'
              ? 'bg-brand text-on-brand shadow-sm'
              : 'text-secondary hover:text-text hover:bg-surface-subtle'
          }`}
        >
          <Icon name="file-text" size={15} />
          <span>Termos de Uso (CDC)</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'privacy'}
          onClick={() => setActiveTab('privacy')}
          class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTab === 'privacy'
              ? 'bg-brand text-on-brand shadow-sm'
              : 'text-secondary hover:text-text hover:bg-surface-subtle'
          }`}
        >
          <Icon name="shield" size={15} />
          <span>Privacidade & LGPD</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'rights'}
          onClick={() => setActiveTab('rights')}
          class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTab === 'rights'
              ? 'bg-brand text-on-brand shadow-sm'
              : 'text-secondary hover:text-text hover:bg-surface-subtle'
          }`}
        >
          <Icon name="download" size={15} />
          <span>Seus Direitos (Art. 18 LGPD)</span>
        </button>
      </nav>

      {/* Painel Interativo de Exercício de Direitos (Aba 'rights') */}
      {activeTab === 'rights' && (
        <div class="p-3.5 rounded-lg bg-surface-subtle border border-border-default flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <Icon name="bolt" size={18} class="text-brand dark:text-accent" />
            <h4 class="text-xs font-semibold text-text uppercase tracking-wider">
              Painel de Autoatendimento do Titular
            </h4>
          </div>
          <p class="text-xs text-secondary leading-relaxed">
            Exerça seus direitos previstos no Art. 18 da LGPD de forma direta e sem intermediários:
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Portabilidade */}
            <div class="p-2.5 rounded-md bg-surface-card border border-border-subtle flex flex-col justify-between gap-2">
              <div>
                <span class="text-xs font-semibold text-text flex items-center gap-1.5">
                  <Icon name="download" size={14} /> Portabilidade de Dados (Art. 18, V)
                </span>
                <p class="text-xs text-secondary mt-1">
                  Baixe imediatamente uma cópia integral do seu histórico de estudos em formato
                  aberto JSON.
                </p>
              </div>
              {onExportData && (
                <Button
                  variant="secondary"
                  size="small"
                  iconLeft="file-export"
                  onClick={onExportData}
                  className="w-full"
                >
                  Exportar Meus Dados (JSON)
                </Button>
              )}
            </div>

            {/* Eliminação Local */}
            <div class="p-2.5 rounded-md bg-surface-card border border-border-subtle flex flex-col justify-between gap-2">
              <div>
                <span class="text-xs font-semibold text-text flex items-center gap-1.5">
                  <Icon name="trash" size={14} /> Eliminação Local (Art. 18, VI)
                </span>
                <p class="text-xs text-secondary mt-1">
                  Remova 100% dos dados armazenados no navegador do seu dispositivo atual.
                </p>
              </div>
              {onDeleteLocalData && (
                <Button
                  variant="danger"
                  size="small"
                  iconLeft="trash"
                  onClick={onDeleteLocalData}
                  className="w-full"
                >
                  Limpar Dados Deste Navegador
                </Button>
              )}
            </div>
          </div>

          {/* Contato com o DPO */}
          <div class="mt-1 pt-2.5 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs text-secondary">
            <span class="flex items-center gap-1.5">
              <Icon name="help-circle" size={14} />
              <span>DPO / Encarregado: {LEGAL_METADATA.dpoEmail}</span>
            </span>
            <Button
              variant="ghost"
              size="small"
              iconLeft={copiedEmail ? 'check' : 'copy'}
              onClick={handleCopyDpoEmail}
            >
              {copiedEmail ? 'Copiado!' : 'Copiar E-mail'}
            </Button>
          </div>
        </div>
      )}

      {/* Conteúdo das Cláusulas com Legal Design */}
      <div class="flex flex-col gap-4 max-h-[52vh] overflow-y-auto pr-1">
        {currentDoc.sections.map((section, idx) => (
          <article
            key={section.id || idx}
            class="p-3.5 rounded-lg bg-surface-card border border-border-default flex flex-col gap-2.5 transition-shadow hover:shadow-xs"
          >
            {/* Título da Seção */}
            <h4 class="text-xs font-bold text-text leading-snug">{section.title}</h4>

            {/* Caixa de Legal Design (Linguagem Simples) */}
            <div class="p-2 rounded bg-surface-subtle border border-border-subtle text-xs text-secondary leading-relaxed">
              <strong class="font-semibold text-text block mb-0.5">Em linguagem simples:</strong>
              {section.simpleSummary}
            </div>

            {/* Texto Formal Contratual */}
            <div class="space-y-1.5 text-xs text-secondary leading-relaxed pt-1">
              {section.content.map((p, pIdx) => (
                <p key={pIdx}>{p}</p>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Rodapé Institucional */}
      <footer class="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          Vigência: {currentDoc.lastUpdated} · {LEGAL_METADATA.jurisdiction}
        </span>
        {onClose && (
          <Button variant="ghost" size="small" onClick={onClose}>
            Fechar
          </Button>
        )}
      </footer>
    </div>
  );

  if (isModal) {
    return (
      <Dialog
        open={open}
        onClose={onClose || (() => {})}
        title="Conformidade Legal & Privacidade"
        maxWidth="xl"
        className="max-h-[92vh]"
      >
        {content}
      </Dialog>
    );
  }

  return (
    <div class="max-w-[900px] mx-auto p-4 sm:p-6 bg-surface-card rounded-xl border border-border-default shadow-sm my-6">
      {content}
    </div>
  );
}
