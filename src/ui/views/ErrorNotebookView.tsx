import { useState } from 'preact/hooks';
import type { ErrorFlashcard, ErrorFlashcardStatus, FlashcardRating } from '../../core/types.js';
import {
  getDueFlashcards,
  calculateFlashcardDeckStats,
  filterFlashcards,
  type CreateFlashcardInput,
  type FlashcardDraft,
} from '../../domain/notebook/error-notebook-engine.js';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';

export interface SubjectWithTopics {
  id: string;
  name: string;
  topics: Array<{ id: string; name: string }>;
}

export interface ErrorNotebookViewProps {
  flashcards: ErrorFlashcard[];
  subjects: SubjectWithTopics[];
  onSaveFlashcard?: (input: CreateFlashcardInput) => void;
  onReviewFlashcard?: (cardId: string, rating: FlashcardRating) => void;
  onDeleteFlashcard?: (cardId: string) => void;
  /** Registros de questões com erros que ainda não geraram flashcard (sugestões, nunca criação automática). */
  questionDrafts?: FlashcardDraft[];
  todayDate?: string;
}

const MAX_VISIBLE_DRAFTS = 5;

const ERROR_CATEGORY_LABELS: Record<string, string> = {
  naoSabia: 'Não sabia a teoria',
  esqueci: 'Esqueci o conceito',
  interpretacao: 'Erro de interpretação',
  calculo: 'Erro de cálculo',
  desatencao: 'Desatenção / Pegadinha',
  chute: 'Chute sem certeza',
};

