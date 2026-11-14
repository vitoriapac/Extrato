import { escapeHtml as defaultEscapeHtml } from '../../core/utils.js';
import { isNarrowViewport } from '../primitives/charts/chart-size.js';
import { subjectColorOf } from '../../domain/subjects/subject-color.js';
/**
 * Controller e renderizador do Radar Multidimensional de Disciplinas e Análise de Desempenho.
 */

export const RADAR_AXIS_META: ReadonlyArray<[string, string]> = [
  ['coverage', 'Cobertura'],
  ['mastery', 'Domínio'],
  ['retention', 'Retenção'],
  ['frequency', 'Frequência'],
  ['consistency', 'Consistência'],
];

export interface SubjectRadarDataModel {
  id: string;
  name: string;
  colorSlot?: number;
  axes: Record<string, number | null>;
  interpretation: string;
  availableAxes: number;
  confidenceLabel: string;
}

export interface RadarSvgOptions {
  selected: SubjectRadarDataModel[];
  axisMeta?: ReadonlyArray<[string, string]>;
  width?: number;
  height?: number;
  maxR?: number;
  escapeHtml?: (s: string) => string;
}

export function renderRadarSvg({
  selected,
  axisMeta = RADAR_AXIS_META,
  // No celular o radar encolhe e ganha folga lateral para os rótulos (o texto mantém o tamanho em px).
  width = isNarrowViewport() ? 440 : 560,
  height = isNarrowViewport() ? 320 : 430,
  maxR = isNarrowViewport() ? 75 : 125,
  escapeHtml = defaultEscapeHtml,
}: RadarSvgOptions): string {
  const N = axisMeta.length;
  const cx = width / 2;
  const cy = isNarrowViewport() ? 160 : 190;
  const angleFor = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;

  const gridRings = [0.25, 0.5, 0.75, 1]
    .map(frac => {
      const pts = axisMeta
        .map((_, i) => {
          const a = angleFor(i);
          const r = maxR * frac;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        })
        .join(' ');
      return `<polygon class="radar-grid" points="${pts}"></polygon>`;
    })
    .join('');

  const axes = axisMeta
    .map((_, i) => {
      const a = angleFor(i);
      return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(a)}" y2="${
        cy + maxR * Math.sin(a)
      }"></line>`;
    })
    .join('');

  const labels = axisMeta
    .map(([, label], i) => {
      const a = angleFor(i);
      const labelR = maxR + 28;
      const x = cx + labelR * Math.cos(a);
      const y = cy + labelR * Math.sin(a);
      const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
      return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle">${label}</text>`;
    })
    .join('');

  const series = selected
    .map((model, seriesIndex) => {
      const values = axisMeta.map(([key]) => model.axes[key]);
      const complete = values.every(value => value !== null);
      const points = values
        .map((value, index) => {
          if (value === null) return '';
          const a = angleFor(index);
          const r = maxR * (value / 100);
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        })
        .filter(Boolean);
      const colorAttr = model.colorSlot
        ? `data-subject-color="${model.colorSlot}" class="radar-shape radar-series-${seriesIndex + 1} subject-color-${model.colorSlot}"`
        : `class="radar-shape radar-series-${seriesIndex + 1}"`;
      const shape = complete
        ? `<polygon ${colorAttr} points="${points.join(' ')}"></polygon>`
        : '';
      const dots = values
        .map((value, index) => {
          if (value === null) return '';
          const a = angleFor(index);
          const r = maxR * (value / 100);
          const dotColorAttr = model.colorSlot
            ? `data-subject-color="${model.colorSlot}" class="radar-dot radar-series-${seriesIndex + 1} subject-color-${model.colorSlot}"`
            : `class="radar-dot radar-series-${seriesIndex + 1}"`;
          return `<circle ${dotColorAttr} cx="${cx + r * Math.cos(a)}" cy="${cy + r * Math.sin(a)}" r="4"><title>${escapeHtml(model.name)} · ${axisMeta[index][1]}: ${value}/100</title></circle>`;
        })
        .join('');
      return shape + dots;
    })
    .join('');

  return `<div class="chart-scroll" tabindex="0" role="region" aria-label="Radar de prontidão por disciplina, com rolagem horizontal"><svg class="radar-svg" role="img" aria-label="Radar de prontidão por disciplina" viewBox="0 0 ${width} ${height}" style="width:100%;max-width:560px;height:auto;display:block;margin:0 auto;">
    ${gridRings}
    ${axes}
    ${series}
    ${labels}
  </svg></div>`;
}

export function renderRadarToolbarHtml(
  subjects: Array<{ id: string; name: string }>,
  selectedIds: string[],
  escapeHtml: (s: string) => string = defaultEscapeHtml,
  escapeAttr: (s: string) => string = defaultEscapeHtml
): string {
  const options = (selectedId = '') =>
    `<option value="">Nenhuma</option>` +
    subjects
      .map(
        subject =>
          `<option value="${escapeAttr(subject.id)}" ${
            subject.id === selectedId ? 'selected' : ''
          }>${escapeHtml(subject.name)}</option>`
      )
      .join('');

  return `<div class="radar-toolbar"><label>Disciplina 1<select data-delegated-change="setRadarSubject(0,this.value)">${options(
    selectedIds[0]
  )}</select></label><label>Comparar com<select data-delegated-change="setRadarSubject(1,this.value)">${options(
    selectedIds[1]
  )}</select></label></div>`;
}

