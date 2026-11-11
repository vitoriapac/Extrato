import { useState, useEffect, useMemo } from 'preact/hooks';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';
import {
  type CloudExamCatalogItem,
  type ExamCatalogBlueprint,
  type ExamCategory,
  fetchCatalogList,
  fetchExamBlueprint,
  canUserAccessExam,
} from '../../application/subjects/cloud-catalog-service.js';

export interface CloudExamCatalogModalProps {
  open: boolean;
  onClose: () => void;
  isPro: boolean;
  onUpgradeRequired?: (item: CloudExamCatalogItem) => void;
  onImportBlueprint: (blueprint: ExamCatalogBlueprint, item: CloudExamCatalogItem) => Promise<void> | void;
  apiUrl?: string;
}

const CATEGORY_TABS: Array<{ id: ExamCategory; label: string; icon: string }> = [
  { id: 'todos', label: 'Todos', icon: 'books' },
  { id: 'bancario', label: 'Bancária', icon: 'building-bank' },
  { id: 'fiscal', label: 'Fiscal', icon: 'calculator' },
  { id: 'tribunais', label: 'Tribunais', icon: 'scale' },
  { id: 'policial', label: 'Policial', icon: 'shield' },
  { id: 'administrativa', label: 'Administrativa', icon: 'file-text' },
  { id: 'oab', label: 'OAB', icon: 'award' },
  { id: 'enem', label: 'ENEM', icon: 'book' },
];

