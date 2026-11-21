import { formatDecimal } from '../../core/format-number.js';
import { ALERT_SEVERITY_VARIANT, renderBadgeIcon } from '../primitives/badge.js';
import { renderGapImpactChart } from '../performance/gap-impact-chart.js';
import { renderDiagnosticSummary } from './diagnostic-summary-renderer.js';
import { SHARED_SIGNALS_LIMITATION } from '../../application/diagnostics/build-consolidated-signals.js';

export function renderConsolidatedDiagnosis(
  model: Record<string, any>,
  { studyActionForItem, escapeHtml, escapeAttr, filters = {}, allocation = {} }: any
) {
  const rows = [...(model.topics || []), ...(model.subjects || [])].filter(
    item => item.primarySignal
  );
  if (!rows.length)
    return '<div class="empty-state empty-state--compact diagnosis-empty-state" role="status"><strong>Nenhum diagnóstico principal disponível</strong><p>Registre sessões, questões e revisões para reunir evidências no concurso ativo. A ausência de alerta não confirma consolidação.</p></div>';
  const renderRow = (item: Record<string, any>, index: number) => {
    const primary = item.signals.find(
      (signal: any) => signal.kind === item.primarySignal && signal.active
    );
    const action = studyActionForItem(item);
    // Prioridade crítica com evidência baixa é provisória: tom de atenção, não de alarme.
    const provisional =
      item.severity === 'critical' && ['low', 'unassessed'].includes(item.evidenceQuality);
    const badgeVariant = provisional ? 'warning' : ALERT_SEVERITY_VARIANT[item.severity] || 'info';
    const badgeLabel = provisional ? 'Prioridade provisória' : item.severityLabel;
    return `<article class="diagnostic-row consolidated-diagnosis-row" tabindex="-1" data-diagnosis-subject-id="${escapeAttr(item.subjectId)}" ${item.topicId ? `data-diagnosis-topic-id="${escapeAttr(item.topicId)}"` : ''} data-consolidated-state="${escapeAttr(item.state)}" data-consolidated-signal="${escapeAttr(item.primarySignal)}" data-consolidated-evidence-quality="${escapeAttr(item.evidenceQuality)}" ${action ? `data-study-action-source="${escapeAttr(action.source)}" data-study-action-id="${escapeAttr(action.id)}" data-activity-type="${escapeAttr(action.activityType)}"` : ''}>
      <div class="diagnostic-row-heading"><div class="diagnostic-row-identity"><span class="diagnostic-kicker">${index + 1} · ${item.granularity === 'subject' ? 'DISCIPLINA' : 'TÓPICO'}</span><strong>${escapeHtml(item.name || 'Conteúdo sem nome')}</strong>${item.granularity === 'topic' && item.subjectName ? `<small>${escapeHtml(item.subjectName)}</small>` : ''}</div><span class="status-badge status-badge--${badgeVariant}"${provisional ? ' title="Evidência baixa: a prioridade pode mudar com mais registros."' : ''}>${badgeVariant === 'danger' ? renderBadgeIcon(badgeVariant) : ''}${escapeHtml(badgeLabel)}</span></div>
      ${renderDiagnosticSummary(item, primary, { escapeHtml })}
      <div class="diagnostic-row-action"><span>PRÓXIMO PASSO</span><div class="diagnostic-row-buttons">${action ? `<button class="btn small" type="button" data-study-action-source="${escapeAttr(action.source)}" data-study-action-id="${escapeAttr(action.id)}" data-activity-type="${escapeAttr(action.activityType)}" data-delegated-click="executeStudyRecommendation('${escapeAttr(action.id)}','${escapeAttr(action.source)}')">${escapeHtml(action.label)}</button>` : ''}<details class="diagnostic-row-more"><summary>Mais ações</summary><div class="diagnostic-row-buttons"><button class="btn tertiary small" type="button" data-analysis-nav="desempenho" data-subject-id="${escapeAttr(item.subjectId)}" ${item.topicId ? `data-topic-id="${escapeAttr(item.topicId)}"` : ''}>Ver evolução</button><button class="btn tertiary small" type="button" data-analysis-nav="metas" data-subject-id="${escapeAttr(item.subjectId)}" ${item.topicId ? `data-topic-id="${escapeAttr(item.topicId)}"` : ''}>Planejar ação</button></div></details></div></div>
    </article>`;
  };
  // Posição na fila (pontuação) não muda com o filtro: o número do cartão é o lugar na fila.
  const ranked = rows.map((item, index) => ({ item, rank: index }));
  const severity = filters.severity || 'all',
    evidence = filters.evidence || 'all',
    sort = filters.sort || 'queue',
    search = String(filters.search || '').trim();
  const fold = (text: unknown) =>
    String(text ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  const needle = fold(search);
  const matches = ({ item }: { item: Record<string, any> }) =>
    (severity === 'all' || item.severity === severity) &&
    (evidence === 'all' || item.evidenceQuality === evidence) &&
    (!needle || fold(item.name).includes(needle) || fold(item.subjectName).includes(needle));
  const visible = ranked.filter(matches);
  const filtering = severity !== 'all' || evidence !== 'all' || Boolean(needle);
  // Sem filtro, os tópicos sem registro ficam fora dos grupos: o contador diz quantos aparecem e quantos estão ocultos.
  const hiddenNoData = filtering ? 0 : visible.filter(({ item }) => item.primarySignal === 'collect-evidence').length;
  const countText =
    hiddenNoData > 0
      ? `${visible.length - hiddenNoData} de ${rows.length} itens com registro (${hiddenNoData} sem registro, ocultos)`
      : `${visible.length} de ${rows.length} itens com sinal de diagnóstico`;
  const options = (key: 'severity' | 'evidenceQuality', label: (item: Record<string, any>) => string) => {
    const seen = new Map<string, string>();
    rows.forEach(item => seen.has(item[key]) || seen.set(item[key], label(item)));
    return [...seen];
  };
  const select = (name: string, title: string, current: string, entries: [string, string][], all = 'Todas') =>
    `<label class="diagnosis-filter">${title}<select class="select-control" data-diagnosis-filter="${name}"><option value="${name === 'sort' ? 'queue' : 'all'}">${all}</option>${entries.map(([value, text]) => `<option value="${escapeAttr(value)}"${value === current ? ' selected' : ''}>${escapeHtml(text)}</option>`).join('')}</select></label>`;
  // No topo só a busca, a contagem e o controle "Filtros" (≤ 4 opções à vista); os três filtros ficam na dobra.
  const activeFilters = [severity !== 'all', evidence !== 'all', sort !== 'queue', Boolean(search)].filter(Boolean).length;
  const controls = `<div class="diagnosis-toolbar"><label class="diagnosis-search">Buscar tópico<input type="search" class="select-control" data-diagnosis-search value="${escapeAttr(search)}" placeholder="Nome do tópico ou da disciplina" autocomplete="off"></label><details class="diagnosis-filters-fold" data-fold-key="diagnosis-filters"${activeFilters ? ' open' : ''}><summary>Filtros${activeFilters ? ` (${activeFilters} ${activeFilters === 1 ? 'ativo' : 'ativos'})` : ''}</summary><div class="diagnosis-filters">${select('severity', 'Prioridade', severity, options('severity', item => item.severityLabel))}${select('evidence', 'Evidência', evidence, [['high', 'Alta'], ['moderate', 'Média'], ['low', 'Baixa']] as [string, string][])}${select('sort', 'Ordenar disciplinas', sort, [['allocation', 'Tempo × peso no edital'], ['vulnerable', 'Mais vulneráveis']], 'Fila geral')}</div></details>${activeFilters ? '<button type="button" class="btn ghost small" data-diagnosis-reset>Restaurar padrão</button>' : ''}<span class="diagnosis-filters__count" role="status">${countText}</span></div><details class="limits-disclosure diagnosis-legend-details"><summary>Legenda dos rótulos</summary><p class="analytics-note diagnosis-legend"><strong>Lacuna:</strong> domínio abaixo do esperado em tópico de impacto alto na prova. <strong>Prioridade provisória:</strong> prioridade alta com evidência baixa; pode mudar com mais registros. <strong>Evidência:</strong> conta as questões e sessões de cada tópico, não da disciplina inteira.</p></details>`;
  const groups = new Map<string, { name: string; items: { item: Record<string, any>; rank: number }[] }>();
  visible.forEach(entry => {
    const { item } = entry;
    const group = groups.get(item.subjectId) || {
      name: (item.granularity === 'subject' ? item.name : item.subjectName) || 'Sem disciplina',
      items: [] as { item: Record<string, any>; rank: number }[],
    };
    group.items.push(entry);
    groups.set(item.subjectId, group);
  });
  // Só a disciplina do primeiro da fila abre, e mostra três tópicos; o resto de cada grupo espera a abertura.
  const listOf = (entries: typeof visible) =>
    `<div class="diagnosis-consolidated-list">${entries.map(({ item, rank }) => renderRow(item, rank)).join('')}</div>`;
  // Balanço (tempo × peso) e Radar (críticos) são maneiras de ordenar as disciplinas, não painéis à parte.
  const gap = (id: string) =>
    allocation[id] ? allocation[id].examWeightPercent - allocation[id].timePercent : -Infinity;
  const criticals = (group: { items: { item: Record<string, any> }[] }) =>
    group.items.filter(({ item }) => item.severity === 'critical').length;
  const ordered = [...groups.entries()];
  if (sort === 'allocation') ordered.sort(([a], [b]) => gap(b) - gap(a));
  if (sort === 'vulnerable') ordered.sort(([, a], [, b]) => criticals(b) - criticals(a));
  const note = (id: string, group: any) =>
    sort === 'allocation' && allocation[id]
      ? ` · tempo ${formatDecimal(allocation[id].timePercent)}% · edital ${formatDecimal(allocation[id].examWeightPercent)}%`
      : sort === 'vulnerable'
        ? ` · ${criticals(group)} ${criticals(group) === 1 ? 'crítico' : 'críticos'}`
        : '';
  // Tópicos de cada disciplina no escopo, com e sem sinal: quem não tem nenhum sinal não vira linha da fila (D12).
  const topicTotals = new Map<string, number>();
  for (const item of (model.topics || []) as Array<{ subjectId: string }>)
    topicTotals.set(item.subjectId, (topicTotals.get(item.subjectId) || 0) + 1);
  const dropped = model.suggestedDropped as { subjectId: string } | undefined;
  if (dropped) topicTotals.set(dropped.subjectId, (topicTotals.get(dropped.subjectId) || 0) + 1);
  const topicCount = (id: string, group: { items: { item: { granularity?: string } }[] }) => {
    const listed = group.items.filter(({ item }) => item.granularity === 'topic').length;
    const total = topicTotals.get(id) || listed;
    const noun = (total === 1 ? 'tópico' : 'tópicos') + (total > listed ? ' no escopo' : '');
    return total > listed ? `${listed} de ${total} ${noun}` : `${listed} ${noun}`;
  };
  const groupsHtml = ordered
    .map(([id, group], index) => {
      const open = index === 0;
      // Conteúdo sem registro nenhum ainda não é fraqueza: fica à parte, depois do que já foi estudado.
      const noData = group.items.filter(({ item }) => item.primarySignal === 'collect-evidence');
      const studied = group.items.filter(({ item }) => item.primarySignal !== 'collect-evidence');
      // Três cartões à vista; o resto do grupo entra na lista progressiva (sem dobra dentro da dobra do grupo).
      // Sem filtro de evidência, o conteúdo sem registro não vira lista em cada disciplina: a contagem está no título do
      // grupo e há um caminho só, acima da lista. Com algum filtro ligado, eles aparecem aqui.
      const unseen = noData.length && filtering ? listOf(noData) : '';
      const inner = (studied.length ? listOf(studied) : '') + unseen;
      // Grupo sem nada para abrir (só conteúdo sem evidência) é uma linha, não uma dobra vazia.
      if (!inner)
        return `<p class="diagnosis-group-line"><strong>${escapeHtml(group.name)}</strong> · ${topicCount(id, group)}${noData.length ? ` · ${studied.length} com evidência` : ''}${note(id, group)}</p>`;
      return `<details class="diagnosis-group"${open ? ' open' : ''}><summary><strong>${escapeHtml(group.name)}</strong> · ${topicCount(id, group)}${noData.length ? ` · ${studied.length} com evidência` : ''}${note(id, group)}</summary>${open ? inner : `<template data-lazy>${inner}</template>`}</details>`;
    })
    .join('');
  // Oito disciplinas à vista; as demais entram na lista progressiva ("Mostrar mais · +N").
  const body = groupsHtml ? `<div class="diagnosis-groups">${groupsHtml}</div>` : '';
  const unseenAll = ordered.flatMap(([, group]) =>
    group.items.filter(({ item }: any) => item.primarySignal === 'collect-evidence')
  );
  const unseenNote =
    !filtering && unseenAll.length
      ? `<p class="analytics-note diagnosis-unseen-note"><strong>${unseenAll.length}</strong> ${unseenAll.length === 1 ? 'tópico sem nenhum registro ainda fica' : 'tópicos sem nenhum registro ainda ficam'} fora dos grupos abaixo. <button type="button" class="btn ghost small" data-diagnosis-severity="${escapeAttr(unseenAll[0].item.severity)}">Ver os ${unseenAll.length}</button></p>`
      : '';
  return `<div class="diagnosis-consolidated">${renderGapImpactChart(rows, { escapeHtml })}${controls}${unseenNote}${body || '<p class="analytics-note">Nenhum tópico com esse filtro.</p>'}<details class="limits-disclosure diagnosis-reading-guide"><summary>Como ler a fila</summary><p class="analytics-note">${escapeHtml(SHARED_SIGNALS_LIMITATION)}</p><p class="analytics-note diagnosis-scope-note" data-diagnosis-scope-note>Só entram na fila os tópicos do concurso ativo que têm algum sinal de diagnóstico; "N de M" mostra quantos tópicos da disciplina aparecem, e o total M é o de Disciplinas.${dropped ? ' O tópico da sugestão aparece acima e não se repete na fila.' : ''}</p></details><p class="confidence-note">Diagnóstico estimado a partir dos registros disponíveis; não representa certeza de resultado.</p></div>`;
}