export function renderRadarAnalysisHtml(
  selected: SubjectRadarDataModel[],
  axisMeta = RADAR_AXIS_META,
  escapeHtml: (s: string) => string = defaultEscapeHtml
): string {
  return `<div class="radar-analysis">${selected
    .map(
      (model, index) => {
        const keyColorClass = model.colorSlot
          ? `subject-color-${model.colorSlot}`
          : `radar-key-${index + 1}`;
        const keyDataAttr = model.colorSlot
          ? `data-subject-color="${model.colorSlot}"`
          : '';
        return `<section><h4><span class="radar-key ${keyColorClass}" ${keyDataAttr}></span>${escapeHtml(
          model.name
        )}</h4><p>${escapeHtml(model.interpretation)}</p><small>${model.availableAxes} de 5 eixos · evidência ${model.confidenceLabel.toLowerCase()}</small><dl>${axisMeta
          .map(
            ([key, label]) =>
              `<div><dt>${label}</dt><dd>${
                model.axes[key] === null ? 'Aguardando dados' : model.axes[key] + '/100'
              }</dd></div>`
          )
          .join('')}</dl></section>`;
      }
    )
    .join('')}</div>`;
}

export function renderRadarDisciplinasHtml({
  subjects,
  selectedModels,
  selectedIds,
  axisMeta = RADAR_AXIS_META,
  escapeHtml = defaultEscapeHtml,
  escapeAttr = defaultEscapeHtml,
}: {
  subjects: Array<{ id: string; name: string }>;
  selectedModels: SubjectRadarDataModel[];
  selectedIds: string[];
  axisMeta?: ReadonlyArray<[string, string]>;
  escapeHtml?: (s: string) => string;
  escapeAttr?: (s: string) => string;
}): string {
  if (!subjects.length) {
    return `<div class="radar-empty">Cadastre uma disciplina com tópicos para ver o radar.</div>`;
  }

  const toolbarHtml = renderRadarToolbarHtml(subjects, selectedIds, escapeHtml, escapeAttr);
  const svgHtml = renderRadarSvg({ selected: selectedModels, axisMeta, escapeHtml });
  const analysisHtml = renderRadarAnalysisHtml(selectedModels, axisMeta, escapeHtml);

  return `${toolbarHtml}\n${svgHtml}\n${analysisHtml}`;
}

export interface PerformanceAnalyticsControllerContext {
  getSubjects: () => Array<{ id: string; name: string; topics?: any[] }>;
  getSubjectRadarModel: (subject: any) => SubjectRadarDataModel;
  onRender?: () => void;
  escapeHtml?: (s: string) => string;
  escapeAttr?: (s: string) => string;
}

export function createPerformanceAnalyticsController(ctx: PerformanceAnalyticsControllerContext) {
  const radarView: { subjectIds: string[] } = { subjectIds: [] };
  const escapeHtml = ctx.escapeHtml || defaultEscapeHtml;
  const escapeAttr = ctx.escapeAttr || defaultEscapeHtml;

  function getRadarViewState() {
    return radarView;
  }

  function setRadarSubject(slot: number | string, value: string) {
    const index = Math.max(0, Math.min(1, Number(slot) || 0));
    radarView.subjectIds[index] = value || '';
    if (value) {
      radarView.subjectIds = radarView.subjectIds.map((id, i) =>
        i !== index && id === value ? '' : id
      );
    }
    if (ctx.onRender) ctx.onRender();
  }

  function renderRadarHtml(): string {
    const subjects = ctx.getSubjects().filter(s => s.topics && s.topics.some(t => !t.archived));
    if (!subjects.length) {
      return `<div class="radar-empty">Cadastre uma disciplina com tópicos para ver o radar.</div>`;
    }

    if (
      !radarView.subjectIds[0] ||
      !subjects.some(subject => subject.id === radarView.subjectIds[0])
    ) {
      radarView.subjectIds[0] = subjects[0].id;
    }
    radarView.subjectIds = radarView.subjectIds.slice(0, 2);

    const selectedModels = radarView.subjectIds
      .map(id => subjects.find(subject => subject.id === id))
      .filter((sub): sub is NonNullable<typeof sub> => Boolean(sub))
      .map(sub => {
        const model = ctx.getSubjectRadarModel(sub);
        return {
          ...model,
          colorSlot: subjectColorOf(sub, subjects),
        };
      });

    return renderRadarDisciplinasHtml({
      subjects,
      selectedModels,
      selectedIds: radarView.subjectIds,
      escapeHtml,
      escapeAttr,
    });
  }

  return {
    getRadarViewState,
    setRadarSubject,
    renderRadarHtml,
  };
}
