import type { JSX } from 'preact';
import { BottomSheet } from '../primitives/bottom-sheet.js';
import { Button } from '../primitives/button.js';
import { SelectField, type SelectOption } from '../primitives/select-field.js';

export interface SessionBookmarkViewState {
  hidden: boolean;
  open: boolean;
  clearMarked: boolean;
  clearBtnHidden: boolean;
  resourceType: string;
  label: string;
  currentUnit: string;
  totalUnits: string;
  positionText: string;
}

export interface SessionModalSheetProps {
  open: boolean;
  sessionKey: number;
  restoreFocusOnClose?: boolean;
  activityHint: string;
  durationFormatted: string;
  durationMinutesValue: string;
  durationMinutesPlaceholder: string;
  subjectOptions: SelectOption[];
  topicOptions: SelectOption[];
  subjectId: string;
  topicId: string;
  activityType: string;
  resolvedValue: string;
  correctValue: string;
  pagesReadValue: string;
  videoBlocksValue: string;
  difficultyValue: string;
  retentionValue: string;
  focusValue: string;
  energyValue: string;
  optionalOpen: boolean;
  notesValue: string;
  bookmark: SessionBookmarkViewState;
  onDurationMinutesChange: (value: string) => void;
  onSubjectChange: (subjectId: string) => void;
  onTopicChange: (topicId: string) => void;
  onActivityTypeChange: (type: string) => void;
  onResolvedChange: (value: string) => void;
  onCorrectChange: (value: string) => void;
  onPagesReadChange: (value: string) => void;
  onVideoBlocksChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onRetentionChange: (value: string) => void;
  onFocusChange: (value: string) => void;
  onEnergyChange: (value: string) => void;
  onOptionalToggle: (open: boolean) => void;
  onNotesChange: (value: string) => void;
  onBookmarkFieldChange: (
    field: 'resourceType' | 'label' | 'currentUnit' | 'totalUnits' | 'positionText',
    value: string
  ) => void;
  onBookmarkToggle: (open: boolean) => void;
  onBookmarkClear: () => void;
  onSkip: () => void;
  onDismiss: () => void;
  onSave: () => void;
}

const ACTIVITY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'study', label: 'Estudo teórico' },
  { value: 'review', label: 'Revisão' },
  { value: 'questions', label: 'Questões' },
  { value: 'simulation', label: 'Simulado' },
];

const DIFFICULTY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Ainda não avaliada' },
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Média' },
  { value: 'hard', label: 'Difícil' },
];

const RETENTION_OPTIONS: SelectOption[] = [
  { value: '', label: 'Ainda não avaliada' },
  { value: 'easy', label: 'Lembrei com facilidade' },
  { value: 'effortful', label: 'Lembrei com esforço' },
  { value: 'unable', label: 'Não consegui recuperar' },
];

const BOOKMARK_RESOURCE_OPTIONS: SelectOption[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'video', label: 'Videoaula' },
  { value: 'law', label: 'Lei seca' },
  { value: 'other', label: 'Outro' },
];

const FOCUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Não informado' },
  { value: 'deep', label: 'Profundo' },
  { value: 'normal', label: 'Normal' },
  { value: 'distracted', label: 'Distraído' },
];

const ENERGY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Não informado' },
  { value: 'high', label: 'Alta' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Cansado' },
];

