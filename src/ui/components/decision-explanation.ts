// Explanations use factors supplied by application models; no calculation here.
export function renderDecisionExplanation(
  {
    title = 'Por que esta análise?',
    factors = [],
    evidence = '',
    confidence = '',
    method = '',
    helpTopic = null,
    footer = '',
  }: {
    title?: string;
    factors?: Array<Record<string, any>>;
    evidence?: string;
    confidence?: string;
    method?: string;
    helpTopic?: string | null;
    /** HTML já montado, no fim da dobra (ex.: ponto de montagem da calibração). */
    footer?: string;
  },
  {
    escapeHtml,
    escapeAttr = escapeHtml,
  }: { escapeHtml: (value: unknown) => string; escapeAttr?: (value: unknown) => string }
) {
  return (
    '<details class="achievement-projection__details decision-explanation"><summary>' +
    escapeHtml(title) +
    '</summary>' +
    (factors.length
      ? '<ul>' + factors.map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>'
      : '') +
    (evidence ? '<p>' + escapeHtml(evidence) + '</p>' : '') +
    (confidence ? '<p>' + escapeHtml(confidence) + '</p>' : '') +
    (method
      ? '<div class="projection-evidence-method"><h5>Faixa, confiança e limites</h5>' +
        (helpTopic
          ? '<button type="button" class="btn ghost small" data-help-topic-link="' +
            escapeAttr(helpTopic) +
            '">Entenda faixa e confiança na ajuda</button>'
          : '') +
        method +
        '</div>'
      : '') +
    footer +
    '</details>'
  );
}
