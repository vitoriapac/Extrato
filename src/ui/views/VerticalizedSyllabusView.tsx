import { useState } from 'preact/hooks';
import type { TopicBookmark, TopicStageChecklist, TopicStatus } from '../../core/types.js';
import {
  parseRawSyllabusText,
  type ParsedSyllabusSubject,
  type RawSyllabusParsedResult,
} from '../../application/subjects/raw-syllabus-parser.js';
import type { TopicEquivalenceRecord } from '../../core/types.js';
import type {
  PostEditalBlueprintSubjectLike,
  PostEditalQuestionLike,
  PostEditalSessionLike,
} from '../../domain/exams/post-edital-diff.js';
import { PostEditalDiffModal } from '../modals/PostEditalDiffModal.js';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';
import { buildPracticeLinks } from '../../domain/questions/practice-link-generator.js';
import { evaluateLawRecency } from '../../domain/analytics/law-recency.js';

export interface VerticalizedTopicItem {
  id: string;
  name: string;
  status?: TopicStatus | string;
  stageChecklist?: TopicStageChecklist | null;
  bookmark?: TopicBookmark | null;
  link?: string;
  customPracticeUrl?: string;
  lastLawReadAt?: string | null;
  legislativeUpdatePending?: boolean;
  legislativeUpdateNote?: string | null;
}

export interface VerticalizedSubjectItem {
  id: string;
  name: string;
  topics: VerticalizedTopicItem[];
}

export interface VerticalizedSyllabusViewProps {
  subjects: VerticalizedSubjectItem[];
  todayDate?: string;
  targetBanca?: string | null;
  onToggleStage?: (topicId: string, stage: keyof TopicStageChecklist, done: boolean) => void;
  onMarkLawRead?: (topicId: string) => void;
  onToggleLegislativeUpdate?: (topicId: string, pending: boolean) => void;
  onStartStudy?: (subjectId: string, topicId: string) => void;
  onOpenTopicIntelligence?: (subjectId: string, topicId: string) => void;
  onImportParsedSyllabus?: (result: RawSyllabusParsedResult) => void;
  postEditalContext?: {
    equivalences?: TopicEquivalenceRecord[];
    sessions?: PostEditalSessionLike[];
    questions?: PostEditalQuestionLike[];
    blueprintSubjects?: PostEditalBlueprintSubjectLike[];
    daysToExam?: number | null;
    weeklyAvailableMinutes?: number;
  };
}

