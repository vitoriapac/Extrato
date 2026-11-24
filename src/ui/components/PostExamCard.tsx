import { useState } from 'preact/hooks';
import type { PostExamModel } from '../../domain/planning/post-exam.js';
import { Icon } from '../primitives/icon.js';

export interface PostExamCardProps {
  model: PostExamModel;
  onSaveAnswers: (answers: { total: string; correct: string; wrong: string }) => void;
  onSaveAppeal: (deadline: string) => void;
  onScheduleAppeal: () => void;
  appealScheduled: boolean;
}

const dec = (value: number) => String(value).replace('.', ',');
// "do corte" e "da meta": o rótulo já vem com o artigo contraído.
const gapText = (gap: number, label: 'do corte' | 'da meta', reference: number) =>
  gap === 0
    ? `${label === 'do corte' ? 'no corte' : 'na meta'} de ${dec(reference)}%`
    : `${dec(Math.abs(gap))} p.p. ${gap > 0 ? 'acima' : 'abaixo'} ${label} de ${dec(reference)}%`;

/** Depois da prova: gabarito preliminar, prazo de recurso e o caminho para o próximo concurso. */
export function PostExamCard({
  model,
  onSaveAnswers,
  onSaveAppeal,
  onScheduleAppeal,
  appealScheduled,
}: PostExamCardProps) {
  const { record } = model;
  const [total, setTotal] = useState(record.total != null ? String(record.total) : '');
  const [correct, setCorrect] = useState(record.correct != null ? String(record.correct) : '');
  const [wrong, setWrong] = useState(record.wrong != null ? String(record.wrong) : '');
  const input = (setter: (value: string) => void) => (event: Event) =>
    setter((event.target as HTMLInputElement).value);

  return (
    <section class="exam-protocol post-exam mb-4" aria-labelledby="postExamTitle">
      <header class="exam-protocol__head">
        <Icon name="certificate" size={16} class="shrink-0" />
        <h3 id="postExamTitle" class="m-0">
          Depois da prova
        </h3>
        <span class="exam-protocol__count">
          há {model.daysSince} {model.daysSince === 1 ? 'dia' : 'dias'}
        </span>
      </header>

      <h4 class="post-exam__subtitle">Gabarito preliminar</h4>
      <form
        class="post-exam__form"
        onSubmit={event => {
          event.preventDefault();
          onSaveAnswers({ total, correct, wrong });
        }}
      >
        <label>
          Questões
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={total}
            onInput={input(setTotal)}
          />
        </label>
        <label>
          Acertos
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={correct}
            onInput={input(setCorrect)}
          />
        </label>
        {model.net && (
          <label>
            Erros
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={wrong}
              onInput={input(setWrong)}
            />
          </label>
        )}
        <button type="submit" class="btn small">
          Calcular nota
        </button>
      </form>
      {model.estimate !== null && (
        <p class="post-exam__result" aria-live="polite">
          {model.net ? 'Nota líquida estimada' : 'Nota estimada'}:{' '}
          <strong>{dec(model.estimate)}%</strong>
          {model.cutoffGap !== null && ` · ${gapText(model.cutoffGap, 'do corte', model.cutoff!)}`}
          {model.targetGap !== null && ` · ${gapText(model.targetGap, 'da meta', model.target!)}`}.
          Pelo gabarito preliminar e sem pesos por disciplina: o resultado oficial pode mudar.
        </p>
      )}

      <h4 class="post-exam__subtitle">Recurso</h4>
      <div class="post-exam__form">
        <label>
          Prazo final
          <input
            type="date"
            value={record.appealDeadline || ''}
            onChange={event => onSaveAppeal((event.target as HTMLInputElement).value)}
          />
        </label>
        {record.appealDeadline && model.appealDaysLeft !== null && (
          <>
            <span class="post-exam__deadline">
              {model.appealDaysLeft === 0
                ? 'O prazo termina hoje.'
                : `Faltam ${model.appealDaysLeft} ${model.appealDaysLeft === 1 ? 'dia' : 'dias'}.`}
            </span>
            <button
              type="button"
              class="btn ghost small"
              disabled={appealScheduled}
              onClick={onScheduleAppeal}
            >
              {appealScheduled ? 'Na Agenda' : 'Pôr na Agenda'}
            </button>
          </>
        )}
      </div>

      <h4 class="post-exam__subtitle">Próximo concurso</h4>
      <p class="exam-protocol__note">
        Disciplinas, histórico, revisões e Caderno de leis continuam. Em{' '}
        <a href="#planejamento/prova">Planejamento › Prova e metas</a>, defina a nova data ou marque
        que o edital ainda não saiu.
      </p>
    </section>
  );
}
