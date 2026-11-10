import { renderIncidenceQuadrants } from './incidence-quadrants-renderer.js';
const escape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char: string) =>
      (
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }) as Record<
          string,
          string
        >
      )[char]
  );
const tagLabel = (tag: string) =>
  ({ 'bb-escriturario': 'Banco do Brasil', 'caixa-tbn': 'Caixa TBN', 'caixa-tbn-ti': 'Caixa TI' })[
    tag
  ] || tag;
const level = (count: number) =>
  count <= 0 ? 'none' : count === 1 ? 'one' : count === 2 ? 'two' : 'many';
const cellText = (count: number) =>
  count ? `${count} ${count === 1 ? 'questão' : 'questões'}` : '0 questões';
const VISIBLE_ROWS = 8;
const options = (items: any[], value: (item: any) => unknown, label: (item: any) => unknown) =>
  items
    .map((item: any) => `<option value="${escape(value(item))}">${escape(label(item))}</option>`)
    .join('');

export function renderExamMatrix(model: Record<string, any>, { selectedTopicId = null }: any = {}) {
  const scopeOptions = [
    { value: 'active', label: 'Concurso ativo' },
    { value: 'all', label: 'Todos os concursos' },
    ...model.options.tags.map((tag: any) => ({ value: tag, label: tagLabel(tag) })),
  ];
  const advancedCount = ['board', 'year', 'role'].filter(
    key => model.filters[key] && model.filters[key] !== 'all'
  ).length;
  // Os controles ficam numa linha de resumo; a dobra lembra se foi aberta (chave estável, não o texto).
  const activeFilters =
    advancedCount +
    (model.filters.subject && model.filters.subject !== 'all' ? 1 : 0) +
    (model.filters.search ? 1 : 0);
  const controls = `<details class="exam-matrix-filters-fold" data-fold-key="exam-filters"><summary>Filtros e busca${activeFilters ? ` (${activeFilters} ${activeFilters === 1 ? 'ativo' : 'ativos'})` : ''}</summary><div class="exam-matrix-filters">
    <label>Concurso<select data-exam-matrix-filter="scope">${options(
      scopeOptions,
      (item: Record<string, any>) => item.value,
      (item: Record<string, any>) => item.label
    )}</select></label>
    <label>Disciplina<select data-exam-matrix-filter="subject">${options(
      [
        { value: 'all', label: 'Todas' },
        ...model.options.subjects.map((value: any) => ({ value, label: value })),
      ],
      (item: Record<string, any>) => item.value,
      (item: Record<string, any>) => item.label
    )}</select></label>
    <label>Ordenar por<select data-exam-matrix-filter="sort">${options(
      [
        { value: 'incidence', label: 'Incidência' },
        { value: 'impact', label: 'Impacto' },
        { value: 'mastery', label: 'Domínio menor' },
        { value: 'gap', label: 'Lacuna' },
        { value: 'subject', label: 'Disciplina' },
      ],
      (item: Record<string, any>) => item.value,
      (item: Record<string, any>) => item.label
    )}</select></label>
    <label class="exam-matrix-search">Buscar tópico<input type="search" data-exam-matrix-search value="${escape(model.filters.search)}" placeholder="Nome do tópico"></label>
    <details class="exam-matrix-more-filters"><summary>Mais filtros${advancedCount ? ` (${advancedCount})` : ''}</summary><div class="exam-matrix-extra-filters">
      <label>Banca<select data-exam-matrix-filter="board">${options(
        [
          { value: 'all', label: 'Todas' },
          ...model.options.boards.map((value: any) => ({ value, label: value })),
        ],
        (item: Record<string, any>) => item.value,
        (item: Record<string, any>) => item.label
      )}</select></label>
      <label>Ano<select data-exam-matrix-filter="year">${options(
        [
          { value: 'all', label: 'Todos' },
          ...model.options.years.map((value: any) => ({
            value: String(value),
            label: String(value),
          })),
        ],
        (item: Record<string, any>) => item.value,
        (item: Record<string, any>) => item.label
      )}</select></label>
      <label>Cargo<select data-exam-matrix-filter="role">${options(
        [
          { value: 'all', label: 'Todos' },
          ...model.options.roles.map((value: any) => ({ value, label: value })),
        ],
        (item: Record<string, any>) => item.value,
        (item: Record<string, any>) => item.label
      )}</select></label>
    </div></details>
  </div></details><div class="exam-matrix-modes" role="group" aria-label="Visualização da matriz"><button type="button" class="btn ghost small ${model.filters.mode === 'history' ? 'active' : ''}" data-exam-matrix-mode="history" aria-pressed="${model.filters.mode === 'history'}">Histórico</button><button type="button" class="btn ghost small ${model.filters.mode === 'priorities' ? 'active' : ''}" data-exam-matrix-mode="priorities" aria-pressed="${model.filters.mode === 'priorities'}">Prioridades</button><button type="button" class="btn ghost small" data-exam-matrix-mode="quadrants" aria-pressed="${model.filters.mode === 'quadrants'}">Incidência × Domínio</button></div>`;
  const summary = `<p class="analytics-note">${model.exams.length} ${model.exams.length === 1 ? 'prova completa' : 'provas completas'} · ${model.analyzedQuestionCount} ${model.analyzedQuestionCount === 1 ? 'questão analisada' : 'questões analisadas'}${model.partialExamCount ? ` · ${model.partialExamCount} ${model.partialExamCount === 1 ? 'prova parcial fora' : 'provas parciais fora'} do denominador` : ''}. Cada célula informa o número de questões; a intensidade é apenas um apoio visual.</p>`;
  if (model.state === 'empty' && model.filters.mode !== 'quadrants')
    return `${controls}${summary}<p class="analytics-note">Nenhuma prova completa corresponde aos filtros. Ajuste o escopo ou importe uma prova com cobertura completa.</p>`;
  const columns = model.exams
    .map(
      (exam: any) =>
        `<th scope="col"><span>${escape(exam.year)}</span><small>${escape(exam.examName)} · ${escape(exam.board)}</small></th>`
    )
    .join('');
  const desktopOf = (rows: any[]) =>
    rows
      .map(
        (row: any) =>
          `<tr><th scope="row"><button type="button" class="exam-matrix-topic" data-exam-matrix-topic="${escape(row.topicId)}">${escape(row.subjectName)} — ${escape(row.name)}</button></th>${row.cells.map((cell: any) => `<td class="exam-matrix-cell is-${level(cell.count)}" title="${escape(cell.examName)}: ${cellText(cell.count)}"><span>${cell.count || '—'}</span><small>${cellText(cell.count)}</small></td>`).join('')}<td>${row.presencePercent ?? '—'}%</td></tr>`
      )
      .join('');
  const mobileOf = (rows: any[]) =>
    rows
      .map(
        (row: any) =>
          `<article class="exam-matrix-card"><button type="button" data-exam-matrix-topic="${escape(row.topicId)}">${escape(row.subjectName)} — ${escape(row.name)}</button><p>Presença ${row.presencePercent ?? '—'}% · ${row.presentExamCount} de ${row.examCount} provas · ${row.questionCount} questões</p><div>${row.cells.map((cell: any) => `<span class="exam-matrix-cell is-${level(cell.count)}">${escape(cell.year)}: ${cellText(cell.count)}</span>`).join('')}</div></article>`
      )
      .join('');
  const selected = model.rows.find((row: any) => row.topicId === selectedTopicId);
  const audit = selected?.audit;
  const comparison = audit
    ? `<div class="exam-matrix-comparison"><h5>Configurado × histórico</h5><p>${escape(audit.configuredSourceLabel)}: ${audit.configuredImpact == null ? 'sem dados' : `${Math.round(audit.configuredImpact)}/100`} · estimativa histórica: ${audit.historicalEstimate == null ? 'sem dados' : `${audit.historicalEstimate}/100`} · impacto usado: ${audit.validatedImpact == null ? 'sem dados' : `${Math.round(audit.validatedImpact)}/100`}.</p><p>${audit.divergence == null ? 'Evidência insuficiente para avaliar divergência.' : `Diferença de ${audit.divergence} pontos · ${audit.status === 'aligned' ? 'configuração alinhada' : audit.status === 'review' ? 'revisar configuração' : 'configuração divergente'}.`} Presença ${audit.presentExamCount} de ${audit.analyzedExamCount} provas · confiança ${escape(audit.confidenceLabel.toLowerCase())}. ${audit.usedHistory ? 'Histórico considerado no impacto estimado.' : 'Configuração preservada.'}</p></div>`
    : '';
  const diagnosis =
    selected?.gap == null
      ? 'Dados insuficientes para medir a lacuna.'
      : selected.gap >= 30
        ? 'Lacuna prioritária'
        : selected.gap >= 10
          ? 'Acompanhar evolução'
          : 'Manter o domínio';
  const detail = selected
    ? `<section class="exam-matrix-detail" aria-label="Detalhamento de ${escape(selected.name)}"><h4>${escape(selected.subjectName)} — ${escape(selected.name)}</h4><div class="exam-matrix-detail-grid"><div><h5>Prova</h5><p><strong>Incidência ${selected.presencePercent ?? '—'}%</strong> · ${selected.presentExamCount} de ${selected.examCount} provas · ${selected.questionCount} questões</p><p>Participação ${selected.participationPercent ?? '—'}% · impacto ${selected.impact == null ? 'sem dados' : `${Math.round(selected.impact)}/100`} · confiança ${escape(selected.confidenceLabel.toLowerCase())}</p></div><div><h5>Você · Sua situação</h5><p>Seu domínio ${selected.mastery == null ? 'sem dados' : `${Math.round(selected.mastery)}/100`} · retenção ${selected.retention == null ? 'sem dados' : `${Math.round(selected.retention)}/100`}</p><p>${selected.personalQuestionCount} questões pessoais · precisão ${selected.personalAccuracy == null ? 'sem dados' : selected.personalAccuracy + '%'}</p><p>Tendência ${escape(selected.trend?.direction || 'sem dados')} · prioridade ${selected.priority == null ? 'sem dados' : `${Math.round(selected.priority)}/100`}</p></div></div><p><strong>Diagnóstico:</strong> ${diagnosis}</p><details><summary>Questões por prova</summary><ul>${selected.cells.map((cell: any) => `<li>${escape(cell.examName)} (${cell.year}): ${cellText(cell.count)}${cell.weight == null ? '' : ` · peso somado ${cell.weight}`}</li>`).join('')}</ul></details>${comparison}<button class="btn ghost small" type="button" data-delegated-click="navigateKpi('hoje')">Ver ações de estudo em Hoje</button></section>`
    : '';
  const priorityRowsOf = (rows: any[]) =>
    rows
      .map(
        (row: any) =>
          `<tr><th scope="row"><button type="button" class="exam-matrix-topic" data-exam-matrix-topic="${escape(row.topicId)}">${escape(row.subjectName)} — ${escape(row.name)}</button></th><td>${row.presencePercent ?? '—'}%</td><td>${row.mastery == null ? '—' : Math.round(row.mastery)}</td><td>${row.impact == null ? '—' : Math.round(row.impact)}</td><td>${row.gap == null ? 'Dados insuficientes' : row.gap >= 30 ? 'Lacuna prioritária' : row.gap >= 10 ? 'Acompanhar' : 'Manutenção'}</td></tr>`
      )
      .join('');
  const priorityCardsOf = (rows: any[]) =>
    rows
      .map(
        (row: any) =>
          `<article class="exam-matrix-card"><button type="button" data-exam-matrix-topic="${escape(row.topicId)}">${escape(row.subjectName)} — ${escape(row.name)}</button><p>Incidência ${row.presencePercent ?? '—'}% · domínio ${row.mastery == null ? '—' : Math.round(row.mastery)} · impacto ${row.impact == null ? '—' : Math.round(row.impact)} · ${row.gap == null ? 'dados insuficientes' : row.gap >= 30 ? 'lacuna prioritária' : row.gap >= 10 ? 'acompanhar' : 'manutenção'}</p></article>`
      )
      .join('');
  // Oito linhas à vista; o restante da lista fica sob "Mostrar mais · +N" (cabeçalho repetido para a tabela continuar legível).
  const firstRows = model.rows.slice(0, VISIBLE_ROWS);
  const restRows = model.rows.slice(VISIBLE_ROWS);
  const more = (body: string) =>
    restRows.length
      ? `<details class="performance-more"><summary>Mostrar mais · +${restRows.length}</summary><template data-lazy>${body}</template></details>`
      : '';
  const prioritiesTable = (rows: any[], caption: string) =>
    `<div class="exam-matrix-table-wrap"><table class="exam-matrix-table"><caption>${caption}</caption><thead><tr><th scope="col">Tópico</th><th scope="col">Incidência</th><th scope="col">Domínio</th><th scope="col">Impacto</th><th scope="col">Situação</th></tr></thead><tbody>${priorityRowsOf(rows)}</tbody></table></div>`;
  const priorities = `${prioritiesTable(firstRows, 'Prioridades por tópico')}<div class="exam-matrix-cards">${priorityCardsOf(firstRows)}</div>${more(`${prioritiesTable(restRows, 'Demais prioridades por tópico')}<div class="exam-matrix-cards">${priorityCardsOf(restRows)}</div>`)}`;
  const historyTable = (rows: any[], caption: string) =>
    `<div class="exam-matrix-table-wrap"><table class="exam-matrix-table"><caption>${caption}</caption><thead><tr><th scope="col">Tópico</th>${columns}<th scope="col">Incidência</th></tr></thead><tbody>${desktopOf(rows)}</tbody></table></div>`;
  const history = `${historyTable(firstRows, 'Matriz histórica por tópico e prova')}<div class="exam-matrix-cards">${mobileOf(firstRows)}</div>${more(`${historyTable(restRows, 'Demais tópicos da matriz histórica')}<div class="exam-matrix-cards">${mobileOf(restRows)}</div>`)}`;
  const html = `${controls}${summary}${model.rows.length ? (model.filters.mode === 'quadrants' ? renderIncidenceQuadrants(model.rows) : model.filters.mode === 'priorities' ? priorities : history) : '<p class="analytics-note">Nenhum tópico corresponde à busca e aos filtros.</p>'}${detail}`;
  return html;
}