export function VerticalizedSyllabusView({
  subjects = [],
  todayDate = '',
  targetBanca = null,
  onToggleStage,
  onMarkLawRead,
  onToggleLegislativeUpdate,
  onStartStudy,
  onOpenTopicIntelligence,
  onImportParsedSyllabus,
  postEditalContext,
}: VerticalizedSyllabusViewProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [postEditalOpen, setPostEditalOpen] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<RawSyllabusParsedResult | null>(null);

  const filteredSubjects =
    selectedSubjectId === 'all' ? subjects : subjects.filter(s => s.id === selectedSubjectId);

  const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0);

  function handleParseText() {
    const result = parseRawSyllabusText(rawText);
    setParsedPreview(result);
  }

  function handleConfirmImport() {
    if (parsedPreview && onImportParsedSyllabus) {
      onImportParsedSyllabus(parsedPreview);
      setImportModalOpen(false);
      setRawText('');
      setParsedPreview(null);
    }
  }

  return (
    <div class="verticalized-syllabus space-y-6">
      {/* Header e Filtros */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-card p-4 rounded-default border border-border-default">
        <div>
          <h3 class="text-base font-semibold text-primary flex items-center gap-2">
            <Icon name="clipboard-text" size={18} class="text-primary shrink-0" />
            <span>Edital Verticalizado Interativo</span>
          </h3>
          <p class="text-xs text-content-secondary mt-1">
            Acompanhe cada etapa de estudo (Teoria, Resumo, Lei Seca e Questões) por tópico do
            edital.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Seletor de Disciplina */}
          <select
            class="select-control min-h-control min-w-0 flex-1 sm:flex-initial text-xs py-2 px-3 rounded border border-border-control bg-surface-card text-content-primary"
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId((e.target as HTMLSelectElement).value)}
            aria-label="Filtrar por disciplina no edital verticalizado"
          >
            <option value="all">Todas as disciplinas ({totalTopics} tópicos)</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.topics.length})
              </option>
            ))}
          </select>

          {/* Botão de Importar do PDF */}
          <Button
            variant="tonal"
            className="text-xs shrink-0 inline-flex items-center gap-2"
            onClick={() => {
              setImportModalOpen(true);
              setParsedPreview(null);
            }}
          >
            <Icon name="file-text" size={14} class="shrink-0" />
            <span>Colar Edital (PDF)</span>
          </Button>
          <Button
            id="openPostEditalDiffBtn"
            data-testid="open-post-edital-diff"
            variant="ghost"
            className="text-xs shrink-0 inline-flex items-center gap-2"
            onClick={() => setPostEditalOpen(true)}
          >
            <Icon name="search" size={14} class="shrink-0" />
            <span>Raio-X Pós-Edital</span>
          </Button>
        </div>
      </div>

      {/* Tabela de Tópicos e Checklists */}
      {filteredSubjects.length === 0 || totalTopics === 0 ? (
        <div class="p-8 text-center rounded-default border border-border-subtle bg-surface-subtle text-secondary">
          <p class="font-medium">Nenhum tópico encontrado no edital.</p>
          <p class="text-xs text-muted mt-1">
            Cadastre disciplinas ou use o botão <strong>Colar Edital (PDF)</strong> para importar o
            conteúdo de uma vez.
          </p>
        </div>
      ) : (
        filteredSubjects.map(subject => (
          <div
            key={subject.id}
            class="rounded-default border border-border-default bg-surface-card overflow-hidden"
          >
            {/* Cabeçalho da Disciplina */}
            <div class="bg-surface-subtle px-4 py-3 border-b border-border-subtle flex justify-between items-center">
              <h4 class="font-semibold text-sm text-primary">{subject.name}</h4>
              <span class="text-xs text-secondary font-medium">
                {subject.topics.length} tópicos
              </span>
            </div>

            {/* Lista Vertical de Tópicos */}
            <div class="divide-y divide-border-subtle">
              {subject.topics.map((topic, index) => {
                const checklist = topic.stageChecklist || {};
                const customUrl =
                  topic.customPracticeUrl ||
                  topic.bookmark?.customPracticeUrl ||
                  (topic.link &&
                  (topic.link.includes('tecconcursos') || topic.link.includes('qconcursos'))
                    ? topic.link
                    : undefined);
                const practiceLinks = buildPracticeLinks({
                  topicName: topic.name,
                  subjectName: subject.name,
                  customUrl,
                });
                const lawStatus = todayDate
                  ? evaluateLawRecency(topic, todayDate, targetBanca)
                  : null;
                return (
                  <div
                    key={topic.id}
                    class="p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-surface-subtle/50 transition-colors"
                  >
                    {/* Tópico e Código */}
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-muted font-mono shrink-0">
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                        <span class="text-sm font-medium text-primary break-words">
                          {topic.name}
                        </span>
                      </div>
                      {topic.bookmark && (
                        <div class="text-xs text-secondary mt-1 flex items-center gap-1">
                          <Icon name="bookmark" size={12} class="shrink-0" />
                          <span>
                            {topic.bookmark.label || 'Marcador'}:{' '}
                            {topic.bookmark.currentUnit != null
                              ? `pág. ${topic.bookmark.currentUnit}`
                              : topic.bookmark.positionText || 'retomar'}
                          </span>
                        </div>
                      )}
                      {lawStatus && (lawStatus.lastLawReadAt || lawStatus.needsAttention || onMarkLawRead) && (
                        <div class="text-xs mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              lawStatus.legislativeUpdatePending
                                ? 'danger'
                                : lawStatus.isStale
                                  ? 'warning'
                                  : 'default'
                            }
                          >
                            {lawStatus.label}
                          </Badge>
                          {onMarkLawRead && (
                            <button
                              type="button"
                              class="min-h-[36px] inline-flex items-center text-xs underline text-content-secondary hover:text-content-primary cursor-pointer bg-transparent border-0 px-1 py-0"
                              onClick={() => onMarkLawRead(topic.id)}
                            >
                              Li a lei hoje
                            </button>
                          )}
                          {onToggleLegislativeUpdate && (
                            <button
                              type="button"
                              class="min-h-[36px] inline-flex items-center text-xs underline text-content-secondary hover:text-content-primary cursor-pointer bg-transparent border-0 px-1 py-0"
                              onClick={() =>
                                onToggleLegislativeUpdate(
                                  topic.id,
                                  !topic.legislativeUpdatePending
                                )
                              }
                            >
                              {topic.legislativeUpdatePending
                                ? 'Limpar alteração'
                                : 'Marcar alteração'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Checklists das 4 Etapas: inline no desktop, recolhido em mobile */}
                    <div class="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 text-xs">
                      <details class="md:hidden w-full">
                        <summary class="cursor-pointer select-none font-medium text-secondary py-1.5">
                          Etapas (
                          {[
                            checklist.theoryDone,
                            checklist.summaryDone,
                            checklist.lawOrNotesDone,
                            checklist.questionsDone,
                          ].filter(Boolean).length}
                          /4)
                        </summary>
                        <div class="flex flex-wrap gap-3 pt-2 pb-1">
                          {(
                            [
                              ['theoryDone', 'Teoria'],
                              ['summaryDone', 'Resumo'],
                              ['lawOrNotesDone', 'Lei Seca'],
                              ['questionsDone', 'Questões'],
                            ] as const
                          ).map(([key, label]) => (
                            <label
                              key={key}
                              class="inline-flex items-center gap-2 cursor-pointer text-secondary select-none min-h-[36px]"
                            >
                              <input
                                type="checkbox"
                                class="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                checked={Boolean(checklist[key])}
                                onChange={e =>
                                  onToggleStage?.(
                                    topic.id,
                                    key,
                                    (e.target as HTMLInputElement).checked
                                  )
                                }
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                      </details>

                      <div class="hidden md:flex items-center gap-4">
                        {(
                          [
                            ['theoryDone', 'Teoria'],
                            ['summaryDone', 'Resumo'],
                            ['lawOrNotesDone', 'Lei Seca'],
                            ['questionsDone', 'Questões'],
                          ] as const
                        ).map(([key, label]) => (
                          <label
                            key={key}
                            class="inline-flex items-center gap-2 cursor-pointer text-secondary select-none"
                          >
                            <input
                              type="checkbox"
                              class="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                              checked={Boolean(checklist[key])}
                              onChange={e =>
                                onToggleStage?.(
                                  topic.id,
                                  key,
                                  (e.target as HTMLInputElement).checked
                                )
                              }
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Status / Ações */}
                      <div class="flex flex-wrap items-center gap-2 md:pl-2 md:border-l border-border-subtle">
                        {topic.status === 'Concluído' ? (
                          <Badge variant="success">Concluído</Badge>
                        ) : topic.status === 'Revisão' ? (
                          <Badge variant="info">Revisão</Badge>
                        ) : topic.status === 'Em andamento' ? (
                          <Badge variant="warning">Em andamento</Badge>
                        ) : (
                          <Badge variant="default">Não iniciado</Badge>
                        )}

                        <details class="verticalized-more-actions relative">
                          <summary class="btn ghost small text-xs cursor-pointer select-none">
                            Recursos
                          </summary>
                          {/* Grupo de Questões TEC / QC */}
                          <div
                            class="inline-flex items-center rounded-default border border-border-default bg-surface-card overflow-hidden mt-1"
                            role="group"
                            aria-label={`Praticar questões de ${topic.name}`}
                          >
                            <a
                              href={practiceLinks.primaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="px-2 py-1 text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-subtle inline-flex items-center gap-1 no-underline transition-colors"
                              title={
                                practiceLinks.isCustom
                                  ? 'Abrir caderno personalizado configurado'
                                  : `Abrir caderno de ${topic.name} no TEC Concursos`
                            }
                            aria-label={`Praticar questões de ${topic.name} no ${
                              practiceLinks.isCustom ? 'caderno personalizado' : 'TEC Concursos'
                            } (abre em nova aba)`}
                          >
                            <Icon name="external-link" size={12} class="shrink-0 text-content-secondary" />
                            <span>{practiceLinks.isCustom ? 'Caderno' : 'TEC'}</span>
                          </a>
                          <span class="w-[1px] h-3 bg-border-subtle" />
                          <a
                            href={practiceLinks.qcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="px-2 py-1 text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-subtle inline-flex items-center no-underline transition-colors"
                            title={`Abrir questões de ${topic.name} no QConcursos`}
                            aria-label={`Praticar questões de ${topic.name} no QConcursos (abre em nova aba)`}
                          >
                            <span>QC</span>
                          </a>
                        </div>

                        {onOpenTopicIntelligence && (
                          <button
                            type="button"
                            class="min-h-[36px] px-2.5 py-1.5 rounded-default text-xs font-medium bg-surface-card hover:bg-surface-subtle border border-border-default transition-colors text-content-secondary hover:text-content-primary inline-flex items-center gap-1 cursor-pointer mt-1"
                            onClick={() => onOpenTopicIntelligence(subject.id, topic.id)}
                            aria-label={`Abrir Ficha Inteligente de ${topic.name}`}
                          >
                            <Icon name="file-text" size={12} />
                            <span>Ficha</span>
                          </button>
                        )}
                        </details>

                        <button
                          type="button"
                          class="min-h-[36px] px-3 py-1.5 rounded-default text-xs font-semibold bg-action-tonal-bg hover:bg-action-tonal-hover border border-border-subtle transition-colors text-action-tonal-text inline-flex items-center gap-1 cursor-pointer"
                          onClick={() => onStartStudy?.(subject.id, topic.id)}
                          aria-label={`Iniciar estudo de ${topic.name}`}
                        >
                          <Icon name="player-play" size={12} class="shrink-0" />
                          <span>Estudar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Modal de Importação de Edital Bruto (PDF/Texto) */}
      <Dialog
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Colar Conteúdo Programático do Edital (PDF)"
        maxWidth="lg"
      >
        <div class="space-y-4 text-sm">
          <p class="text-secondary leading-relaxed text-xs">
            Copie o texto das matérias e tópicos diretamente do PDF do edital e cole abaixo. O
            Extrato de Estudos identificará automaticamente as disciplinas e dividirá os tópicos numerados.
          </p>

          <div>
            <label for="rawSyllabusTextarea" class="block font-medium text-primary text-xs mb-1">
              Texto bruto do edital:
            </label>
            <textarea
              id="rawSyllabusTextarea"
              class="w-full h-44 p-3 rounded-default border border-border-default bg-surface-card text-primary font-mono text-xs focus:ring-primary focus:border-primary"
              placeholder={`DIREITO CONSTITUCIONAL: 1. Princípios fundamentais. 2. Direitos e deveres individuais. 2.1 Direitos sociais. 3. Organização do Estado.\n\nDIREITO ADMINISTRATIVO: 1. Introdução. 1.1 Regime jurídico. 2. Atos administrativos.`}
              value={rawText}
              onInput={e => setRawText((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          <div class="flex justify-between items-center">
            <Button
              variant="tonal"
              onClick={handleParseText}
              disabled={!rawText.trim()}
              className="inline-flex items-center gap-2"
            >
              <Icon name="search" size={14} class="shrink-0" />
              <span>Analisar Texto</span>
            </Button>

            {parsedPreview && (
              <span class="text-xs text-secondary font-medium">
                {parsedPreview.totalSubjects} matérias · {parsedPreview.totalTopics} tópicos
                encontrados
              </span>
            )}
          </div>

          {/* Prévia dos Dados Analisados */}
          {parsedPreview && (
            <div class="rounded-default bg-surface-subtle p-3 border border-border-subtle max-h-52 overflow-y-auto space-y-2 text-xs">
              <h5 class="font-semibold text-content-primary">Prévia da Estrutura:</h5>
              {parsedPreview.warnings?.length > 0 && (
                <div
                  class="rounded border border-border-default bg-surface-card p-2 text-xs text-amber"
                  role="status"
                >
                  <strong>Avisos do leitor:</strong>{' '}
                  {parsedPreview.warnings.join(' · ')}
                </div>
              )}
              {parsedPreview.subjects.map((sub, i) => (
                <div key={i} class="space-y-1">
                  <div class="font-semibold text-primary">
                    {sub.name} ({sub.topics.length} tópicos)
                  </div>
                  <ul class="pl-4 list-disc text-secondary space-y-1">
                    {sub.topics.slice(0, 5).map((top, j) => (
                      <li key={j}>
                        {top.code ? `${top.code} ` : ''}
                        {top.name}
                      </li>
                    ))}
                    {sub.topics.length > 5 && (
                      <li class="text-muted italic">+ {sub.topics.length - 5} tópicos...</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Ações do Modal */}
          <div class="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button variant="ghost" onClick={() => setImportModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={!parsedPreview || parsedPreview.totalTopics === 0}
              onClick={handleConfirmImport}
            >
              Confirmar e Criar Tópicos
            </Button>
          </div>
        </div>
      </Dialog>

      <PostEditalDiffModal
        open={postEditalOpen}
        onClose={() => setPostEditalOpen(false)}
        existingSubjects={subjects}
        equivalences={postEditalContext?.equivalences}
        sessions={postEditalContext?.sessions}
        questions={postEditalContext?.questions}
        blueprintSubjects={postEditalContext?.blueprintSubjects}
        daysToExam={postEditalContext?.daysToExam}
        weeklyAvailableMinutes={postEditalContext?.weeklyAvailableMinutes}
        onImportDeltaTopics={(deltaSubjects: ParsedSyllabusSubject[]) => {
          onImportParsedSyllabus?.({
            subjects: deltaSubjects,
            totalSubjects: deltaSubjects.length,
            totalTopics: deltaSubjects.reduce((sum, s) => sum + s.topics.length, 0),
            warnings: [],
          });
        }}
      />
    </div>
  );
}