export function SessionModalSheet({
  open,
  sessionKey,
  restoreFocusOnClose = true,
  activityHint,
  durationFormatted,
  durationMinutesValue,
  durationMinutesPlaceholder,
  subjectOptions,
  topicOptions,
  subjectId,
  topicId,
  activityType,
  resolvedValue,
  correctValue,
  pagesReadValue,
  videoBlocksValue,
  difficultyValue,
  retentionValue,
  focusValue,
  energyValue,
  optionalOpen,
  notesValue,
  bookmark,
  onDurationMinutesChange,
  onSubjectChange,
  onTopicChange,
  onActivityTypeChange,
  onResolvedChange,
  onCorrectChange,
  onPagesReadChange,
  onVideoBlocksChange,
  onDifficultyChange,
  onRetentionChange,
  onFocusChange,
  onEnergyChange,
  onOptionalToggle,
  onNotesChange,
  onBookmarkFieldChange,
  onBookmarkToggle,
  onBookmarkClear,
  onSkip,
  onDismiss,
  onSave,
}: SessionModalSheetProps): JSX.Element {
  const hasFieldGroup = (groups: string) => groups.split(/\s+/).includes(activityType || 'study');

  return (
    <BottomSheet
      id="sessionModalOverlay"
      open={open}
      onClose={onDismiss}
      restoreFocusOnClose={restoreFocusOnClose}
      maxWidth="lg"
      title="Confirmar depósito de estudo"
      titleId="sessionModalTitle"
      description={activityHint}
      descriptionId="sessionModalActivityHint"
      className={open ? 'show' : ''}
      onKeyDown={event => {
        const tag = (event.target as HTMLElement | null)?.tagName;
        if (event.key === 'Enter' && !['TEXTAREA', 'BUTTON', 'SUMMARY', 'A'].includes(tag || '')) {
          event.preventDefault();
          onSave();
        }
      }}
      footer={
        <>
          <Button id="sessionModalSkipBtn" variant="ghost" size="small" onClick={onSkip}>
            Descartar sessão
          </Button>
          <Button
            id="sessionModalSaveBtn"
            variant="primary"
            className="modal-primary-action"
            onClick={onSave}
          >
            Salvar sessão
          </Button>
        </>
      }
    >
      <div key={sessionKey} class="min-w-0">
        <div class="session-modal-duration-row">
          <p class="session-modal-duration">
            Tempo registrado: <strong id="sessionModalDuration">{durationFormatted}</strong>
          </p>
          <label class="session-modal-duration-adjust" htmlFor="sessionModalDurationMinutes">
            <span>Ajustar (min)</span>
            <input
              class="session-detail-control"
              type="number"
              id="sessionModalDurationMinutes"
              aria-label="Duração em minutos"
              min={1}
              max={720}
              step={1}
              placeholder={durationMinutesPlaceholder}
              value={durationMinutesValue}
              onInput={e => onDurationMinutesChange(e.currentTarget.value)}
            />
          </label>
        </div>

        <div class="session-modal-fields">
          <SelectField
            id="sessionModalSubject"
            label="Disciplina"
            aria-label="Disciplina da sessão"
            fullWidth
            options={subjectOptions}
            value={subjectId}
            onChange={e => onSubjectChange(e.currentTarget.value)}
          />

          <SelectField
            id="sessionModalTopic"
            label="Tópico"
            aria-label="Tópico da sessão"
            fullWidth
            options={topicOptions}
            value={topicId}
            onChange={e => onTopicChange(e.currentTarget.value)}
          />

          <SelectField
            id="sessionModalType"
            label="Atividade"
            aria-label="Tipo da sessão"
            fullWidth
            options={ACTIVITY_TYPE_OPTIONS}
            value={activityType}
            onChange={e => onActivityTypeChange(e.currentTarget.value)}
          />

          <section
            class="session-activity-fields"
            data-session-fields="questions"
            hidden={!hasFieldGroup('questions')}
            aria-labelledby="sessionQuestionsTitle"
          >
            <h4 id="sessionQuestionsTitle">Resultado das questões</h4>
            <div class="session-question-fields">
              <label htmlFor="sessionModalResolved">
                Questões resolvidas
                <input
                  class="session-detail-control"
                  type="number"
                  id="sessionModalResolved"
                  aria-label="Questões resolvidas"
                  placeholder="Quantidade"
                  min={0}
                  inputMode="numeric"
                  value={resolvedValue}
                  onInput={e => onResolvedChange(e.currentTarget.value)}
                />
              </label>
              <label htmlFor="sessionModalCorrect">
                Acertos
                <input
                  class="session-detail-control"
                  type="number"
                  id="sessionModalCorrect"
                  aria-label="Quantidade de acertos"
                  placeholder="Quantidade"
                  min={0}
                  inputMode="numeric"
                  value={correctValue}
                  onInput={e => onCorrectChange(e.currentTarget.value)}
                />
              </label>
            </div>
            <small>Os erros são calculados pela diferença entre questões e acertos.</small>
          </section>

          <section
            class="session-activity-fields"
            data-session-fields="study"
            hidden={!hasFieldGroup('study')}
            aria-labelledby="sessionTheoryProgressTitle"
          >
            <h4 id="sessionTheoryProgressTitle">Avanço teórico (opcional)</h4>
            <div class="session-question-fields">
              <label htmlFor="sessionModalPagesRead">
                Páginas lidas
                <input
                  class="session-detail-control"
                  type="number"
                  id="sessionModalPagesRead"
                  aria-label="Páginas lidas nesta sessão"
                  placeholder="Quantidade"
                  min={0}
                  inputMode="numeric"
                  value={pagesReadValue}
                  onInput={e => onPagesReadChange(e.currentTarget.value)}
                />
              </label>
              <label htmlFor="sessionModalVideoBlocks">
                Blocos de aula
                <input
                  class="session-detail-control"
                  type="number"
                  id="sessionModalVideoBlocks"
                  aria-label="Blocos de videoaula assistidos"
                  placeholder="Quantidade"
                  min={0}
                  inputMode="numeric"
                  value={videoBlocksValue}
                  onInput={e => onVideoBlocksChange(e.currentTarget.value)}
                />
              </label>
            </div>
            <small>Acompanhe seu avanço em leitura de PDFs e blocos de videoaula.</small>
          </section>

          <section
            class="session-activity-fields"
            data-session-fields="study questions"
            hidden={!hasFieldGroup('study questions')}
            aria-labelledby="sessionDifficultyTitle"
          >
            <h4 id="sessionDifficultyTitle">Percepção do esforço</h4>
            <SelectField
              id="sessionModalDifficulty"
              label="Dificuldade percebida"
              aria-label="Dificuldade percebida na sessão"
              fullWidth
              options={DIFFICULTY_OPTIONS}
              value={difficultyValue}
              onChange={e => onDifficultyChange(e.currentTarget.value)}
            />
          </section>

          <section
            class="session-activity-fields"
            data-session-fields="review"
            hidden={!hasFieldGroup('review')}
            aria-labelledby="sessionReviewTitle"
          >
            <h4 id="sessionReviewTitle">Como estava sua retenção?</h4>
            <SelectField
              id="sessionModalRetention"
              label="Percepção ao recuperar o conteúdo"
              aria-label="Retenção percebida na revisão"
              fullWidth
              options={RETENTION_OPTIONS}
              value={retentionValue}
              onChange={e => onRetentionChange(e.currentTarget.value)}
            />
          </section>

          <details
            class="session-activity-fields session-bookmark-fields"
            id="sessionBookmarkSection"
            hidden={bookmark.hidden}
            open={bookmark.open}
            data-clear={bookmark.clearMarked ? '1' : undefined}
            onToggle={e => onBookmarkToggle(e.currentTarget.open)}
          >
            <summary>Onde você parou?</summary>
            <SelectField
              id="sessionBookmarkType"
              label="Material"
              aria-label="Tipo do material"
              fullWidth
              options={BOOKMARK_RESOURCE_OPTIONS}
              value={bookmark.resourceType}
              onChange={e => onBookmarkFieldChange('resourceType', e.currentTarget.value)}
            />
            <label htmlFor="sessionBookmarkLabel">
              Nome do material
              <input
                class="session-detail-control"
                type="text"
                id="sessionBookmarkLabel"
                maxLength={120}
                placeholder="Ex.: Aula 03 - SFN.pdf"
                value={bookmark.label}
                onInput={e => onBookmarkFieldChange('label', e.currentTarget.value)}
              />
            </label>
            <div class="session-question-fields">
              <label htmlFor="sessionBookmarkCurrent">
                Página ou aula
                <input
                  class="session-detail-control"
                  type="number"
                  id="sessionBookmarkCurrent"
                  min={0}
                  inputMode="numeric"
                  placeholder="Ex.: 42"
                  value={bookmark.currentUnit}
                  onInput={e => onBookmarkFieldChange('currentUnit', e.currentTarget.value)}
                />
              </label>
              <label htmlFor="sessionBookmarkTotal">
                Total
                <input
                  class="session-detail-control"
                  type="number"
                  id="sessionBookmarkTotal"
                  min={0}
                  inputMode="numeric"
                  placeholder="Ex.: 110"
                  value={bookmark.totalUnits}
                  onInput={e => onBookmarkFieldChange('totalUnits', e.currentTarget.value)}
                />
              </label>
            </div>
            <label htmlFor="sessionBookmarkPosition">
              Posição
              <input
                class="session-detail-control"
                type="text"
                id="sessionBookmarkPosition"
                maxLength={60}
                placeholder="Ex.: 18m30s ou Art. 37, § 6º"
                value={bookmark.positionText}
                onInput={e => onBookmarkFieldChange('positionText', e.currentTarget.value)}
              />
            </label>
            <Button
              id="sessionBookmarkClearBtn"
              variant="ghost"
              size="small"
              hidden={bookmark.clearBtnHidden}
              disabled={bookmark.clearMarked}
              onClick={onBookmarkClear}
            >
              {bookmark.clearMarked ? 'Será removido ao salvar' : 'Limpar ponto de parada'}
            </Button>
          </details>

          <p
            class="session-activity-fields session-simulation-hint"
            data-session-fields="simulation"
            hidden={!hasFieldGroup('simulation')}
          >
            Depois de salvar o tempo, você irá para Simulados para registrar nota e desempenho por
            disciplina.
          </p>

          <details
            class="session-optional-fields"
            id="sessionOptionalFields"
            open={optionalOpen}
            onToggle={e => onOptionalToggle(e.currentTarget.open)}
          >
            <summary>Mais detalhes (energia e foco)</summary>
            <section
              class="session-activity-fields"
              data-session-fields="study questions review simulation"
              aria-labelledby="sessionEnergyTitle"
            >
              <h4 id="sessionEnergyTitle">Energia e foco</h4>
              <div class="session-question-fields">
                <SelectField
                  id="sessionModalFocus"
                  label="Nível de foco"
                  aria-label="Nível de foco na sessão"
                  fullWidth
                  options={FOCUS_OPTIONS}
                  value={focusValue}
                  onChange={e => onFocusChange(e.currentTarget.value)}
                />
                <SelectField
                  id="sessionModalEnergy"
                  label="Nível de energia"
                  aria-label="Nível de energia na sessão"
                  fullWidth
                  options={ENERGY_OPTIONS}
                  value={energyValue}
                  onChange={e => onEnergyChange(e.currentTarget.value)}
                />
              </div>
            </section>
          </details>

          <label class="session-notes-label" htmlFor="sessionModalNotes">
            Observação opcional
            <textarea
              class="session-detail-control session-notes"
              id="sessionModalNotes"
              aria-label="Observação da sessão"
              placeholder="Ex.: conceitos revistos, dúvidas ou próximos passos"
              value={notesValue}
              onInput={e => onNotesChange(e.currentTarget.value)}
            />
          </label>
        </div>
      </div>
    </BottomSheet>
  );
}
