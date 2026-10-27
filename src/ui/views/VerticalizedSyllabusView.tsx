import { useState } from 'preact/hooks';
import type { TopicBookmark, TopicStageChecklist, TopicStatus } from '../../core/types.js';
import {
  parseRawSyllabusText,
  type RawSyllabusParsedResult,
} from '../../application/subjects/raw-syllabus-parser.js';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';

export interface VerticalizedTopicItem {
  id: string;
  name: string;
  status?: TopicStatus | string;
  stageChecklist?: TopicStageChecklist | null;
  bookmark?: TopicBookmark | null;
}

export interface VerticalizedSubjectItem {
  id: string;
  name: string;
  topics: VerticalizedTopicItem[];
}

export interface VerticalizedSyllabusViewProps {
  subjects: VerticalizedSubjectItem[];
  onToggleStage?: (topicId: string, stage: keyof TopicStageChecklist, done: boolean) => void;
  onStartStudy?: (subjectId: string, topicId: string) => void;
  onImportParsedSyllabus?: (result: RawSyllabusParsedResult) => void;
}

export function VerticalizedSyllabusView({
  subjects = [],
  onToggleStage,
  onStartStudy,
  onImportParsedSyllabus,
}: VerticalizedSyllabusViewProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
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
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-card p-4 rounded-lg border border-border-default shadow-xs">
        <div>
          <h3 class="text-base font-bold text-primary flex items-center gap-2">
            <span>📑</span> Edital Verticalizado Interativo
          </h3>
          <p class="text-xs text-secondary mt-0.5">
            Acompanhe cada etapa de estudo (Teoria, Resumo, Lei Seca e Questões) por tópico do
            edital.
          </p>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          {/* Seletor de Disciplina */}
          <select
            class="select-control text-xs py-1.5 px-3 rounded border border-border-default bg-surface-card text-primary"
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
            variant="secondary"
            className="text-xs shrink-0 flex items-center gap-1.5"
            onClick={() => {
              setImportModalOpen(true);
              setParsedPreview(null);
            }}
          >
            <span>📋</span> Colar Edital (PDF)
          </Button>
        </div>
      </div>

      {/* Tabela de Tópicos e Checklists */}
      {filteredSubjects.length === 0 || totalTopics === 0 ? (
        <div class="p-8 text-center rounded-lg border border-border-subtle bg-surface-subtle text-secondary">
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
            class="rounded-lg border border-border-default bg-surface-card shadow-xs overflow-hidden"
          >
            {/* Cabeçalho da Disciplina */}
            <div class="bg-surface-subtle px-4 py-3 border-b border-border-subtle flex justify-between items-center">
              <h4 class="font-bold text-sm text-primary">{subject.name}</h4>
              <span class="text-xs text-secondary font-medium">
                {subject.topics.length} tópicos
              </span>
            </div>

            {/* Lista Vertical de Tópicos */}
            <div class="divide-y divide-border-subtle">
              {subject.topics.map((topic, index) => {
                const checklist = topic.stageChecklist || {};
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
                          <span>🔖</span>
                          <span>
                            {topic.bookmark.label || 'Marcador'}:{' '}
                            {topic.bookmark.currentUnit != null
                              ? `pág. ${topic.bookmark.currentUnit}`
                              : topic.bookmark.positionText || 'retomar'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Checklists das 4 Etapas */}
                    <div class="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 text-xs">
                      {/* Teoria */}
                      <label class="inline-flex items-center gap-1.5 cursor-pointer text-secondary select-none">
                        <input
                          type="checkbox"
                          class="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          checked={Boolean(checklist.theoryDone)}
                          onChange={e =>
                            onToggleStage?.(
                              topic.id,
                              'theoryDone',
                              (e.target as HTMLInputElement).checked
                            )
                          }
                        />
                        <span>Teoria</span>
                      </label>

                      {/* Resumo */}
                      <label class="inline-flex items-center gap-1.5 cursor-pointer text-secondary select-none">
                        <input
                          type="checkbox"
                          class="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          checked={Boolean(checklist.summaryDone)}
                          onChange={e =>
                            onToggleStage?.(
                              topic.id,
                              'summaryDone',
                              (e.target as HTMLInputElement).checked
                            )
                          }
                        />
                        <span>Resumo</span>
                      </label>

                      {/* Lei / Notas */}
                      <label class="inline-flex items-center gap-1.5 cursor-pointer text-secondary select-none">
                        <input
                          type="checkbox"
                          class="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          checked={Boolean(checklist.lawOrNotesDone)}
                          onChange={e =>
                            onToggleStage?.(
                              topic.id,
                              'lawOrNotesDone',
                              (e.target as HTMLInputElement).checked
                            )
                          }
                        />
                        <span>Lei Seca</span>
                      </label>

                      {/* Questões */}
                      <label class="inline-flex items-center gap-1.5 cursor-pointer text-secondary select-none">
                        <input
                          type="checkbox"
                          class="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          checked={Boolean(checklist.questionsDone)}
                          onChange={e =>
                            onToggleStage?.(
                              topic.id,
                              'questionsDone',
                              (e.target as HTMLInputElement).checked
                            )
                          }
                        />
                        <span>Questões</span>
                      </label>

                      {/* Status / Ação */}
                      <div class="flex items-center gap-2 pl-2 border-l border-border-subtle">
                        {topic.status === 'Concluído' ? (
                          <Badge variant="success">Dominado</Badge>
                        ) : (
                          <Badge variant="default">Em estudo</Badge>
                        )}

                        <button
                          type="button"
                          class="px-2.5 py-1 rounded text-xs font-semibold bg-surface-subtle hover:bg-primary hover:text-white border border-border-default transition-colors text-primary"
                          onClick={() => onStartStudy?.(subject.id, topic.id)}
                          aria-label={`Iniciar estudo de ${topic.name}`}
                        >
                          ▶ Estudar
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
            StudyTrack identificará automaticamente as disciplinas e dividirá os tópicos numerados.
          </p>

          <div>
            <label class="block font-medium text-primary text-xs mb-1">
              Texto bruto do edital:
            </label>
            <textarea
              class="w-full h-44 p-3 rounded border border-border-default bg-surface-card text-primary font-mono text-xs focus:ring-primary focus:border-primary"
              placeholder={`DIREITO CONSTITUCIONAL: 1. Princípios fundamentais. 2. Direitos e deveres individuais. 2.1 Direitos sociais. 3. Organização do Estado.\n\nDIREITO ADMINISTRATIVO: 1. Introdução. 1.1 Regime jurídico. 2. Atos administrativos.`}
              value={rawText}
              onInput={e => setRawText((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          <div class="flex justify-between items-center">
            <Button variant="secondary" onClick={handleParseText} disabled={!rawText.trim()}>
              🔍 Analisar Texto
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
            <div class="rounded-lg bg-surface-subtle p-3 border border-border-subtle max-h-52 overflow-y-auto space-y-2 text-xs">
              <h5 class="font-bold text-primary">Prévia da Estrutura:</h5>
              {parsedPreview.subjects.map((sub, i) => (
                <div key={i} class="space-y-1">
                  <div class="font-semibold text-primary">
                    {sub.name} ({sub.topics.length} tópicos)
                  </div>
                  <ul class="pl-4 list-disc text-secondary space-y-0.5">
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
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>
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
    </div>
  );
}
