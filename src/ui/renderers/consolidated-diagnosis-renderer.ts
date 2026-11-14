import { formatDecimal } from '../../core/format-number.js';
import { ALERT_SEVERITY_VARIANT, renderBadgeIcon } from '../primitives/badge.js';
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
      <div class="diagnostic-row-action"><span>PRÓXIMO PASSO</span><div class="diagnostic-row-buttons">${action ? `<button class="btn small" type="button" data-study-action-source="${escapeAttr(action.source)}" data-study-action-id="${escapeAttr(action.id)}" data-activity-type="${escapeAttr(action.activityType)}" data-delegated-click="executeStudyRecommendation('${escapeAttr(action.id)}','${escapeAttr(action.source)}')">${escapeHtml(action.label)}</button>` : ''}<button class="btn tertiary small" type="button" data-analysis-nav="desempenho" data-subject-id="${escapeAttr(item.subjectId)}" ${item.topicId ? `data-topic-id="${escapeAttr(item.topicId)}"` : ''}>Ver evolução</button><button class="btn tertiary small" type="button" data-analysis-nav="metas" data-subject-id="${escapeAttr(item.subjectId)}" ${item.topicId ? `data-topic-id="${escapeAttr(item.topicId)}"` : ''}>Planejar ação</button></div></div>
    </article>`;
  };
  // Posição na fila (pontuação) não muda com o filtro: o número do cartão é o lugar na fila.
  const ranked = rows.map((item, index) => ({ item, rank: index }));
  const severity = filters.severity || 'all',
    evidence = filters.evidence || 'all',
    sort = filters.sort || 'queue';
  const matches = ({ item }: { item: Record<string, any> }) =>
    (severity === 'all' || item.severity === severity) &&
    (evidence === 'all' || item.evidenceQuality === evidence);
  const visible = ranked.filter(matches);
  const options = (key: 'severity' | 'evidenceQuality', label: (item: Record<string, any>) => string) => {
    const seen = new Map<string, string>();
    rows.forEach(item => seen.has(item[key]) || seen.set(item[key], label(item)));
    return [...seen];
  };
  const select = (name: string, title: string, current: string, entries: [string, string][], all = 'Todas') =>
    `<label class="diagnosis-filter">${title}<select class="select-control" data-diagnosis-filter="${name}"><option value="${name === 'sort' ? 'queue' : 'all'}">${all}</option>${entries.map(([value, text]) => `<option value="${escapeAttr(value)}"${value === current ? ' selected' : ''}>${escapeHtml(text)}</option>`).join('')}</select></label>`;
  const controls = `<div class="diagnosis-filters">${select('severity', 'Prioridade', severity, options('severity', item => item.severityLabel))}${select('evidence', 'Evidência', evidence, [['high', 'Alta'], ['moderate', 'Média'], ['low', 'Baixa']] as [string, string][])}${select('sort', 'Ordenar disciplinas', sort, [['allocation', 'Tempo × peso no edital'], ['vulnerable', 'Mais vulneráveis']], 'Fila geral')}<span class="diagnosis-filters__count">${visible.length} de ${rows.length} conteúdos</span></div>`;
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
  // Só a disciplina do primeiro da fila abre, e mostra três conteúdos; o resto de cada grupo espera a abertura.
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
  const body = ordered
    .map(([id, group], index) => {
      const open = index === 0;
      // Conteúdo sem registro nenhum ainda não é fraqueza: fica à parte, depois do que já foi estudado.
      const noData = group.items.filter(({ item }) => item.primarySignal === 'collect-evidence');
      const studied = group.items.filter(({ item }) => item.primarySignal !== 'collect-evidence');
      const head = studied.slice(0, 3),
        rest = studied.slice(3);
      const unseen = noData.length
        ? `<details class="performance-more"><summary>Sem evidência registrada · ${noData.length}</summary><template data-lazy>${listOf(noData)}</template></details>`
        : '';
      const more = rest.length
        ? `<details class="performance-more"><summary>Mostrar mais · +${rest.length}</summary><template data-lazy>${listOf(rest)}</template></details>`
        : '';
      const inner = (head.length ? listOf(head) : '') + more + unseen;
      return `<details class="diagnosis-group"${open ? ' open' : ''}><summary><strong>${escapeHtml(group.name)}</strong> · ${group.items.length} ${group.items.length === 1 ? 'conteúdo' : 'conteúdos'}${noData.length ? ` · ${studied.length} com evidência` : ''}${note(id, group)}</summary>${open ? inner : `<template data-lazy>${inner}</template>`}</details>`;
    })
    .join('');
  return `<div class="diagnosis-consolidated"><p class="analytics-note">Um diagnóstico principal por conteúdo, com evidências disponíveis para consulta. ${escapeHtml(SHARED_SIGNALS_LIMITATION)}</p>${controls}${body || '<p class="analytics-note">Nenhum conteúdo com esse filtro.</p>'}<p class="confidence-note">Diagnóstico estimado a partir dos registros disponíveis; não representa certeza de resultado.</p></div>`;
}