export function CloudExamCatalogModal({
  open,
  onClose,
  isPro,
  onUpgradeRequired,
  onImportBlueprint,
  apiUrl,
}: CloudExamCatalogModalProps) {
  const [items, setItems] = useState<CloudExamCatalogItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingSlug, setImportingSlug] = useState<string | null>(null);

  // Carrega a lista quando o modal é aberto
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchCatalogList({ apiUrl })
      .then(catalogItems => {
        if (isMounted) {
          setItems(catalogItems);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Não foi possível carregar o catálogo de editais online.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, apiUrl]);

  // Filtra itens por categoria e pesquisa
  const filteredItems = useMemo(() => {
    const q = searchQuery
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

    return items.filter(item => {
      if (selectedCategory !== 'todos' && item.category !== selectedCategory) {
        return false;
      }
      if (q) {
        const titleNorm = item.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const bancaNorm = item.organizerBanca.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const descNorm = item.description.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (!titleNorm.includes(q) && !bancaNorm.includes(q) && !descNorm.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  // Manipulador de importação de edital
  const handleImport = async (item: CloudExamCatalogItem) => {
    if (!canUserAccessExam(item, isPro)) {
      if (onUpgradeRequired) {
        onUpgradeRequired(item);
      }
      return;
    }

    try {
      setImportingSlug(item.slug);
      setError(null);
      const blueprint = await fetchExamBlueprint(item.slug, { apiUrl });
      if (!blueprint) {
        setError(`Não foi possível carregar a estrutura do edital "${item.title}".`);
        setImportingSlug(null);
        return;
      }
      await onImportBlueprint(blueprint, item);
      setImportingSlug(null);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao importar estrutura do edital.');
      setImportingSlug(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Catálogo de Editais na Nuvem"
      maxWidth="xl"
      className="max-h-[90vh]"
    >
      <div class="flex flex-col gap-4 p-1">
        {/* Descrição e contextualização */}
        <p class="text-xs text-secondary leading-relaxed">
          Selecione um edital verticalizado oficial com tópicos, disciplinas, pesos e incidências pré-calibrados para importar diretamente no seu plano de estudos.
        </p>

        {/* Barra de Busca e Filtros */}
        <div class="flex flex-col gap-3">
          {/* Campo de pesquisa */}
          <div class="relative flex items-center">
            <span class="absolute left-3 text-secondary pointer-events-none">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              aria-label="Buscar edital ou banca organizadora"
              placeholder="Buscar por concurso, banca organizadora (Cesgranrio, FGV, Cebraspe...)"
              value={searchQuery}
              onInput={e => setSearchQuery((e.target as HTMLInputElement).value)}
              class="w-full min-h-touch sm:min-h-control pl-10 pr-10 py-2 rounded-default border border-border-control bg-surface-subtle text-text text-sm focus:outline-none focus:border-brand transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setSearchQuery('')}
                class="absolute right-2 inline-flex items-center justify-center min-h-8 min-w-8 p-1 text-secondary hover:text-text cursor-pointer"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          {/* Abas de categorias */}
          <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map(tab => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedCategory(tab.id)}
                  class={`inline-flex items-center gap-2 px-3 py-2 min-h-control rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-brand text-on-brand shadow-sm'
                      : 'bg-surface-subtle text-secondary hover:text-text hover:bg-surface-card border border-border-subtle'
                  }`}
                >
                  <Icon name={tab.icon} size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mensagem de Erro, se houver */}
        {error && (
          <div
            role="alert"
            class="flex items-center gap-2 p-3 rounded-default bg-red-bg text-red text-xs border border-red/20"
          >
            <Icon name="alert-circle" size={16} />
            <span class="flex-1">{error}</span>
            <Button
              variant="ghost"
              size="small"
              onClick={() => {
                setError(null);
                fetchCatalogList({ apiUrl }).then(setItems);
              }}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Lista de Editais / Grid de Cards */}
        <div class="overflow-y-auto max-h-[50vh] pr-1">
          {loading ? (
            <div class="flex flex-col items-center justify-center py-12 gap-3 text-secondary">
              <Icon name="loader-2" size={28} class="animate-spin text-brand dark:text-accent" />
              <span class="text-xs">Carregando catálogo de editais...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div class="flex flex-col items-center justify-center py-12 gap-2 text-secondary text-center">
              <Icon name="books" size={32} class="opacity-40" />
              <p class="text-sm font-medium text-text">Nenhum edital encontrado</p>
              <p class="text-xs text-secondary max-w-sm">
                Tente ajustar o termo de busca ou selecione outra categoria de concursos.
              </p>
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map(item => {
                const canAccess = canUserAccessExam(item, isPro);
                const isImporting = importingSlug === item.slug;

                return (
                  <article
                    key={item.slug}
                    class="flex flex-col justify-between p-card rounded-default border border-border-default bg-surface-card hover:border-border-strong transition-all shadow-sm"
                  >
                    <div>
                      {/* Metadados Superiores */}
                      <div class="flex items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="px-2 py-1 rounded text-xs font-medium bg-surface-subtle text-secondary border border-border-subtle capitalize">
                            {item.category}
                          </span>
                          <span class="text-xs text-muted">
                            {item.organizerBanca} • {item.examYear}
                          </span>
                        </div>
                        {item.isPremium && (
                          <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-bg text-amber border border-amber/30">
                            <Icon name="crown" size={12} />
                            PRO
                          </span>
                        )}
                      </div>

                      {/* Título do Concurso */}
                      <h4 class="text-sm font-semibold text-text leading-snug line-clamp-2">
                        {item.title}
                      </h4>

                      {/* Descrição resumida */}
                      <p class="mt-1 text-xs text-secondary line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Métricas: Disciplinas e Tópicos */}
                      <div class="mt-3 flex items-center gap-4 text-xs text-secondary">
                        <span class="inline-flex items-center gap-1">
                          <Icon name="books" size={13} class="text-secondary" />
                          <span>{item.subjectsCount} disciplinas</span>
                        </span>
                        <span class="inline-flex items-center gap-1">
                          <Icon name="list-details" size={13} class="text-secondary" />
                          <span>{item.topicsCount} tópicos</span>
                        </span>
                      </div>
                    </div>

                    {/* Ação: Importar ou Desbloquear Pro */}
                    <div class="mt-4 pt-3 border-t border-border-subtle flex items-center justify-end">
                      {!canAccess ? (
                        <Button
                          variant="tonal"
                          size="small"
                          iconLeft="crown"
                          className="bg-amber-bg text-amber hover:opacity-90 border-transparent"
                          onClick={() => onUpgradeRequired && onUpgradeRequired(item)}
                        >
                          Desbloquear no Pro
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="small"
                          iconLeft={isImporting ? 'loader-2' : 'file-import'}
                          disabled={isImporting}
                          onClick={() => handleImport(item)}
                        >
                          {isImporting ? 'Baixando...' : 'Importar Edital'}
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé informativo */}
        <footer class="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-secondary">
          <span class="inline-flex items-center gap-1 text-muted">
            <Icon name="shield-check" size={14} />
            <span>Importação não altera sessões de estudo anteriores.</span>
          </span>
          <Button variant="ghost" size="small" onClick={onClose}>
            Fechar
          </Button>
        </footer>
      </div>
    </Dialog>
  );
}