export function ErrorNotebookView({
  flashcards = [],
  subjects = [],
  onSaveFlashcard,
  onReviewFlashcard,
  onDeleteFlashcard,
  questionDrafts = [],
  todayDate,
}: ErrorNotebookViewProps) {
  const [viewMode, setViewMode] = useState<'deck' | 'catalog'>('deck');
  const [currentDeckIndex, setCurrentDeckIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Filtros do catálogo
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<ErrorFlashcardStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de novo card
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [newSubjectId, setNewSubjectId] = useState<string>(subjects[0]?.id || '');
  const [newTopicId, setNewTopicId] = useState<string>(subjects[0]?.topics[0]?.id || '');
  const [newStatement, setNewStatement] = useState<string>('');
  const [newBancaTrap, setNewBancaTrap] = useState<string>('');
  const [newCorrectConcept, setNewCorrectConcept] = useState<string>('');
  const [newErrorCategory, setNewErrorCategory] = useState<string>('desatencao');
  const [newQuestionId, setNewQuestionId] = useState<string | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('');

  const stats = calculateFlashcardDeckStats(flashcards, todayDate);
  const dueCards = getDueFlashcards(flashcards, todayDate);

  const activeCard = dueCards[currentDeckIndex] || null;

  const currentSubjectTopics = subjects.find(s => s.id === newSubjectId)?.topics || [];

  function handleSubjectChange(subjId: string) {
    setNewSubjectId(subjId);
    const sub = subjects.find(s => s.id === subjId);
    if (sub && sub.topics.length > 0) {
      setNewTopicId(sub.topics[0].id);
    } else {
      setNewTopicId('');
    }
  }

  function closeModal() {
    setModalOpen(false);
    setNewQuestionId(null);
  }

  function openDraft(draft: FlashcardDraft) {
    const subject = subjects.find(s => s.id === draft.subjectId) || subjects[0];
    if (!subject) return;
    const topic = subject.topics.find(t => t.id === draft.topicId) || subject.topics[0];
    setNewSubjectId(subject.id);
    setNewTopicId(topic?.id || '');
    setNewErrorCategory(
      draft.errorCategory && ERROR_CATEGORY_LABELS[draft.errorCategory]
        ? draft.errorCategory
        : 'desatencao'
    );
    setNewQuestionId(draft.questionId);
    setModalOpen(true);
  }

  function handleCreateCard() {
    if (!newStatement.trim() || !newCorrectConcept.trim()) return;

    if (onSaveFlashcard) {
      onSaveFlashcard({
        subjectId: newSubjectId,
        topicId: newTopicId,
        questionId: newQuestionId,
        statementSummary: newStatement,
        bancaTrap: newBancaTrap.trim() || undefined,
        correctConcept: newCorrectConcept,
        errorCategory: newErrorCategory,
        todayDate,
      });
    }

    setNewStatement('');
    setNewBancaTrap('');
    setNewCorrectConcept('');
    closeModal();
  }

  function handleAnswerRating(rating: FlashcardRating) {
    if (!activeCard) return;

    if (onReviewFlashcard) {
      onReviewFlashcard(activeCard.id, rating);
    }

    const ratingLabels: Record<FlashcardRating, string> = {
      again: 'Errei, agendado para amanhã',
      hard: 'Difícil, agendado para 2 dias',
      good: 'Bom, agendado para 4 dias',
      easy: 'Fácil, agendado para 7 dias ou mais',
    };
    setAriaAnnouncement(`Card avaliado: ${ratingLabels[rating]}.`);

    setIsRevealed(false);
    if (currentDeckIndex < dueCards.length - 1) {
      setCurrentDeckIndex(currentDeckIndex + 1);
    } else {
      setCurrentDeckIndex(0);
    }
  }

  function resolveSubjectName(id: string) {
    return subjects.find(s => s.id === id)?.name || 'Disciplina';
  }

  function resolveTopicName(subjId: string, topicId: string) {
    const s = subjects.find(item => item.id === subjId);
    return s?.topics.find(t => t.id === topicId)?.name || 'Tópico';
  }

  const catalogFiltered = filterFlashcards(flashcards, {
    subjectId: filterSubjectId === 'all' ? undefined : filterSubjectId,
    status: filterStatus,
    query: searchQuery,
  });

  return (
    <div class="space-y-6">
      {/* Anúncio acessível para leitores de tela */}
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {ariaAnnouncement}
      </div>

      {/* Cabeçalho do Caderno de Erros */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
        <div>
          <h2 class="text-xl font-semibold font-display text-primary m-0 flex items-center gap-2">
            <Icon name="book" size={20} class="text-primary shrink-0" />
            <span>Caderno de Erros Ativo &amp; Flashcards</span>
          </h2>
          <p class="text-sm text-secondary mt-1">
            Transforme suas questões incorretas em fixação imediata com repetição espaçada.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <div class="inline-flex rounded-default shadow-xs" role="group">
            <button
              type="button"
              class={`px-3 py-1.5 text-xs font-semibold rounded-l-md border border-border-default inline-flex items-center gap-1.5 ${
                viewMode === 'deck'
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-surface-card text-secondary hover:text-primary'
              }`}
              onClick={() => {
                setViewMode('deck');
                setIsRevealed(false);
              }}
            >
              <Icon name="cards" size={14} class="shrink-0" />
              <span>Deck ({stats.dueCount})</span>
            </button>
            <button
              type="button"
              class={`px-3 py-1.5 text-xs font-semibold rounded-r-md border-t border-b border-r border-border-default inline-flex items-center gap-1.5 ${
                viewMode === 'catalog'
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-surface-card text-secondary hover:text-primary'
              }`}
              onClick={() => setViewMode('catalog')}
            >
              <Icon name="file-text" size={14} class="shrink-0" />
              <span>Todos ({stats.total})</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="small"
            onClick={() => {
              if (subjects.length > 0 && !newSubjectId) {
                setNewSubjectId(subjects[0].id);
                setNewTopicId(subjects[0].topics[0]?.id || '');
              }
              setModalOpen(true);
            }}
          >
            + Novo Card
          </Button>
        </div>
      </div>

      {/* Sugestões: registros de questões com erros ainda sem flashcard */}
      {questionDrafts.length > 0 && (
        <section
          class="rounded-default border border-amber/30 bg-amber/5 p-3 text-xs space-y-2"
          aria-label="Erros registrados sem flashcard"
          data-testid="error-notebook-drafts"
        >
          <p class="m-0 font-semibold text-primary">
            {questionDrafts.length === 1
              ? '1 registro de questões com erros ainda não virou flashcard'
              : `${questionDrafts.length} registros de questões com erros ainda não viraram flashcard`}
          </p>
          <ul class="m-0 p-0 list-none space-y-1.5">
            {questionDrafts.slice(0, MAX_VISIBLE_DRAFTS).map(draft => (
              <li key={draft.questionId} class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-secondary">
                  {draft.date} · {resolveSubjectName(draft.subjectId)}
                  {draft.topicId
                    ? ` · ${resolveTopicName(draft.subjectId, draft.topicId)}`
                    : ''} · {draft.errorCount === 1 ? '1 erro' : `${draft.errorCount} erros`}
                </span>
                <Button variant="secondary" size="small" onClick={() => openDraft(draft)}>
                  Criar flashcard
                </Button>
              </li>
            ))}
          </ul>
          {questionDrafts.length > MAX_VISIBLE_DRAFTS && (
            <p class="m-0 text-muted">+{questionDrafts.length - MAX_VISIBLE_DRAFTS} registros</p>
          )}
        </section>
      )}

      {/* Resumo de Métricas do Deck */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div class="p-3 rounded-default border border-border-default bg-surface-card">
          <span class="text-secondary block font-medium">Revisões Hoje</span>
          <span class="text-lg font-semibold text-amber font-display mt-0.5 block">
            {stats.dueCount} cards
          </span>
        </div>
        <div class="p-3 rounded-default border border-border-default bg-surface-card">
          <span class="text-secondary block font-medium">Novos / Pendentes</span>
          <span class="text-lg font-semibold text-blue font-display mt-0.5 block">
            {stats.pendingCount}
          </span>
        </div>
        <div class="p-3 rounded-default border border-border-default bg-surface-card">
          <span class="text-secondary block font-medium">Em Fixação</span>
          <span class="text-lg font-semibold text-primary font-display mt-0.5 block">
            {stats.reviewingCount}
          </span>
        </div>
        <div class="p-3 rounded-default border border-border-default bg-surface-card">
          <span class="text-secondary block font-medium">Dominados</span>
          <span class="text-lg font-semibold text-green font-display mt-0.5 block">
            {stats.masteredCount}
          </span>
        </div>
      </div>

      {/* VISÃO 1: MODO DECK / ESTUDO INTERATIVO */}
      {viewMode === 'deck' && (
        <div class="space-y-4">
          {dueCards.length === 0 ? (
            <div class="text-center py-12 px-4 rounded-default border border-dashed border-border-default bg-surface-card">
              <h3 class="text-base font-semibold text-primary">Nenhum cartão para revisar hoje</h3>
              <p class="text-xs text-secondary max-w-md mx-auto mt-1">
                Adicione novas armadilhas de banca ou explore o catálogo completo.
              </p>
              <div class="mt-4">
                <Button variant="secondary" size="small" onClick={() => setViewMode('catalog')}>
                  Ver Catálogo Completo
                </Button>
              </div>
            </div>
          ) : activeCard ? (
            <div class="max-w-2xl mx-auto space-y-4">
              <div class="flex justify-between items-center text-xs text-secondary px-1">
                <span>
                  Card <strong class="text-primary">{currentDeckIndex + 1}</strong> de{' '}
                  <strong class="text-primary">{dueCards.length}</strong>
                </span>
                <span class="flex items-center gap-2">
                  <Badge variant="default">{resolveSubjectName(activeCard.subjectId)}</Badge>
                  <span class="text-muted">·</span>
                  <span>{resolveTopicName(activeCard.subjectId, activeCard.topicId)}</span>
                </span>
              </div>

              {/* CARD PRINCIPAL */}
              <div class="rounded-default border border-border-default bg-surface-card shadow-sm overflow-hidden">
                {/* Frente: Enunciado / Pergunta */}
                <div class="p-6 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold uppercase tracking-wider text-secondary">
                      Enunciado / Contexto da Questão
                    </span>
                    {activeCard.errorCategory && (
                      <span class="text-[11px] px-2 py-0.5 rounded bg-surface-subtle text-secondary font-medium">
                        {ERROR_CATEGORY_LABELS[activeCard.errorCategory] ||
                          activeCard.errorCategory}
                      </span>
                    )}
                  </div>
                  <p class="text-base font-medium text-primary leading-relaxed whitespace-pre-wrap">
                    {activeCard.statementSummary}
                  </p>
                </div>

                {/* Verso Revelado: Pegadinha e Conceito */}
                {isRevealed ? (
                  <div class="border-t border-border-default p-6 space-y-4 bg-surface-subtle">
                    {activeCard.bancaTrap && (
                      <div class="rounded-default p-3 bg-amber/10 border border-amber/20 text-xs">
                        <span class="font-semibold text-amber flex items-center gap-1.5 mb-1">
                          <Icon name="alert-triangle" size={14} class="shrink-0" />
                          <span>Pegadinha da Banca / Armadilha:</span>
                        </span>
                        <p class="text-primary leading-relaxed">{activeCard.bancaTrap}</p>
                      </div>
                    )}

                    <div class="rounded-default p-3 bg-green/10 border border-green/20 text-xs">
                      <span class="font-semibold text-green flex items-center gap-1.5 mb-1">
                        <Icon name="circle-check" size={14} class="shrink-0" />
                        <span>Conceito Correto / Fundamento:</span>
                      </span>
                      <p class="text-primary leading-relaxed whitespace-pre-wrap">
                        {activeCard.correctConcept}
                      </p>
                    </div>

                    {/* Ações de Avaliação Espaçada */}
                    <div class="pt-2">
                      <span class="block text-center text-xs text-secondary mb-2">
                        Como foi sua recuperação deste conceito?
                      </span>
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          class="px-3 py-2 text-xs font-medium rounded-default border border-red/30 bg-red/10 text-red hover:bg-red/20 transition-colors flex flex-col items-center gap-0.5"
                          onClick={() => handleAnswerRating('again')}
                        >
                          <span class="inline-flex items-center gap-1">
                            <Icon name="circle-x" size={13} class="shrink-0" />
                            <span>Errei</span>
                          </span>
                          <span class="block text-[10px] text-muted">1 dia</span>
                        </button>
                        <button
                          type="button"
                          class="px-3 py-2 text-xs font-medium rounded-default border border-amber/30 bg-amber/10 text-amber hover:bg-amber/20 transition-colors flex flex-col items-center gap-0.5"
                          onClick={() => handleAnswerRating('hard')}
                        >
                          <span class="inline-flex items-center gap-1">
                            <Icon name="alert-triangle" size={13} class="shrink-0" />
                            <span>Difícil</span>
                          </span>
                          <span class="block text-[10px] text-muted">2 dias</span>
                        </button>
                        <button
                          type="button"
                          class="px-3 py-2 text-xs font-medium rounded-default border border-blue/30 bg-blue/10 text-blue hover:bg-blue/20 transition-colors flex flex-col items-center gap-0.5"
                          onClick={() => handleAnswerRating('good')}
                        >
                          <span class="inline-flex items-center gap-1">
                            <Icon name="thumb-up" size={13} class="shrink-0" />
                            <span>Bom</span>
                          </span>
                          <span class="block text-[10px] text-muted">4 dias</span>
                        </button>
                        <button
                          type="button"
                          class="px-3 py-2 text-xs font-medium rounded-default border border-green/30 bg-green/10 text-green hover:bg-green/20 transition-colors flex flex-col items-center gap-0.5"
                          onClick={() => handleAnswerRating('easy')}
                        >
                          <span class="inline-flex items-center gap-1">
                            <Icon name="star" size={13} class="shrink-0" />
                            <span>Fácil</span>
                          </span>
                          <span class="block text-[10px] text-muted">7+ dias</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div class="border-t border-border-default p-4 bg-surface-subtle text-center">
                    <Button
                      variant="primary"
                      onClick={() => setIsRevealed(true)}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Icon name="search" size={14} class="shrink-0" />
                      <span>Revelar Pegadinha &amp; Resposta</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* VISÃO 2: CATÁLOGO COMPLETO DE FLASHCARDS */}
      {viewMode === 'catalog' && (
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div class="flex flex-wrap items-center gap-2">
              <select
                class="text-xs p-2 rounded border border-border-default bg-surface-card text-primary"
                value={filterSubjectId}
                onChange={e => setFilterSubjectId((e.target as HTMLSelectElement).value)}
                aria-label="Filtrar por disciplina"
              >
                <option value="all">Todas as disciplinas</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                class="text-xs p-2 rounded border border-border-default bg-surface-card text-primary"
                value={filterStatus}
                onChange={e => setFilterStatus((e.target as HTMLSelectElement).value as any)}
                aria-label="Filtrar por status"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendentes</option>
                <option value="reviewing">Em fixação</option>
                <option value="mastered">Dominados</option>
              </select>
            </div>

            <input
              type="text"
              class="text-xs p-2 rounded border border-border-default bg-surface-card text-primary w-full sm:w-64"
              placeholder="Buscar em enunciados e conceitos..."
              value={searchQuery}
              onInput={e => setSearchQuery((e.target as HTMLInputElement).value)}
              aria-label="Buscar flashcard"
            />
          </div>

          {catalogFiltered.length === 0 ? (
            <div class="text-center py-8 border border-dashed border-border-default rounded-default text-secondary text-xs">
              Nenhum flashcard encontrado com os filtros selecionados.
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {catalogFiltered.map(card => (
                <div
                  key={card.id}
                  class="p-4 rounded-default border border-border-default bg-surface-card space-y-2 relative group text-xs"
                >
                  <div class="flex justify-between items-start gap-2">
                    <span class="font-semibold text-primary">
                      {resolveSubjectName(card.subjectId)} ·{' '}
                      {resolveTopicName(card.subjectId, card.topicId)}
                    </span>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <span
                        class={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          card.status === 'mastered'
                            ? 'bg-green/20 text-green'
                            : card.status === 'pending'
                              ? 'bg-blue/20 text-blue'
                              : 'bg-amber/20 text-amber'
                        }`}
                      >
                        {card.status === 'mastered'
                          ? 'Dominado'
                          : card.status === 'pending'
                            ? 'Pendente'
                            : 'Em revisão'}
                      </span>
                      {onDeleteFlashcard && (
                        <button
                          type="button"
                          class="text-muted hover:text-red p-1"
                          onClick={() => onDeleteFlashcard(card.id)}
                          aria-label="Excluir flashcard"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <p class="text-primary font-medium">{card.statementSummary}</p>

                  {card.bancaTrap && (
                    <div class="p-2 rounded bg-amber/10 text-amber text-xs">
                      <strong>Pegadinha:</strong> {card.bancaTrap}
                    </div>
                  )}

                  <div class="p-2 rounded bg-green/10 text-green text-xs">
                    <strong>Fundamento:</strong> {card.correctConcept}
                  </div>

                  <div class="flex justify-between items-center text-xs text-muted pt-1 border-t border-border-subtle">
                    <span>Revisões: {card.reviewCount}</span>
                    <span>Próxima: {card.nextReviewDate || 'Hoje'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CRIAR NOVO CARD DE ERRO */}
      <Dialog open={modalOpen} onClose={closeModal} title="Novo Card de Erro & Flashcard">
        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-primary mb-1">Disciplina:</label>
              <select
                class="w-full p-2 rounded border border-border-default bg-surface-card text-primary text-xs"
                value={newSubjectId}
                onChange={e => handleSubjectChange((e.target as HTMLSelectElement).value)}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label class="block font-medium text-primary mb-1">Tópico:</label>
              <select
                class="w-full p-2 rounded border border-border-default bg-surface-card text-primary text-xs"
                value={newTopicId}
                onChange={e => setNewTopicId((e.target as HTMLSelectElement).value)}
                disabled={currentSubjectTopics.length === 0}
              >
                {currentSubjectTopics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label class="block font-medium text-primary mb-1">Motivo do Erro:</label>
            <select
              class="w-full p-2 rounded border border-border-default bg-surface-card text-primary text-xs"
              value={newErrorCategory}
              onChange={e => setNewErrorCategory((e.target as HTMLSelectElement).value)}
            >
              {Object.entries(ERROR_CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label class="block font-medium text-primary mb-1">
              Enunciado / Contexto da Questão:*
            </label>
            <textarea
              class="w-full h-20 p-2.5 rounded border border-border-default bg-surface-card text-primary text-xs focus:ring-primary focus:border-primary"
              placeholder="Ex.: Em contratos administrativos, a alteração unilateral quantitativa pode ultrapassar 25%?"
              value={newStatement}
              onInput={e => setNewStatement((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          <div>
            <label class="block font-medium text-amber mb-1">
              Pegadinha da Banca / Distrator (Opcional):
            </label>
            <textarea
              class="w-full h-16 p-2.5 rounded border border-amber/30 bg-amber/5 text-primary text-xs focus:ring-amber focus:border-amber"
              placeholder="Ex.: Confundir reforma de edifício (até 50%) com compras comuns de bens e serviços (limite de 25%)."
              value={newBancaTrap}
              onInput={e => setNewBancaTrap((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          <div>
            <label class="block font-medium text-green mb-1">Conceito Correto / Fundamento:*</label>
            <textarea
              class="w-full h-20 p-2.5 rounded border border-green/30 bg-green/5 text-primary text-xs focus:ring-green focus:border-green"
              placeholder="Ex.: Não, para compras comuns o limite é estrito em 25%. Apenas reformas admitem até 50% (Lei 14.133/21)."
              value={newCorrectConcept}
              onInput={e => setNewCorrectConcept((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-border-default">
            <Button variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCard}
              disabled={!newStatement.trim() || !newCorrectConcept.trim()}
            >
              Salvar Flashcard
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