export function renderExamOpportunity(model: Record<string, any>) {
  const candidates = model.rows.filter(
    (row: any) =>
      row.presencePercent >= 50 &&
      row.mastery != null &&
      row.mastery < 70 &&
      ['moderate', 'high'].includes(row.confidence)
  );
  candidates.sort(
    (a: any, b: any) =>
      (b.gap ?? -1) - (a.gap ?? -1) ||
      (b.priority ?? -1) - (a.priority ?? -1) ||
      a.name.localeCompare(b.name, 'pt-BR')
  );
  const row = candidates[0];
  if (!row)
    return '<p class="analytics-note">Nenhum tópico deste recorte reúne presença em 50% ou mais das provas, domínio abaixo de 70 e confiança moderada ou alta, então não há oportunidade a destacar. Ajuste os filtros da matriz para ver outros recortes. Esta leitura usa só a incidência histórica; a lista de tópicos prioritários usa a prioridade calculada do app.</p>';
  return `<div class="exam-opportunity"><span class="module-heading__eyebrow">Maior oportunidade no recorte</span><strong>${escape(row.subjectName)} — ${escape(row.name)}</strong><p>Incidência ${row.presencePercent}% · domínio ${Math.round(row.mastery)}/100 · confiança ${escape(row.confidenceLabel.toLowerCase())}</p><button class="btn ghost small" type="button" data-analysis-nav="hoje" data-subject-id="${escape(row.subjectId)}" data-topic-id="${escape(row.topicId)}">Ver diagnóstico</button></div>`;
}
