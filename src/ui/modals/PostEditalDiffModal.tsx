import { useState } from 'preact/hooks';
import {
  parseRawSyllabusText,
  type ParsedSyllabusSubject,
} from '../../application/subjects/raw-syllabus-parser.js';
import {
  buildPostEditalDiff,
  type PostEditalBlueprintSubjectLike,
  type PostEditalDiffResult,
  type PostEditalExistingSubject,
  type PostEditalQuestionLike,
  type PostEditalSessionLike,
} from '../../domain/exams/post-edital-diff.js';
import type { TopicEquivalenceRecord } from '../../core/types.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';
import { Icon } from '../primitives/icon.js';

export interface PostEditalDiffModalProps {
  open: boolean;
  onClose: () => void;
  existingSubjects: PostEditalExistingSubject[];
  equivalences?: TopicEquivalenceRecord[];
  sessions?: PostEditalSessionLike[];
  questions?: PostEditalQuestionLike[];
  blueprintSubjects?: PostEditalBlueprintSubjectLike[];
  daysToExam?: number | null;
  weeklyAvailableMinutes?: number;
  onImportDeltaTopics?: (subjects: ParsedSyllabusSubject[]) => void;
}

export function PostEditalDiffModal({
  open,
  onClose,
  existingSubjects = [],
  equivalences = [],
  sessions = [],
  questions = [],
  blueprintSubjects = [],
  daysToExam = null,
  weeklyAvailableMinutes = 1200,
  onImportDeltaTopics,
}: PostEditalDiffModalProps) {
  const [rawText, setRawText] = useState('');
  const [diff, setDiff] = useState<PostEditalDiffResult | null>(null);

  const handleAnalyze = () => {
    const parsed = parseRawSyllabusText(rawText);
    const result = buildPostEditalDiff({
      incomingSubjects: parsed.subjects,
      existingSubjects,
      equivalences,
      sessions,
      questions,
      blueprintSubjects,
      daysToExam,
      weeklyAvailableMinutes,
    });
    setDiff(result);
  };

  const handleImportDelta = () => {
    if (!diff || !diff.deltaNew.length || !onImportDeltaTopics) return;
    const bySubject = new Map<string, ParsedSyllabusSubject>();
    for (const item of diff.deltaNew) {
      if (!bySubject.has(item.subjectName)) {
        bySubject.set(item.subjectName, { name: item.subjectName, topics: [] });
      }
      bySubject.get(item.subjectName)!.topics.push({
        name: item.incomingTopicName,
        ...(item.code ? { code: item.code } : {}),
      });
    }
    onImportDeltaTopics([...bySubject.values()]);
    setRawText('');
    setDiff(null);
    onClose();
  };

  return (
    <Dialog
      id="postEditalDiffOverlay"
      open={open}
      onClose={onClose}
      title="Raio-X Pós-Edital (Simulação em Memória)"
      description="Compare o novo edital publicado com sua bagagem atual sem alterar seus dados."
      maxWidth="2xl"
    >
      <div class="space-y-4 text-sm">
        <div>
          <label
            htmlFor="postEditalDiffTextarea"
            class="block text-xs font-medium text-primary mb-1"
          >
            Cole o texto do novo edital (aceita FGV separado por ponto e vírgula ou Cebraspe/FCC numerado)
          </label>
          <textarea
            id="postEditalDiffTextarea"
            class="w-full h-36 p-3 rounded-default border border-border-default bg-surface-card text-primary font-mono text-xs"
            placeholder={'DIREITO ADMINISTRATIVO:\nAtos administrativos; Lei nº 8.112/1990; Processo administrativo (Lei nº 9.784/1999).'}
            value={rawText}
            onInput={e => setRawText((e.currentTarget as HTMLTextAreaElement).value)}
          />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <Button
            id="postEditalDiffAnalyzeBtn"
            type="button"
            variant="secondary"
            disabled={!rawText.trim()}
            onClick={handleAnalyze}
          >
            <Icon name="search" size={14} class="icon-inline" />
            Comparar com minha bagagem
          </Button>
          {diff && diff.viable !== null && (
            <Badge variant={diff.viable ? 'success' : 'warning'}>
              {diff.viable
                ? `Viável até D-15 (${diff.deltaEstimatedHours}h vs ${diff.availableHoursUntilD15}h livres)`
                : `Acima da capacidade até D-15 (${diff.deltaEstimatedHours}h vs ${diff.availableHoursUntilD15}h livres)`}
            </Badge>
          )}
        </div>

        {diff && (
          <div class="space-y-3" data-testid="post-edital-diff-results">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="p-3 rounded-default border border-border-subtle bg-surface-subtle">
                <div class="text-xs text-content-secondary">Aproveitamento da bagagem</div>
                <strong class="text-lg text-content-primary">{diff.baggageReusePercent}%</strong>
                <div class="text-xs text-content-secondary">
                  {diff.coveredCount} de {diff.totalIncomingTopics} tópicos já estudados ·{' '}
                  <strong>{diff.masteredReusePercent}%</strong> já dominados (&ge; 75%)
                </div>
              </div>
              <div class="p-3 rounded-default border border-border-subtle bg-surface-subtle">
                <div class="text-xs text-content-secondary">Equivalências candidatas</div>
                <strong class="text-lg text-content-primary">{diff.equivalentCandidateCount}</strong>
                <div class="text-xs text-content-secondary">
                  Temas similares para vincular histórico
                </div>
              </div>
              <div class="p-3 rounded-default border border-border-subtle bg-surface-subtle">
                <div class="text-xs text-content-secondary">Delta pós-edital (inéditos)</div>
                <strong class="text-lg text-content-primary">{diff.deltaNewCount}</strong>
                <div class="text-xs text-content-secondary">
                  Carga estimada: ~{diff.deltaEstimatedHours}h
                </div>
              </div>
            </div>

            {diff.equivalentCandidates.length > 0 && (
              <details class="rounded-default border border-border-subtle bg-surface-card p-3 text-xs">
                <summary class="font-semibold cursor-pointer">
                  Candidatos de equivalência ({diff.equivalentCandidates.length})
                </summary>
                <ul class="mt-2 space-y-1 pl-4 list-disc">
                  {diff.equivalentCandidates.slice(0, 12).map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.incomingTopicName}</strong> ({item.subjectName}) ≈{' '}
                      <span>{item.matchedTopicName}</span> ({item.matchedSubjectName} ·{' '}
                      {Math.round(item.similarityScore * 100)}%)
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {diff.deltaNew.length > 0 && (
              <details class="rounded-default border border-border-subtle bg-surface-card p-3 text-xs" open>
                <summary class="font-semibold cursor-pointer">
                  Tópicos 100% novos no pós-edital ({diff.deltaNew.length})
                </summary>
                <ul class="mt-2 space-y-1 pl-4 list-disc max-h-40 overflow-y-auto">
                  {diff.deltaNew.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.subjectName}:</strong> {item.incomingTopicName}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div class="flex flex-wrap justify-end gap-2 pt-2 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          {onImportDeltaTopics && diff && diff.deltaNew.length > 0 && (
            <Button
              id="postEditalImportDeltaBtn"
              type="button"
              variant="primary"
              onClick={handleImportDelta}
            >
              Adicionar apenas os {diff.deltaNew.length} tópicos novos
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
