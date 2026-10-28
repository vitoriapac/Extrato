import type { JSX } from 'preact';
import { EbbinghausSimulator } from './EbbinghausSimulator.js';

export interface HelpVisualData {
  type: string;
  title?: string;
  planned?: number;
  actual?: number;
  progress?: number;
  completed?: number;
  total?: number;
  subject?: string;
  topic?: string;
  activity?: string;
  minutes?: number;
  value?: number;
  previous?: number;
  recent?: number;
  load?: number;
  priorities?: number;
  steps?: Array<{ title: string; detail?: string } | string>;
  rows?: Array<{
    label: string;
    before?: number;
    after?: number;
    planned?: number;
    actual?: number;
  }>;
  weeks?: Array<{ label: string; planned: number; actual: number }>;
  cells?: Array<{ title: string; detail: string }>;
  topics?: string[];
  items?: Array<{ title: string; detail: string }>;
  [key: string]: any;
}

export interface HelpVisualProps {
  visual: HelpVisualData | null | undefined;
}

const num = (value: unknown): number => Math.max(0, Number(value) || 0);

export function HelpVisualRenderer({ visual }: HelpVisualProps): JSX.Element | null {
  if (!visual || !visual.type) return null;

  if (visual.type === 'simulator-ebbinghaus') {
    return <EbbinghausSimulator />;
  }

  const renderSteps = (items: Array<any> | undefined, className: string) => (
    <ol class={className}>
      {(items || []).map((step, index) => {
        const title = typeof step === 'string' ? step : step.title;
        const detail = typeof step === 'object' ? step.detail : undefined;
        return (
          <li key={index}>
            <span class="instruction-step-number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <strong>{title}</strong>
            {detail && <small>{detail}</small>}
          </li>
        );
      })}
    </ol>
  );

  let content: JSX.Element | null = null;

  switch (visual.type) {
    case 'flow':
      content = renderSteps(visual.steps, 'instruction-flow');
      break;

    case 'reviews':
      content = renderSteps(visual.steps, 'instruction-steps');
      break;

    case 'comparison':
      content = (
        <>
          <div class="instruction-comparison">
            <div class="instruction-metric">
              <strong>{num(visual.planned)} min</strong>
              <span>Planejado</span>
            </div>
            <div class="instruction-metric">
              <strong>{num(visual.actual)} min</strong>
              <span>Realizado</span>
            </div>
          </div>
          <p class="instruction-legend">O tempo registrado pode ser diferente do previsto.</p>
        </>
      );
      break;

    case 'daily':
      content = (
        <>
          <div class="instruction-comparison">
            <div class="instruction-metric">
              <strong>{num(visual.planned)} min</strong>
              <span>Planejado</span>
            </div>
            <div class="instruction-metric">
              <strong>{num(visual.actual)} min</strong>
              <span>Realizado</span>
            </div>
          </div>
          <p>{num(visual.progress)}% de progresso do plano</p>
          <div class="instruction-example-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, num(visual.progress))}%` }}></span>
          </div>
          <p class="instruction-legend">
            {num(visual.completed)} de {num(visual.total)} atividade concluída
          </p>
        </>
      );
      break;

    case 'action':
      content = (
        <>
          <strong>{visual.subject}</strong>
          <p>{visual.topic}</p>
          <p>
            {visual.activity} · {num(visual.minutes)} min
          </p>
          <span class="instruction-action">▶ Iniciar estudo</span>
          <p class="instruction-legend">Representação de uma atividade; não inicia uma sessão.</p>
        </>
      );
      break;

    case 'allocation': {
      const rows = visual.rows || [];
      const total = num(visual.total);
      content = (
        <div class="instruction-allocation">
          <div class="instruction-allocation-row instruction-legend">
            <span>Disciplina</span>
            <span>Atual</span>
            <span>Proposta</span>
          </div>
          {rows.map((row, index) => {
            const before = num(row.before);
            const after = num(row.after);
            const diffText =
              after > before
                ? `Aumento de ${after - before} minutos`
                : after < before
                  ? `Redução de ${before - after} minutos`
                  : 'Sem alteração';
            return (
              <div class="instruction-allocation-row" key={index}>
                <strong>{row.label}</strong>
                <span>{before} min</span>
                <span>
                  {after} min<small>{diffText}</small>
                </span>
              </div>
            );
          })}
          <div class="instruction-allocation-row">
            <strong>Total</strong>
            <span>{total} min</span>
            <span>{total} min</span>
          </div>
        </div>
      );
      break;
    }

    case 'weekly-bars': {
      const weeks = visual.weeks || [];
      content = (
        <>
          {weeks.map((week, index) => {
            const planned = num(week.planned);
            const actual = num(week.actual);
            const actualPct = planned > 0 ? (actual / planned) * 100 : 0;
            return (
              <div class="instruction-week" key={index}>
                <strong>{week.label}</strong>
                <p>
                  Planejado: {planned} min · Realizado: {actual} min
                </p>
                <div class="instruction-example-bar" aria-hidden="true">
                  <span style={{ width: '100%' }}></span>
                </div>
                <div
                  class="instruction-example-bar instruction-example-bar--actual"
                  aria-hidden="true"
                >
                  <span style={{ width: `${Math.min(100, actualPct)}%` }}></span>
                </div>
              </div>
            );
          })}
        </>
      );
      break;
    }

    case 'readiness':
      content = (
        <>
          <div class="instruction-metric">
            <strong>{num(visual.value)} / 100</strong>
            <span>Índice de Prontidão</span>
          </div>
          <div class="instruction-example-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, num(visual.value))}%` }}></span>
          </div>
          <p class="instruction-callout">Não representa probabilidade de aprovação.</p>
        </>
      );
      break;

    case 'sample':
      content = (
        <>
          <p>Período anterior: {num(visual.previous)} questões</p>
          <p>Período recente: {num(visual.recent)} questões</p>
          <p class="instruction-legend">
            Amostra insuficiente não significa desempenho ruim. Os requisitos variam por análise.
          </p>
        </>
      );
      break;

    case 'adherence': {
      const rows = visual.rows || [];
      content = (
        <>
          <ul class="instruction-steps">
            {rows.map((row, index) => (
              <li key={index}>
                <strong>{row.label}</strong>
                <span>
                  Planejado: {num(row.planned)} min · Realizado: {num(row.actual)} min
                </span>
              </li>
            ))}
          </ul>
          <div class="instruction-comparison">
            <div class="instruction-metric">
              <strong>{num(visual.load)}%</strong>
              <span>Aderência de carga</span>
            </div>
            <div class="instruction-metric">
              <strong>{num(visual.priorities)}%</strong>
              <span>Prioridades executadas</span>
            </div>
          </div>
        </>
      );
      break;
    }

    case 'matrix': {
      const cells = visual.cells || [];
      content = (
        <ul class="instruction-matrix">
          {cells.map((cell, index) => (
            <li key={index}>
              <strong>{cell.title}</strong>
              <p>{cell.detail}</p>
            </li>
          ))}
        </ul>
      );
      break;
    }

    case 'tree': {
      const topics = visual.topics || [];
      content = (
        <>
          <strong>{visual.subject}</strong>
          <ul class="instruction-tree">
            {topics.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
        </>
      );
      break;
    }

    case 'reference': {
      const items = visual.items || [];
      content = (
        <ul class="instruction-reference">
          {items.map((item, index) => (
            <li key={index}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </li>
          ))}
        </ul>
      );
      break;
    }

    default:
      return null;
  }

  return (
    <figure class="instruction-example">
      <figcaption>Exemplo ilustrativo · {visual.title}</figcaption>
      {content}
    </figure>
  );
}
